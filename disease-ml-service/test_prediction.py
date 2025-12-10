import torch
import joblib
import re
import os
import json
import torch.nn.functional as F
from scipy.stats import entropy
from model import SymptomClassifier 

# --- Global Artifacts and Loaders ---
MODEL = None
VECTORIZER = None
ENCODER = None
DISEASE_SYMPTOM_MAP = None
DEVICE = torch.device("cpu") 
TEMPERATURE = 2.0 # T > 1 softens probabilities, making the model less confident.

# Severity mapping for illustrative purposes
SEVERITY_LEVELS = {
    # --- Critical (5) ---
    'chest_pain': 5, 'breathlessness': 5, 'heart_attack': 5, 'paralysis_(brain_hemorrhage)': 5,
    'coma': 5, 'blood_in_sputum': 5, 'acute_liver_failure': 5, 'altered_sensorium': 5,
    # --- High (4) ---
    'fast_heart_rate': 4,
    # --- Medium (3) ---
    'high_fever': 3, 'loss_of_balance': 3, 'unsteadiness': 3, 'weakness_of_one_body_side': 3,
    'pain_behind_the_eyes': 3, 'dehydration': 3, 'vomiting': 3, 'chills': 3, 'joint_pain': 3,
    'abdominal_pain': 3, 'diarrhoea': 3, 'yellowish_skin': 3, 'dark_urine': 3, 'swelling_joints': 3,
    'painful_walking': 3, 'dizziness': 3, 'stiff_neck': 3, 'blurred_and_distorted_vision': 3,
    'constipation': 3, 'sweating': 3,
    # --- Low (2) ---
    'fatigue': 2, 'headache': 2, 'nausea': 2, 'cough': 2, 'skin_rash': 2, 'muscle_pain': 2,
    'lethargy': 2, 'weight_loss': 2, 'loss_of_appetite': 2, 'restlessness': 2, 'mood_swings': 2,
    # --- Very Low (1) ---
    'itching': 1, 'continuous_sneezing': 1, 'runny_nose': 1, 'acidity': 1, 'indigestion': 1
}

# --- CRITICAL PREPROCESSING FUNCTION ---
def clean_symptoms(symptoms_string):
    """Cleans the symptom text for the Vectorizer."""
    if not isinstance(symptoms_string, str):
        symptoms_string = ""
    symptoms_string = symptoms_string.lower().replace('_', ' ').replace('-', ' ')
    symptoms_list = re.split(r'[,\s]+', symptoms_string)
    return " ".join([s.strip() for s in symptoms_list if s.strip()])

# --- ARTIFACT LOADING ---
def load_artifacts():
    """Loads all saved model components from the 'artifacts/' directory."""
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
        model_weights_path = 'artifacts/model_weights.pth'
        
        if os.path.exists(model_weights_path):
            MODEL.load_state_dict(torch.load(model_weights_path, map_location=DEVICE))
            MODEL.eval() 
            print("✅ Model artifacts loaded successfully.")
            return True
        else:
            print(f"❌ Error: Model weights not found at '{model_weights_path}'.")
            return False
    except Exception as e:
        print(f"❌ FAILED TO LOAD ARTIFACTS: {e}")
        return False

# --- DIFFERENTIATING QUESTION GENERATION LOGIC ---
def get_next_question(probabilities, collected_symptoms, denied_symptoms):
    """Suggests the next most informative symptom to ask about, avoiding already asked symptoms."""
    k_diseases = min(2, len(ENCODER.classes_))
    _, top_indices = torch.topk(probabilities, k=k_diseases)
    top_diseases = ENCODER.inverse_transform(top_indices.flatten().tolist())

    if len(top_diseases) < 2:
        return None

    disease1, disease2 = top_diseases[0], top_diseases[1]
    symptoms1 = set(DISEASE_SYMPTOM_MAP.get(disease1, []))
    symptoms2 = set(DISEASE_SYMPTOM_MAP.get(disease2, []))

    all_asked_symptoms = set(collected_symptoms.keys()) | denied_symptoms
    
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

# --- MAIN TEST LOOP ---
def run_test_loop():
    if not load_artifacts():
        return

    print("\n--- 🔬 Intelligent Diagnosis Terminal Test ---")
    print("Type your initial symptoms (e.g., 'fever, cough'), or 'quit' to exit.")
    
    collected_symptoms = {}
    denied_symptoms = set()
    last_question_symptom = None
    question_counter = 0
    loop_state = "INITIAL_INPUT" # States: INITIAL_INPUT, ASK_PRESENCE, ASK_SEVERITY, PREDICT

    while True:
        # --- State-based Input Handling ---
        if loop_state == "INITIAL_INPUT":
            new_input = input("\nYour symptoms: ")
            if new_input.lower() == 'quit': break
            
            new_tokens = clean_symptoms(new_input).split()
            for token in new_tokens:
                if token: collected_symptoms[token] = 2 # Default severity 2
            
            if not collected_symptoms:
                print("Please enter at least one symptom.")
                continue
            loop_state = "PREDICT"

        elif loop_state == "ASK_PRESENCE":
            prompt = f"\n❓ FOLLOW-UP ({question_counter+1}/7): Are you experiencing '{last_question_symptom.replace('_', ' ')}'? (yes/no): "
            answer = input(prompt).lower()

            if answer == 'yes':
                loop_state = "ASK_SEVERITY"
            elif answer == 'no':
                denied_symptoms.add(last_question_symptom)
                last_question_symptom = None
                # Do NOT increment question_counter here
                loop_state = "PREDICT"
            elif answer == 'quit':
                break
            else:
                print("Invalid input. Please answer 'yes' or 'no'.")

        elif loop_state == "ASK_SEVERITY":
            try:
                severity_prompt = f"On a scale of 1 (mild) to 5 (severe), how would you rate it?: "
                severity_score = int(input(severity_prompt))
                if 1 <= severity_score <= 5:
                    collected_symptoms[last_question_symptom] = severity_score
                    last_question_symptom = None
                    question_counter += 1 # Increment counter only on confirmed symptom
                    loop_state = "PREDICT"
                else:
                    print("Invalid severity. Please enter a number between 1 and 5.")
            except ValueError:
                print("Invalid input. Please enter a number.")

        # --- Prediction Logic ---
        if loop_state == "PREDICT":
            print(f"\n--- Current State ---")
            print(f"Symptoms Confirmed: {collected_symptoms}")
            print(f"Symptoms Denied: {denied_symptoms}")

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
                
            k = min(5, len(ENCODER.classes_))
            top_probs, top_indices = torch.topk(probabilities, k=k)
            top_confidence = top_probs[0, 0].item() * 100
            
            print("\n--- Diagnostic Results ---")
            for i in range(k):
                confidence = top_probs[0, i].item() * 100
                index = top_indices[0, i].item()
                predicted_disease = ENCODER.inverse_transform([index])[0]
                print(f"Rank {i+1}: {predicted_disease:<30} | Confidence: {confidence:.2f}%")

            # --- Decision Logic ---
            confidence_threshold = 98.0 if question_counter == 0 else 85.0
            if top_confidence >= confidence_threshold and question_counter > 0:
                print(f"\n✅ FINAL DIAGNOSIS: High Confidence Threshold Met (>= {confidence_threshold:.1f}%) after follow-up.")
                break
            
            if question_counter >= 7:
                print("\n🛑 QUESTION LIMIT REACHED (7). Recommending specialist based on current certainty.")
                break

            next_symptom_to_ask = get_next_question(probabilities, collected_symptoms, denied_symptoms)
            
            if next_symptom_to_ask:
                last_question_symptom = next_symptom_to_ask
                loop_state = "ASK_PRESENCE"
            else:
                print("\nModel has no more distinguishing questions to ask. Recommending based on current results.")
                break

if __name__ == '__main__':
    run_test_loop()