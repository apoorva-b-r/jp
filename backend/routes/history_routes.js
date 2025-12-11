const express = require('express');
const router = express.Router();
const pool = require('../db/pg_connector');
const { authenticateToken } = require('./auth_routes');

// Save or update medical history
// We now only store lists of chronic and genetic diseases
// plus the is_skipped flag. Other legacy fields are ignored.
router.post('/save', authenticateToken, async (req, res) => {
  const { chronic_diseases, genetic_diseases, is_skipped } = req.body;

  const user_id = req.user.user_id;

  const chronicStr = Array.isArray(chronic_diseases)
    ? chronic_diseases.join(', ')
    : chronic_diseases || null;

  const geneticStr = Array.isArray(genetic_diseases)
    ? genetic_diseases.join(', ')
    : genetic_diseases || null;

  const normalized = {
    chronic_diseases: chronicStr,
    genetic_diseases: geneticStr,
    is_skipped: !!is_skipped,
  };

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
         SET chronic_diseases = $1,
             genetic_diseases = $2,
             is_skipped = $3,
             updated_at = NOW()
         WHERE user_id = $4
         RETURNING *`,
        [
          normalized.chronic_diseases,
          normalized.genetic_diseases,
          normalized.is_skipped,
          user_id,
        ]
      );
    } else {
      // Insert new
      result = await pool.query(
        `INSERT INTO user_medical_history 
         (user_id, chronic_diseases, genetic_diseases, is_skipped) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          user_id,
          normalized.chronic_diseases,
          normalized.genetic_diseases,
          normalized.is_skipped,
        ]
      );
    }

    res.json({
      message: 'Medical history saved successfully',
      history: result.rows[0],
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