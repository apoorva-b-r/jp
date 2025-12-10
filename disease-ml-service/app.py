from flask import Flask, request, jsonify
from flask_cors import CORS 
import torch
import joblib
import re
import os
import json
import torch.nn.functional as F
from model import SymptomClassifier 

app = Flask(__name__)
CORS(app) 

# --- Global Artifacts and Configuration (Mirrors test_prediction.py) ---
MODEL = None
VECTORIZER = None
ENCODER = None
DISEASE_SYMPTOM_MAP = None
DEVICE = torch.device("cpu") 
TEMPERATURE = 2.0 # T > 1 softens probabilities

STOP_WORDS = set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 
    'yours', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 
    'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 
    'with', 'about', 'against', 'between', 'into', 'through', 'during', 
    'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 
    'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 
    'can', 'will', 'just', 'don', 'should', 'now'
])

SEVERITY_LEVELS = {
    'chest_pain': 5, 'breathlessness': 5, 'heart_attack': 5, 'paralysis_(brain_hemorrhage)': 5,
    'coma': 5, 'blood_in_sputum': 5, 'acute_liver_failure': 5, 'altered_sensorium': 5,
    'fast_heart_rate': 4, 'high_fever': 3, 'loss_of_balance': 3, 'unsteadiness': 3, 
    'weakness_of_one_body_side': 3, 'pain_behind_the_eyes': 3, 'dehydration': 3, 'vomiting': 3, 
    'chills': 3, 'joint_pain': 3, 'abdominal_pain': 3, 'diarrhoea': 3, 'yellowish_skin': 3, 
    'dark_urine': 3, 'swelling_joints': 3, 'painful_walking': 3, 'dizziness': 3, 'stiff_neck': 3, 
    'blurred_and_distorted_vision': 3, 'constipation': 3, 'sweating': 3, 'fatigue': 2, 
    'headache': 2, 'nausea': 2, 'cough': 2, 'skin_rash': 2, 'muscle_pain': 2, 'lethargy': 2, 
    'weight_loss': 2, 'loss_of_appetite': 2, 'restlessness': 2, 'mood_swings': 2, 'itching': 1, 
    'continuous_sneezing': 1, 'runny_nose': 1, 'acidity': 1, 'indigestion': 1
}

# --- CRITICAL PREPROCESSING & LOGIC FUNCTIONS ---
def clean_symptoms(symptom_string):
    """Cleans the symptom text for the Vectorizer and removes stop words."""
    if not isinstance(symptom_string, str):
        symptom_string = ""
    symptom_string = symptom_string.lower().replace('_', ' ').replace('-', ' ')
    symptoms_list = re.split(r'[,\s]+', symptom_string)
    cleaned_tokens = [s.strip() for s in symptoms_list if s.strip() and s.strip() not in STOP_WORDS]
    return " ".join(cleaned_tokens)

def get_next_question(probabilities, collected_symptoms, denied_symptoms):
    """Suggests the next most informative symptom to ask about."""
    k_diseases = min(2, len(ENCODER.classes_))
    _, top_indices = torch.topk(probabilities, k=k_diseases)
    top_diseases = ENCODER.inverse_transform(top_indices.flatten().tolist())

    if len(top_diseases) < 2: return None

    disease1, disease2 = top_diseases[0], top_diseases[1]
    symptoms1 = set(DISEASE_SYMPTOM_MAP.get(disease1, []))
    symptoms2 = set(DISEASE_SYMPTOM_MAP.get(disease2, []))

    all_asked_symptoms = set(collected_symptoms.keys()) | set(denied_symptoms)
    
    differentiating_symptoms = list(symptoms1.symmetric_difference(symptoms2))
    unasked_differentiating = [s for s in differentiating_symptoms if s not in all_asked_symptoms]

    if unasked_differentiating:
        ranked_questions = sorted(unasked_differentiating, key=lambda s: SEVERITY_LEVELS.get(s, 0), reverse=True)
        return ranked_questions[0]

    unasked_top_disease = [s for s in symptoms1 if s not in all_asked_symptoms]
    if unasked_top_disease:
        ranked_fallback = sorted(unasked_top_disease, key=lambda s: SEVERITY_LEVELS.get(s, 0), reverse=True)
        return ranked_fallback[0]

    return None

def load_artifacts():
    """Loads all saved model components when the app starts."""
    global MODEL, VECTORIZER, ENCODER, DISEASE_SYMPTOM_MAP
    print("Loading ML artifacts...")
    try:
        ENCODER = joblib.load('artifacts/label_encoder.pkl')
        VECTORIZER = joblib.load('artifacts/tfidf_vectorizer.pkl')
        with open('artifacts/disease_symptom_map.json', 'r') as f:
            DISEASE_SYMPTOM_MAP = json.load(f)
        
        num_classes = len(ENCODER.classes_)
        input_size = len(VECTORIZER.vocabulary_) 
        
        MODEL = SymptomClassifier(input_size, num_classes).to(DEVICE)
        MODEL.load_state_dict(torch.load('artifacts/model_weights.pth', map_location=DEVICE))
        MODEL.eval()
        
        print("✅ ML artifacts loaded successfully.")
    except Exception as e:
        print(f"❌ FAILED TO LOAD ARTIFACTS: {e}")
        MODEL = None 

@app.route('/predict', methods=['POST'])
def predict():
    if not all([MODEL, VECTORIZER, ENCODER, DISEASE_SYMPTOM_MAP]):
        return jsonify({'error': 'Model artifacts not loaded.'}), 503
        
    try:
        data = request.get_json()
        collected_symptoms = data.get('collected_symptoms', {}) # Expects {'symptom': severity}
        denied_symptoms = data.get('denied_symptoms', [])
        question_counter = data.get('question_counter', 0)

        if not collected_symptoms:
            return jsonify({'error': 'No symptoms provided.'}), 400

        # 1. Vectorize Input and Apply Severity
        symptoms_string = " ".join(collected_symptoms.keys())
        X_vector = VECTORIZER.transform([symptoms_string]).toarray()

        for symptom, severity in collected_symptoms.items():
            if symptom in VECTORIZER.vocabulary_:
                symptom_index = VECTORIZER.vocabulary_[symptom]
                X_vector[0, symptom_index] *= (1 + (severity - 1) * 0.5)

        input_tensor = torch.tensor(X_vector, dtype=torch.float32).to(DEVICE)

        # 2. Make Prediction with Temperature Scaling
        with torch.no_grad():
            output = MODEL(input_tensor)
            probabilities = F.softmax(output / TEMPERATURE, dim=1) 
            
        k = min(5, len(ENCODER.classes_))
        top_probs, top_indices = torch.topk(probabilities, k=k)
        
        decoded_predictions = []
        for prob, index in zip(top_probs.flatten(), top_indices.flatten()):
            decoded_predictions.append({
                'disease': ENCODER.inverse_transform([index.item()])[0],
                'confidence': prob.item() * 100 
            })
            
        # 3. Decision Logic
        top_confidence = decoded_predictions[0]['confidence']
        confidence_threshold = 98.0 if question_counter == 0 else 85.0
        is_final = False
        next_question = None

        if top_confidence >= confidence_threshold and question_counter > 0:
            is_final = True
        elif question_counter >= 5:
            is_final = True
        else:
            next_symptom_token = get_next_question(probabilities, collected_symptoms, denied_symptoms)
            if next_symptom_token:
                next_question = {
                    "token": next_symptom_token,
                    "text": f"Are you experiencing '{next_symptom_token.replace('_', ' ')}'?"
                }
            else: # No more questions to ask
                is_final = True

        # 4. Return Response
        return jsonify({
            'predictions': decoded_predictions,
            'is_final': is_final,
            'next_question': next_question
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({'error': 'Internal server error during prediction.'}), 500

# Load artifacts when the Flask app first starts
with app.app_context():
    load_artifacts()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)