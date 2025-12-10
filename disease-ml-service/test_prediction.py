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

def clean_symptoms(symptoms_string):
    if not isinstance(symptoms_string, str): return ""
    symptoms_string = symptoms_string.lower().replace('_', ' ').replace('-', ' ')
    symptoms_list = re.split(r'[,\s]+', symptoms_string)
    return " ".join([s.strip() for s in symptoms_list if s.strip()])

def load_artifacts():
    global MODEL, VECTORIZER, ENCODER, DISEASE_SYMPTOM_MAP
    print("Loading ML artifacts...")
    try:
        ENCODER = joblib.load('artifacts/label_encoder.pkl')
        VECTORIZER = joblib.load('artifacts/tfidf_vectorizer.pkl')
        with open('artifacts/disease_symptom_map.json', 'r') as f: DISEASE_SYMPTOM_MAP = json.load(f)
        num_classes = len(ENCODER.classes_)
        input_size = len(VECTORIZER.vocabulary_) 
        MODEL = SymptomClassifier(input_size, num_classes).to(DEVICE)
        MODEL.load_state_dict(torch.load('artifacts/model_weights.pth', map_location=DEVICE))
        MODEL.eval() 
        print("✅ Model artifacts loaded successfully.")
        return True
    except Exception as e:
        print(f"❌ FAILED TO LOAD ARTIFACTS: {e}")
        return False

# --- MODIFIED: MEDICAL HISTORY ANALYSIS FUNCTION ---
def analyze_medical_history(collected_symptoms_set, user_history_list):
    """Analyzes symptom overlap with the user's specific medical history."""
    history_matches = {}
    all_history_symptoms = {**CHRONIC_DISEASES, **GENETIC_DISEASES}

    # Only check against the conditions the user actually has
    for condition_name in user_history_list:
        condition_symptoms = all_history_symptoms.get(condition_name)
        if not condition_symptoms: continue

        condition_symptoms_set = set(s.replace('_', ' ') for s in condition_symptoms)
        matching_symptoms = collected_symptoms_set.intersection(condition_symptoms_set)
        
        if len(condition_symptoms_set) > 0:
            match_percentage = len(matching_symptoms) / len(condition_symptoms_set)
            if len(matching_symptoms) >= 2 and match_percentage >= 0.4:
                history_matches[condition_name] = match_percentage
                
    return history_matches

def get_next_question(probabilities, collected_symptoms, denied_symptoms):
    k_diseases = min(2, len(ENCODER.classes_))
    _, top_indices = torch.topk(probabilities, k=k_diseases)
    top_diseases = ENCODER.inverse_transform(top_indices.flatten().tolist())
    if len(top_diseases) < 2: return None
    disease1, disease2 = top_diseases[0], top_diseases[1]
    symptoms1 = set(DISEASE_SYMPTOM_MAP.get(disease1, []))
    symptoms2 = set(DISEASE_SYMPTOM_MAP.get(disease2, []))
    all_asked_symptoms = set(collected_symptoms.keys()) | denied_symptoms
    unasked_differentiating = [s for s in list(symptoms1.symmetric_difference(symptoms2)) if s not in all_asked_symptoms]
    if unasked_differentiating:
        return sorted(unasked_differentiating, key=lambda s: SEVERITY_LEVELS.get(s, 0), reverse=True)[0]
    unasked_top_disease = [s for s in symptoms1 if s not in all_asked_symptoms]
    if unasked_top_disease:
        return sorted(unasked_top_disease, key=lambda s: SEVERITY_LEVELS.get(s, 0), reverse=True)[0]
    return None

def run_test_loop():
    if not load_artifacts(): return

    # --- NEW: Simulate user's pre-existing conditions from database ---
    user_medical_history = ["Diabetes", "Hypertension"] 
    print(f"\n--- Simulating user with medical history: {user_medical_history} ---")
    
    print("\n--- 🔬 Intelligent Diagnosis Terminal Test ---")
    print("Type your initial symptoms (e.g., 'fever, cough'), or 'quit' to exit.")
    
    collected_symptoms, denied_symptoms = {}, set()
    last_question_symptom, question_counter, loop_state = None, 0, "INITIAL_INPUT"

    while True:
        if loop_state == "INITIAL_INPUT":
            new_input = input("\nYour symptoms: ")
            if new_input.lower() == 'quit': break
            for token in clean_symptoms(new_input).split():
                if token: collected_symptoms[token] = 2
            if not collected_symptoms:
                print("Please enter at least one symptom."); continue
            loop_state = "PREDICT"
        elif loop_state == "ASK_PRESENCE":
            answer = input(f"\n❓ FOLLOW-UP ({question_counter+1}/7): Are you experiencing '{last_question_symptom.replace('_', ' ')}'? (yes/no): ").lower()
            if answer == 'yes': loop_state = "ASK_SEVERITY"
            elif answer == 'no':
                denied_symptoms.add(last_question_symptom)
                last_question_symptom, loop_state = None, "PREDICT"
            elif answer == 'quit': break
            else: print("Invalid input. Please answer 'yes' or 'no'.")
        elif loop_state == "ASK_SEVERITY":
            try:
                severity_score = int(input(f"On a scale of 1 (mild) to 5 (severe), how would you rate it?: "))
                if 1 <= severity_score <= 5:
                    collected_symptoms[last_question_symptom] = severity_score
                    last_question_symptom, question_counter, loop_state = None, question_counter + 1, "PREDICT"
                else: print("Invalid severity. Please enter a number between 1 and 5.")
            except ValueError: print("Invalid input. Please enter a number.")
        if loop_state == "PREDICT":
            print(f"\n--- Current State ---\nSymptoms Confirmed: {collected_symptoms}\nSymptoms Denied: {denied_symptoms}")
            symptoms_string = " ".join(collected_symptoms.keys())
            X_vector = VECTORIZER.transform([symptoms_string]).toarray()
            for symptom, severity in collected_symptoms.items():
                if symptom in VECTORIZER.vocabulary_:
                    X_vector[0, VECTORIZER.vocabulary_[symptom]] *= (1 + (severity - 1) * 0.5)
            input_tensor = torch.tensor(X_vector, dtype=torch.float32).to(DEVICE)
            with torch.no_grad():
                probabilities = F.softmax(MODEL(input_tensor) / TEMPERATURE, dim=1) 
            
            # --- MODIFIED: Apply boost based on USER'S history ---
            history_matches = analyze_medical_history(set(collected_symptoms.keys()), user_medical_history)
            if history_matches:
                prob_list = probabilities.flatten().tolist()
                for i, disease_name in enumerate(ENCODER.classes_):
                    normalized_disease = disease_name.replace('_', ' ')
                    for history_condition, match_score in history_matches.items():
                        if normalized_disease.lower() == history_condition.replace('_', ' ').lower():
                            prob_list[i] += prob_list[i] * 0.15 * match_score
                probabilities = torch.tensor([[p / sum(prob_list) for p in prob_list]], dtype=torch.float32)

            top_probs, top_indices = torch.topk(probabilities, k=min(5, len(ENCODER.classes_)))
            print("\n--- Diagnostic Results ---")
            top_predicted_disease = ENCODER.inverse_transform([top_indices[0, 0].item()])[0]
            for i in range(len(top_probs.flatten())):
                print(f"Rank {i+1}: {ENCODER.inverse_transform([top_indices[0, i].item()])[0]:<30} | Confidence: {top_probs[0, i].item()*100:.2f}%")
            
            if history_matches:
                top_disease_normalized = top_predicted_disease.replace('_', ' ').lower()
                for condition, score in history_matches.items():
                    if top_disease_normalized == condition.replace('_', ' ').lower():
                        print(f"   └── 📝 Medical History Note: Symptoms show a {(score*100):.0f}% overlap with your pre-existing condition: '{condition}'.")
                        break
            
            top_confidence = top_probs[0, 0].item() * 100
            confidence_threshold = 98.0 if question_counter == 0 else 85.0
            if (top_confidence >= confidence_threshold and question_counter > 0) or question_counter >= 7:
                print(f"\n{'✅ FINAL DIAGNOSIS' if top_confidence >= confidence_threshold else '🛑 QUESTION LIMIT REACHED'}. Recommending specialist based on current certainty.")
                break
            next_symptom_to_ask = get_next_question(probabilities, collected_symptoms, denied_symptoms)
            if next_symptom_to_ask:
                last_question_symptom, loop_state = next_symptom_to_ask, "ASK_PRESENCE"
            else:
                print("\nModel has no more distinguishing questions to ask. Recommending based on current results.")
                break

if __name__ == '__main__':
    run_test_loop()