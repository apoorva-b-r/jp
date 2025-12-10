import json
import pandas as pd
import re
import joblib
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from datasets import load_dataset
from model import SymptomClassifier # Import model blueprint

# --- Configuration ---
DATASET_ID = "ares1123/disease_symtoms"
SYMPTOMS_COL = "symptoms"
DISEASE_COL = "disease"
EPOCHS = 20
BATCH_SIZE = 32
LEARNING_RATE = 0.001

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

# --- CRITICAL PREPROCESSING FUNCTION (Must match app.py) ---
def clean_symptoms(symptom_string):
    """Cleans the symptom text for the Vectorizer and removes stop words."""
    if not isinstance(symptom_string, str):
        symptom_string = ""
    symptom_string = symptom_string.lower().replace('_', ' ').replace('-', ' ')
    # Split into words
    symptoms_list = re.split(r'[,\s]+', symptom_string)
    # Filter out stop words and short tokens
    cleaned_tokens = [
        s.strip() for s in symptoms_list 
        if s.strip() and s.strip() not in STOP_WORDS
    ]
    return " ".join(cleaned_tokens)



def train_and_save_model():
    # 1. Load Data
    print(f"Loading dataset: {DATASET_ID}...")
    df = load_dataset(DATASET_ID)['train'].to_pandas()

    # 2. Preprocessing & Encoding
    print("Preprocessing data...")
    df['Cleaned_Symptoms'] = df[SYMPTOMS_COL].apply(clean_symptoms)


     # --- FIX: Correctly generate the disease-symptom map ---
    print("Creating disease-to-symptom map...")
    disease_symptom_map = {}
    # Group by disease and aggregate all unique symptoms for each
    for disease, group in df.groupby(DISEASE_COL):
        all_symptoms_for_disease = set()
        # Iterate over the raw symptom strings in the group
        for symptom_str in group[SYMPTOMS_COL].dropna():
            # Split by comma first to get individual symptom phrases
            symptom_tokens = symptom_str.split(',')
            for token in symptom_tokens:
                # Clean the entire phrase (e.g., 'watering_from_eyes' -> 'watering from eyes')
                cleaned_phrase = token.strip().replace('_', ' ').lower()
                
                # Add the whole, cleaned phrase to the set. DO NOT split it further.
                if cleaned_phrase:
                    all_symptoms_for_disease.add(cleaned_phrase)

        disease_symptom_map[disease] = sorted(list(all_symptoms_for_disease))
    
    # Save the map as a JSON artifact
    with open('artifacts/disease_symptom_map.json', 'w') as f:
        json.dump(disease_symptom_map, f, indent=2)
    print("✅ Disease-symptom map saved correctly.")
    # --- END FIX ---

    # Label Encoder (Disease -> Number)
    label_encoder = LabelEncoder()
    df['Label'] = label_encoder.fit_transform(df[DISEASE_COL])
    num_classes = len(label_encoder.classes_)

    # TfidfVectorizer (Symptoms -> BoW Vector)
    vectorizer = TfidfVectorizer(max_features=2000)
    X_sparse = vectorizer.fit_transform(df['Cleaned_Symptoms']).toarray()
    y = df['Label'].values
    
    input_size = X_sparse.shape[1]
    print(f"BoW Vector Size (Input Size): {input_size}")
    
    # 3. Data Split & PyTorch Setup
    X_train, _, y_train, _ = train_test_split(
        X_sparse, y, test_size=0.2, random_state=42, stratify=y
    )
    X_train_tensor = torch.tensor(X_train, dtype=torch.float32)
    y_train_tensor = torch.tensor(y_train, dtype=torch.long)
    
    train_data = TensorDataset(X_train_tensor, y_train_tensor)
    train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)

    # 4. Model Training
    print("Starting model training...")
    model = SymptomClassifier(input_size, num_classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    for epoch in range(EPOCHS):
        for inputs, labels in train_loader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

    print("Training complete.")

    # 5. Save Artifacts
    print("Saving model and preprocessors to artifacts/...")
    import os
    os.makedirs('artifacts', exist_ok=True)
    
    torch.save(model.state_dict(), 'artifacts/model_weights.pth')
    joblib.dump(vectorizer, 'artifacts/tfidf_vectorizer.pkl')
    joblib.dump(label_encoder, 'artifacts/label_encoder.pkl')
    
    print("All artifacts saved successfully!")


if __name__ == '__main__':
    train_and_save_model()