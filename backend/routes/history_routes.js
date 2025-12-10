const express = require('express');
const router = express.Router();
const pool = require('../db/pg_connector');
const { authenticateToken } = require('./auth_routes');

// Save or update medical history
router.post('/save', authenticateToken, async (req, res) => {
  const { known_allergies, major_illnesses_faced, chronic_diseases, is_skipped } = req.body;
  const user_id = req.user.user_id;

  try {
    // Check if history exists
    const existing = await pool.query(
      'SELECT * FROM user_medical_history WHERE user_id = $1',
      [user_id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await pool.query(
        `UPDATE user_medical_history 
         SET known_allergies = $1, major_illnesses_faced = $2, 
             chronic_diseases = $3, is_skipped = $4
         WHERE user_id = $5
         RETURNING *`,
        [known_allergies, major_illnesses_faced, chronic_diseases, is_skipped || false, user_id]
      );
    } else {
      // Insert new
      result = await pool.query(
        `INSERT INTO user_medical_history 
         (user_id, known_allergies, major_illnesses_faced, chronic_diseases, is_skipped) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [user_id, known_allergies, major_illnesses_faced, chronic_diseases, is_skipped || false]
      );
    }

    res.json({
      message: 'Medical history saved successfully',
      history: result.rows[0]
    });
  } catch (error) {
    console.error('Medical history save error:', error);
    res.status(500).json({ error: 'Failed to save medical history' });
  }
});

// Get medical history
router.get('/get', authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      'SELECT * FROM user_medical_history WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.json({ history: null, message: 'No medical history found' });
    }

    res.json({ history: result.rows[0] });
  } catch (error) {
    console.error('Medical history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
});

module.exports = router;