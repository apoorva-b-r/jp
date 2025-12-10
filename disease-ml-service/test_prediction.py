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

# --- NEW: Medical History Data ---
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
    "Peptic ulcer diseae": ["vomiting", "loss_of_appetite", "abdominal_pain", "passage_of_gases", "internal_itching"], # Corrected name from original
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

# Severity mapping for illustrative purposes
SEVERITY_LEVELS = {
    'chest_pain': 5, 'breathlessness': 5, 'heart_attack': 5, 'paralysis_(brain_hemorrhage)': 5, 'coma': 5, 'blood_in_sputum': 5, 'acute_liver_failure': 5, 'altered_sensorium': 5,
    'fast_heart_rate': 4, 'high_fever': 3, 'loss_of_balance': 3, 'unsteadiness': 3, 'weakness_of_one_body_side': 3, 'pain_behind_the_eyes': 3, 'dehydration': 3, 'vomiting': 3, 'chills': 3, 'joint_pain': 3, 'abdominal_pain': 3, 'diarrhoea': 3, 'yellowish_skin': 3, 'dark_urine': 3, 'swelling_joints': 3, 'painful_walking': 3, 'dizziness': 3, 'stiff_neck': 3, 'blurred_and_distorted_vision': 3, 'constipation': 3, 'sweating': 3,
    'fatigue': 2, 'headache': 2, 'nausea': 2, 'cough': 2, 'skin_rash': 2, 'muscle_pain': 2, 'lethargy': 2, 'weight_loss': 2, 'loss_of_appetite': 2, 'restlessness': 2, 'mood_swings': 2,
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

# --- NEW: MEDICAL HISTORY ANALYSIS FUNCTION ---
def analyze_medical_history(collected_symptoms_set):
    """Analyzes symptom overlap with known chronic/genetic diseases."""
    history_matches = {}
    all_history = {**CHRONIC_DISEASES, **GENETIC_DISEASES}
    
    for condition, condition_symptoms in all_history.items():
        condition_symptoms_set = set(s.replace('_', ' ') for s in condition_symptoms)
        
        matching_symptoms = collected_symptoms_set.intersection(condition_symptoms_set)
        
        # Consider a match if at least 2 symptoms or 40% of the condition's symptoms overlap
        if len(condition_symptoms_set) > 0:
            match_percentage = len(matching_symptoms) / len(condition_symptoms_set)
            if len(matching_symptoms) >= 2 and match_percentage >= 0.4:
                history_matches[condition] = match_percentage
                
    return history_matches

# --- DIFFERENTIATING QUESTION GENERATION LOGIC ---
def get_next_question(probabilities, collected_symptoms, denied_symptoms):
    """Suggests the next most informative symptom to ask about, avoiding already asked symptoms."""
    k_diseases = min(2, len(ENCODER.classes_))
    _, top_indices = torch.topk(probabilities, k=k_diseases)
    top_diseases = ENCODER.inverse_transform(top_indices.flatten().tolist())

    if len(top_diseases) < 2: return None

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
    if not load_artifacts(): return

    print("\n--- 🔬 Intelligent Diagnosis Terminal Test ---")
    print("Type your initial symptoms (e.g., 'fever, cough'), or 'quit' to exit.")
    
    collected_symptoms = {}
    denied_symptoms = set()
    last_question_symptom = None
    question_counter = 0
    loop_state = "INITIAL_INPUT"

    while True:
        if loop_state == "INITIAL_INPUT":
            new_input = input("\nYour symptoms: ")
            if new_input.lower() == 'quit': break
            
            new_tokens = clean_symptoms(new_input).split()
            for token in new_tokens:
                if token: collected_symptoms[token] = 2
            
            if not collected_symptoms:
                print("Please enter at least one symptom.")
                continue
            loop_state = "PREDICT"

        elif loop_state == "ASK_PRESENCE":
            prompt = f"\n❓ FOLLOW-UP ({question_counter+1}/7): Are you experiencing '{last_question_symptom.replace('_', ' ')}'? (yes/no): "
            answer = input(prompt).lower()

            if answer == 'yes': loop_state = "ASK_SEVERITY"
            elif answer == 'no':
                denied_symptoms.add(last_question_symptom)
                last_question_symptom = None
                loop_state = "PREDICT"
            elif answer == 'quit': break
            else: print("Invalid input. Please answer 'yes' or 'no'.")

        elif loop_state == "ASK_SEVERITY":
            try:
                severity_prompt = f"On a scale of 1 (mild) to 5 (severe), how would you rate it?: "
                severity_score = int(input(severity_prompt))
                if 1 <= severity_score <= 5:
                    collected_symptoms[last_question_symptom] = severity_score
                    last_question_symptom = None
                    question_counter += 1
                    loop_state = "PREDICT"
                else: print("Invalid severity. Please enter a number between 1 and 5.")
            except ValueError: print("Invalid input. Please enter a number.")

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
            
            # --- NEW: Apply Medical History Boost ---
            history_matches = analyze_medical_history(set(collected_symptoms.keys()))
            if history_matches:
                prob_list = probabilities.flatten().tolist()
                for i, disease_name in enumerate(ENCODER.classes_):
                    # Standardize names for matching
                    normalized_disease = disease_name.replace('_', ' ')
                    for history_condition, match_score in history_matches.items():
                        if normalized_disease.lower() == history_condition.replace('_', ' ').lower():
                            # Apply a 15% boost based on the match score
                            boost = prob_list[i] * 0.15 * match_score
                            prob_list[i] += boost
                
                # Re-normalize probabilities to sum to 1
                total_prob = sum(prob_list)
                renormalized_probs = [p / total_prob for p in prob_list]
                probabilities = torch.tensor([renormalized_probs], dtype=torch.float32)
            # --- END NEW SECTION ---

            k = min(5, len(ENCODER.classes_))
            top_probs, top_indices = torch.topk(probabilities, k=k)
            top_confidence = top_probs[0, 0].item() * 100
            
            print("\n--- Diagnostic Results ---")
            top_predicted_disease = ""
            for i in range(k):
                confidence = top_probs[0, i].item() * 100
                index = top_indices[0, i].item()
                predicted_disease = ENCODER.inverse_transform([index])[0]
                if i == 0: top_predicted_disease = predicted_disease
                print(f"Rank {i+1}: {predicted_disease:<30} | Confidence: {confidence:.2f}%")

            # --- NEW: Display Medical History Note ---
            if history_matches:
                top_disease_normalized = top_predicted_disease.replace('_', ' ').lower()
                for condition, score in history_matches.items():
                    if top_disease_normalized == condition.replace('_', ' ').lower():
                        print(f"   └── 📝 Medical History Note: Symptoms show a {(score*100):.0f}% overlap with '{condition}'.")
                        break
            # --- END NEW SECTION ---

            confidence_threshold = 98.0 if question_counter == 0 else 85.0
            if top_confidence >= confidence_threshold and question_counter > 0:
                print(f"\n✅ FINAL DIAGNOSIS: High Confidence Threshold Met (>= {confidence_threshold:.1f}%) after follow-up.")
                break
            
            if question_counter >= 7:
                print(f"\n🛑 QUESTION LIMIT REACHED ({question_counter}). Recommending specialist based on current certainty.")
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