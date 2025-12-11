-- Healthcare Assistance System - Complete Database Schema
-- Run this file after creating your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (for signup/signin)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pincode VARCHAR(6),
    full_name VARCHAR(255),
    age INTEGER,
    gender VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical history table
CREATE TABLE IF NOT EXISTS user_medical_history (
    history_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (user_id) ON DELETE CASCADE,
    age INTEGER,
    known_allergies TEXT,
    major_illnesses_faced TEXT,
    chronic_diseases TEXT,
    genetic_diseases TEXT,
    is_skipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)
);

-- If tables already exist (e.g., upgrading an existing DB), ensure new columns exist
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

ALTER TABLE user_medical_history
    ADD COLUMN IF NOT EXISTS age INTEGER,
    ADD COLUMN IF NOT EXISTS genetic_diseases TEXT;

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id INTEGER REFERENCES users (user_id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    final_department VARCHAR(100),
    final_urgency VARCHAR(20) CHECK (
        final_urgency IN (
            'LOW',
            'MEDIUM',
            'HIGH',
            'EMERGENCY'
        )
    ),
    is_emergency BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active'
);

-- Session state (for iterative chat loop)
CREATE TABLE IF NOT EXISTS session_state (
    state_id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    symptoms_collected TEXT[],
    questions_asked TEXT[],
    ml_confidence DECIMAL(5,2),
    predicted_department VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id)
);

-- Department mapping
CREATE TABLE IF NOT EXISTS department_mapping (
    dept_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')),
    specialization TEXT,
    emergency_keywords TEXT[]
);

-- ML predictions log
CREATE TABLE IF NOT EXISTS ml_predictions (
    prediction_id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    input_vector JSONB,
    confidence DECIMAL(5,2),
    predicted_department VARCHAR(100),
    suggested_symptoms TEXT[],
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON chat_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_state_session ON session_state (session_id);

CREATE INDEX IF NOT EXISTS idx_history_user ON user_medical_history (user_id);

CREATE INDEX IF NOT EXISTS idx_predictions_session ON ml_predictions (session_id);

-- Insert sample department mappings
INSERT INTO department_mapping (department_name, urgency_level, specialization, emergency_keywords) 
VALUES
('Cardiology', 'HIGH', 'Heart and cardiovascular system', ARRAY['chest_pain', 'heart_attack', 'cardiac_arrest', 'fast_heart_rate']),
('Emergency Medicine', 'EMERGENCY', 'Life-threatening conditions', ARRAY['unconscious', 'severe_bleeding', 'difficulty_breathing', 'altered_sensorium', 'paralysis', 'stroke']),
('General Medicine', 'LOW', 'Common illnesses and routine care', ARRAY['fever', 'cold', 'headache', 'fatigue']),
('Pulmonology', 'MEDIUM', 'Respiratory system and lungs', ARRAY['cough', 'shortness_of_breath', 'asthma', 'breathlessness']),
('Neurology', 'HIGH', 'Nervous system and brain', ARRAY['seizure', 'stroke', 'paralysis', 'weakness_of_one_body_side']),
('Gastroenterology', 'MEDIUM', 'Digestive system', ARRAY['vomiting', 'diarrhoea', 'abdominal_pain', 'acidity', 'stomach_pain']),
('Dermatology', 'LOW', 'Skin conditions', ARRAY['skin_rash', 'itching', 'skin_peeling']),
('Orthopedics', 'MEDIUM', 'Bones and joints', ARRAY['joint_pain', 'back_pain', 'neck_pain', 'swelling_joints']),
('Endocrinology', 'MEDIUM', 'Hormones and metabolism', ARRAY['weight_loss', 'weight_gain', 'excessive_hunger', 'thyroid'])
ON CONFLICT (department_name) DO NOTHING;

-- Verification queries
SELECT 'Database setup complete!' as status;

SELECT COUNT(*) as user_count FROM users;

SELECT COUNT(*) as department_count FROM department_mapping;

-- Show all departments
SELECT department_name, urgency_level
FROM department_mapping
ORDER BY urgency_level DESC;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);