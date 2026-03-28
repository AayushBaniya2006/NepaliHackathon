import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const sessions = db.prepare(
      'SELECT id, user_id, prompt_id, stress_score, feedback_short, feedback_emoji, pattern, threshold_met, caregiver_note_json, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);
    res.json(sessions);
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Session operation failed' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Session operation failed' });
  }
});

router.post('/', (req, res) => {
  try {
    const { promptId, imageData, stressScore, feedbackShort, feedbackEmoji, personalStatement, pattern, thresholdMet, clinicalNote, insuranceData, caregiverNote } = req.body;
    const id = uuid();

    db.prepare(`INSERT INTO sessions (id, user_id, prompt_id, image_data, stress_score, feedback_short, feedback_emoji, personal_statement, pattern, threshold_met, clinical_note_json, insurance_data_json, caregiver_note_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, req.user.id, promptId, imageData, stressScore, feedbackShort, feedbackEmoji, personalStatement, pattern, thresholdMet ? 1 : 0, clinicalNote ? JSON.stringify(clinicalNote) : null, insuranceData ? JSON.stringify(insuranceData) : null, caregiverNote ? JSON.stringify(caregiverNote) : null);

    // Also save analytics
    db.prepare(`INSERT INTO analytics (user_id, session_id, prompt_id, stress_score, indicators_json, pattern, threshold_met) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(req.user.id, id, promptId, stressScore, req.body.indicators ? JSON.stringify(req.body.indicators) : null, pattern, thresholdMet ? 1 : 0);

    res.json({ id, created_at: new Date().toISOString() });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Session operation failed' });
  }
});

export default router;
