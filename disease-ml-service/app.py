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

# --- Medical History Data ---
CHRONIC_DISEASES = {
    "Hypertension": ["headache", "chest_pain", "dizziness", "loss_of_balance", "lack_of_concentration"],
    "Migraine": ["acidity", "indigestion", "headache", "blurred_and_distorted_vision", "excessive_hunger", "stiff_neck", "depression", "irritability", "visual_disturbances"],
    "Cervical spondylosis": ["back_pain", "weakness_in_limbs", "neck_pain", "dizziness", "loss_of_balance"],
    "Diabetes": ["fatigue", "weight_loss", "restlessness", "lethargy", "irregular_sugar_level", "blurred_and_distorted_vision", "obesity", "excessive_hunger", "increased_appetite", "polyuria"],
    "Arthritis": ["muscle_weakness", "stiff_neck", "swelling_joints", "movement_stiffness", "spinning_movements", "loss_of_balance", "unsteadiness", "weakness_of_one_body_side"],
    "Chronic cholestasis": ["itching", "vomiting", "yellowish_skin", "nausea", "loss_of_appetite", "abdominal_pain", "yellowing_of_eyes"],
    "Heart attack": ["vomiting", "breathlessness", "sweating", "chest_pain"],
    "Bronchial Asthma": ["fatigue", "cough", "high_fever", "breathlessness", "family_history", "mucoid_sputum"],
    "GERD": ["stomach_pain", "acidity", "ulcers_on_tongue", "vomiting", "cough", "chest_pain"],
    "Peptic ulcer diseae": ["vomiting", "loss_of_appetite", "abdominal_pain", "passage_of_gases", "internal_itching"],
    "Osteoarthristis": ["joint_pain", "neck_pain", "knee_pain", "hip_joint_pain", "swelling_joints", "painful_walking"],
    "Hypothyroidism": ["fatigue", "weight_gain", "cold_hands_and_feets", "mood_swings", "lethargy", "dizziness", "puffy_face_and_eyes", "enlarged_thyroid", "brittle_nails", "swollen_extremeties", "depression", "irritability", "abnormal_menstruation"],
    "Hyperthyroidism": ["fatigue", "mood_swings", "weight_loss", "restlessness", "sweating", "diarrhoea", "fast_heart_rate", "excessive_hunger", "muscle_weakness", "irritability", "abnormal_menstruation"],
    "Hypoglycemia": ["vomiting", "fatigue", "anxiety", "sweating", "headache", "nausea", "blurred_and_distorted_vision", "excessive_hunger", "drying_and_tingling_lips", "slurred_speech", "irritability", "palpitations"],
    "Psoriasis": ["skin_rash", "joint_pain", "skin_peeling", "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails"],
    "Varicose veins": ["fatigue", "cramps", "bruising", "obesity", "swollen_legs", "swollen_blood_vessels", "prominent_veins_on_calf"],
    "Paralysis (brain hemorrhage)": ["vomiting", "headache", "weakness_of_one_body_side", "altered_sensorium"]
}
GENETIC_DISEASES = {
    "Hemochromatosis": ["joint_pain", "vomiting", "fatigue", "high_fever", "loss_of_appetite", "abdominal_pain", "yellowing_of_eyes"],
    "Thalassemia": ["fatigue", "weight_loss", "breathlessness", "yellowish_skin", "dark_urine", "loss_of_appetite", "abdominal_pain", "yellowing_of_eyes", "enlarged_spleen"],
    "Sickle cell anemia": ["joint_pain", "vomiting", "fatigue", "high_fever", "breathlessness", "swelling_joints", "pain_in_bones", "chest_pain", "swelling_extremeties"],
    "Cystic fibrosis": ["fatigue", "cough", "high_fever", "breathlessness", "mucoid_sputum", "rusty_sputum", "salty_taste_in_mouth", "weight_loss", "family_history"],
}

SEVERITY_LEVELS = {
    'chest_pain': 5, 'breathlessness': 5, 'heart_attack': 5, 'paralysis_(brain_hemorrhage)': 5, 'coma': 5, 'blood_in_sputum': 5, 'acute_liver_failure': 5, 'altered_sensorium': 5,
    'fast_heart_rate': 4, 'high_fever': 3, 'loss_of_balance': 3, 'unsteadiness': 3, 'weakness_of_one_body_side': 3, 'pain_behind_the_eyes': 3, 'dehydration': 3, 'vomiting': 3, 'chills': 3, 'joint_pain': 3, 'abdominal_pain': 3, 'diarrhoea': 3, 'yellowish_skin': 3, 'dark_urine': 3, 'swelling_joints': 3, 'painful_walking': 3, 'dizziness': 3, 'stiff_neck': 3, 'blurred_and_distorted_vision': 3, 'constipation': 3, 'sweating': 3,
    'fatigue': 2, 'headache': 2, 'nausea': 2, 'cough': 2, 'skin_rash': 2, 'muscle_pain': 2, 'lethargy': 2, 'weight_loss': 2, 'loss_of_appetite': 2, 'restlessness': 2, 'mood_swings': 2,
    'itching': 1, 'continuous_sneezing': 1, 'runny_nose': 1, 'acidity': 1, 'indigestion': 1
}

# --- CRITICAL PREPROCESSING & LOGIC FUNCTIONS ---
def clean_symptoms(symptom_string):
    """Cleans the symptom text for the Vectorizer."""
    if not isinstance(symptom_string, str):
        symptom_string = ""
    symptom_string = symptom_string.lower().replace('_', ' ').replace('-', ' ')
    symptoms_list = re.split(r'[,\s]+', symptom_string)
    return " ".join([s.strip() for s in symptoms_list if s.strip()])

def analyze_medical_history(collected_symptoms_set):
    """Analyzes symptom overlap with known chronic/genetic diseases."""
    history_matches = {}
    all_history = {**CHRONIC_DISEASES, **GENETIC_DISEASES}
    
    for condition, condition_symptoms in all_history.items():
        condition_symptoms_set = set(s.replace('_', ' ') for s in condition_symptoms)
        
        matching_symptoms = collected_symptoms_set.intersection(condition_symptoms_set)
        
        if len(condition_symptoms_set) > 0:
            match_percentage = len(matching_symptoms) / len(condition_symptoms_set)
            if len(matching_symptoms) >= 2 and match_percentage >= 0.4:
                history_matches[condition] = match_percentage
                
    return history_matches

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
        collected_symptoms = data.get('collected_symptoms', {})
        denied_symptoms = data.get('denied_symptoms', [])
        question_counter = data.get('question_counter', 0)

        if not collected_symptoms:
            return jsonify({'error': 'No symptoms provided.'}), 400

        symptoms_string = " ".join(collected_symptoms.keys())
        X_vector = VECTORIZER.transform([symptoms_string]).toarray()

        for symptom, severity in collected_symptoms.items():
            if symptom in VECTORIZER.vocabulary_:
                symptom_index = VECTORIZER.vocabulary_[symptom]
                X_vector[0, symptom_index] *= (1 + (severity - 1) * 0.5)

        input_tensor = torch.tensor(X_vector, dtype=torch.float32).to(DEVICE)

        with torch.no_grad():
            output = MODEL(input_tensor)
            probabilities = F.softmax(output / TEMPERATURE, dim=1) 
            
        history_matches = analyze_medical_history(set(collected_symptoms.keys()))
        if history_matches:
            prob_list = probabilities.flatten().tolist()
            for i, disease_name in enumerate(ENCODER.classes_):
                normalized_disease = disease_name.replace('_', ' ')
                for history_condition, match_score in history_matches.items():
                    if normalized_disease.lower() == history_condition.replace('_', ' ').lower():
                        boost = prob_list[i] * 0.15 * match_score
                        prob_list[i] += boost
            
            total_prob = sum(prob_list)
            renormalized_probs = [p / total_prob for p in prob_list]
            probabilities = torch.tensor([renormalized_probs], dtype=torch.float32)

        k = min(5, len(ENCODER.classes_))
        top_probs, top_indices = torch.topk(probabilities, k=k)
        
        decoded_predictions = []
        for prob, index in zip(top_probs.flatten(), top_indices.flatten()):
            decoded_predictions.append({
                'disease': ENCODER.inverse_transform([index.item()])[0],
                'confidence': prob.item() * 100 
            })
            
        top_predicted_disease = decoded_predictions[0]['disease']
        top_confidence = decoded_predictions[0]['confidence']
        medical_history_note = None

        if history_matches:
            top_disease_normalized = top_predicted_disease.replace('_', ' ').lower()
            for condition, score in history_matches.items():
                if top_disease_normalized == condition.replace('_', ' ').lower():
                    medical_history_note = f"Symptoms show a {(score*100):.0f}% overlap with the chronic/genetic condition '{condition}'."
                    break
        
        is_final = False
        next_question = None
        confidence_threshold = 98.0 if question_counter == 0 else 85.0

        if top_confidence >= confidence_threshold and question_counter > 0:
            is_final = True
        elif question_counter >= 7:
            is_final = True
        else:
            next_symptom_token = get_next_question(probabilities, collected_symptoms, denied_symptoms)
            if next_symptom_token:
                next_question = {
                    "token": next_symptom_token,
                    "text": f"Are you experiencing '{next_symptom_token.replace('_', ' ')}'?"
                }
            else:
                is_final = True

        return jsonify({
            'predictions': decoded_predictions,
            'is_final': is_final,
            'next_question': next_question,
            'medical_history_note': medical_history_note
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({'error': 'Internal server error during prediction.'}), 500

with app.app_context():
    load_artifacts()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)