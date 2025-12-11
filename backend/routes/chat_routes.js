const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pg_connector');
const { authenticateToken } = require('./auth_routes');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

// Emergency symptoms that trigger immediate high urgency
const EMERGENCY_SYMPTOMS = [
  'chest pain', 'severe chest pain', 'breathlessness', 'severe breathlessness',
  'unconscious', 'unconsciousness', 'severe bleeding', 'blood in sputum',
  'altered sensorium', 'paralysis', 'stroke', 'seizure', 'cardiac arrest',
  'heart attack', 'difficulty breathing', 'cannot breathe'
];

// Start a new chat session
router.post('/start', authenticateToken, async (req, res) => {
  const { raw_symptoms } = req.body;
  const user_id = req.user.user_id;

  try {
    if (!raw_symptoms || raw_symptoms.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide initial symptoms' });
    }

    // Create new session
    const sessionResult = await pool.query(
      `INSERT INTO chat_sessions (session_id, user_id, status) 
       VALUES ($1, $2, 'active') 
       RETURNING session_id, started_at`,
      [uuidv4(), user_id]
    );

    const session = sessionResult.rows[0];

    // Parse initial symptoms
    const symptomTokens = parseSymptoms(raw_symptoms);
    const collected_symptoms = {};
    symptomTokens.forEach(token => {
      collected_symptoms[token] = 2; // Default severity
    });

    // Check for emergency
    const isEmergency = checkEmergency(Object.keys(collected_symptoms));

    if (isEmergency) {
      // Immediately triage as emergency
      await pool.query(
        `UPDATE chat_sessions 
         SET is_emergency = true, final_urgency = 'EMERGENCY', 
             final_department = 'Emergency Medicine', status = 'completed', ended_at = NOW()
         WHERE session_id = $1`,
        [session.session_id]
      );

      // Create session state
      await pool.query(
        `INSERT INTO session_state 
         (session_id, symptoms_collected, questions_asked, ml_confidence, predicted_department) 
         VALUES ($1, $2, $3, $4, $5)`,
        [session.session_id, Object.keys(collected_symptoms), [], 100.0, 'Emergency Medicine']
      );

      return res.json({
        session_id: session.session_id,
        is_emergency: true,
        urgency_level: 'EMERGENCY',
        recommended_department: 'Emergency Medicine',
        message: '⚠️ EMERGENCY: Please seek immediate medical attention!',
        next_question: null,
        is_final: true
      });
    }

    // Initialize session state
    await pool.query(
      `INSERT INTO session_state 
       (session_id, symptoms_collected, questions_asked, ml_confidence) 
       VALUES ($1, $2, $3, $4)`,
      [session.session_id, Object.keys(collected_symptoms), [], 0.0]
    );

    // Get medical history
    const historyResult = await pool.query(
      'SELECT * FROM user_medical_history WHERE user_id = $1',
      [user_id]
    );
    const medicalHistory = historyResult.rows[0] || null;

    // Call ML prediction
    const mlResponse = await callMLPrediction(
      collected_symptoms,
      [],
      0,
      medicalHistory
    );

    // Log ML prediction
    await pool.query(
      `INSERT INTO ml_predictions 
       (session_id, input_vector, confidence, predicted_department, suggested_symptoms) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        session.session_id,
        JSON.stringify(collected_symptoms),
        mlResponse.predictions[0].confidence,
        mlResponse.predictions[0].disease,
        mlResponse.next_question ? [mlResponse.next_question.token] : []
      ]
    );

    // Update session state
    await pool.query(
      `UPDATE session_state 
       SET ml_confidence = $1, predicted_department = $2, updated_at = NOW()
       WHERE session_id = $3`,
      [mlResponse.predictions[0].confidence, mlResponse.predictions[0].disease, session.session_id]
    );

    if (mlResponse.is_final) {
      // Finalize session
      const finalResult = await finalizeSession(
        session.session_id,
        mlResponse.predictions[0].disease,
        mlResponse.predictions[0].confidence
      );
      return res.json(finalResult);
    }

    res.json({
      session_id: session.session_id,
      is_emergency: false,
      current_confidence: mlResponse.predictions[0].confidence,
      top_predictions: mlResponse.predictions,
      next_question: mlResponse.next_question,
      medical_history_note: mlResponse.medical_history_note,
      is_final: false
    });

  } catch (error) {
    console.error('Chat start error:', error);
    res.status(500).json({ error: 'Failed to start chat session', details: error.message });
  }
});

// Continue chat with symptom response
router.post('/continue', authenticateToken, async (req, res) => {
  const { session_id, symptom_token, has_symptom, severity } = req.body;

  try {
    // Verify session belongs to user
    const sessionCheck = await pool.query(
      'SELECT * FROM chat_sessions WHERE session_id = $1 AND user_id = $2',
      [session_id, req.user.user_id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get current state
    const stateResult = await pool.query(
      'SELECT * FROM session_state WHERE session_id = $1',
      [session_id]
    );

    if (stateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session state not found' });
    }

    const state = stateResult.rows[0];
    const collected_symptoms = {};
    state.symptoms_collected.forEach(s => {
      collected_symptoms[s] = 2; // Default severity
    });

    let questions_asked = [...state.questions_asked];

    // Update based on response
    if (has_symptom) {
      const severityValue = severity || 3;
      collected_symptoms[symptom_token] = severityValue;
    }

    if (!questions_asked.includes(symptom_token)) {
      questions_asked.push(symptom_token);
    }

    // Derive denied symptoms across the whole session: any asked symptom
    // that is not present in collected_symptoms is treated as denied.
    const denied_symptoms = questions_asked.filter(token => !collected_symptoms[token]);

    // Check for emergency after update
    const isEmergency = checkEmergency(Object.keys(collected_symptoms));

    if (isEmergency) {
      await pool.query(
        `UPDATE chat_sessions 
         SET is_emergency = true, final_urgency = 'EMERGENCY', 
             final_department = 'Emergency Medicine', status = 'completed', ended_at = NOW()
         WHERE session_id = $1`,
        [session_id]
      );

      await pool.query(
        `UPDATE session_state 
         SET symptoms_collected = $1, questions_asked = $2, 
             ml_confidence = 100.0, predicted_department = 'Emergency Medicine', updated_at = NOW()
         WHERE session_id = $3`,
        [Object.keys(collected_symptoms), questions_asked, session_id]
      );

      return res.json({
        session_id,
        is_emergency: true,
        urgency_level: 'EMERGENCY',
        recommended_department: 'Emergency Medicine',
        message: '⚠️ EMERGENCY: Please seek immediate medical attention!',
        is_final: true
      });
    }

    // Get medical history
    const historyResult = await pool.query(
      'SELECT * FROM user_medical_history WHERE user_id = $1',
      [req.user.user_id]
    );
    const medicalHistory = historyResult.rows[0] || null;

    // Call ML prediction
    const mlResponse = await callMLPrediction(
      collected_symptoms,
      denied_symptoms,
      questions_asked.length,
      medicalHistory
    );

    // Log ML prediction
    await pool.query(
      `INSERT INTO ml_predictions 
       (session_id, input_vector, confidence, predicted_department, suggested_symptoms) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        session_id,
        JSON.stringify(collected_symptoms),
        mlResponse.predictions[0].confidence,
        mlResponse.predictions[0].disease,
        mlResponse.next_question ? [mlResponse.next_question.token] : []
      ]
    );

    // Update session state
    await pool.query(
      `UPDATE session_state 
       SET symptoms_collected = $1, questions_asked = $2, 
           ml_confidence = $3, predicted_department = $4, updated_at = NOW()
       WHERE session_id = $5`,
      [
        Object.keys(collected_symptoms),
        questions_asked,
        mlResponse.predictions[0].confidence,
        mlResponse.predictions[0].disease,
        session_id
      ]
    );

    if (mlResponse.is_final) {
      const finalResult = await finalizeSession(
        session_id,
        mlResponse.predictions[0].disease,
        mlResponse.predictions[0].confidence
      );
      return res.json(finalResult);
    }

    res.json({
      session_id,
      is_emergency: false,
      current_confidence: mlResponse.predictions[0].confidence,
      top_predictions: mlResponse.predictions,
      next_question: mlResponse.next_question,
      medical_history_note: mlResponse.medical_history_note,
      is_final: false
    });

  } catch (error) {
    console.error('Chat continue error:', error);
    res.status(500).json({ error: 'Failed to continue chat', details: error.message });
  }
});

// Get session history
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          cs.session_id,
          cs.started_at,
          cs.ended_at,
          cs.final_department,
          cs.final_urgency,
          cs.is_emergency,
          cs.status,
          ss.predicted_department,
          ss.symptoms_collected
       FROM chat_sessions cs
       LEFT JOIN session_state ss ON ss.session_id = cs.session_id
       WHERE cs.user_id = $1 
       ORDER BY cs.started_at DESC 
       LIMIT 20`,
      [req.user.user_id]
    );

    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Session history error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Helper Functions

function parseSymptoms(rawText) {
  const cleaned = rawText
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/[^a-z0-9\s,]/g, '');

  const tokens = cleaned.split(/[\s,]+/).filter(t => t.length > 2);
  return [...new Set(tokens)];
}

function checkEmergency(symptoms) {
  return symptoms.some(symptom =>
    EMERGENCY_SYMPTOMS.some(emergency =>
      symptom.includes(emergency) || emergency.includes(symptom)
    )
  );
}

async function callMLPrediction(collected_symptoms, denied_symptoms, question_counter, medicalHistory) {
  try {
    const response = await axios.post(`${FLASK_API_URL}/predict`, {
      collected_symptoms,
      denied_symptoms,
      question_counter
    }, {
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('ML API error:', error.message);
    throw new Error('Failed to get ML prediction');
  }
}

async function finalizeSession(session_id, predicted_disease, confidence) {
  // Map disease to department
  const departmentResult = await pool.query(
    `SELECT department_name, urgency_level, specialization 
     FROM department_mapping 
     WHERE LOWER(department_name) = LOWER($1) 
        OR LOWER(specialization) LIKE LOWER($2)
     LIMIT 1`,
    [predicted_disease, `%${predicted_disease}%`]
  );

  let department = 'General Medicine';
  let urgency = 'MEDIUM';

  if (departmentResult.rows.length > 0) {
    department = departmentResult.rows[0].department_name;
    urgency = departmentResult.rows[0].urgency_level;
  } else if (confidence >= 80) {
    urgency = 'MEDIUM';
  } else {
    urgency = 'LOW';
  }

  // Update session
  await pool.query(
    `UPDATE chat_sessions 
     SET final_department = $1, final_urgency = $2, 
         status = 'completed', ended_at = NOW()
     WHERE session_id = $3`,
    [department, urgency, session_id]
  );

  const readableDisease = typeof predicted_disease === 'string'
    ? predicted_disease.replace(/_/g, ' ')
    : predicted_disease;

  return {
    session_id,
    is_final: true,
    is_emergency: false,
    recommended_department: department,
    urgency_level: urgency,
    confidence: confidence,
    message: `Our preliminary diagnosis is ${readableDisease}. We recommend consulting ${department}. Urgency level: ${urgency}.`
  };
}

module.exports = router;