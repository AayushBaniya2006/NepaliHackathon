import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db.js';

const router = Router();

// Get all sessions (for authenticated user)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const sessions = await db.collection('sessions')
      .find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .project({ image_data: 0 })
      .toArray();
    res.json(sessions);
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Session operation failed' });
  }
});

// Get single session
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const session = await db.collection('sessions').findOne({
      id: req.params.id,
      user_id: req.user.id,
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Session operation failed' });
  }
});

// Create session
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    const { promptId, imageData, stressScore, feedbackShort, feedbackEmoji, personalStatement, pattern, thresholdMet, clinicalNote, insuranceData, caregiverNote } = req.body;
    const id = uuid();
    const created_at = new Date().toISOString();

    const session = {
      id,
      user_id: req.user.id,
      prompt_id: promptId,
      image_data: imageData,
      stress_score: stressScore,
      feedback_short: feedbackShort,
      feedback_emoji: feedbackEmoji,
      personal_statement: personalStatement,
      pattern,
      threshold_met: thresholdMet ? 1 : 0,
      clinical_note_json: clinicalNote || null,
      insurance_data_json: insuranceData || null,
      caregiver_note_json: caregiverNote || null,
      created_at,
    };

    await db.collection('sessions').insertOne(session);

    // Also save analytics
    await db.collection('analytics').insertOne({
      user_id: req.user.id,
      session_id: id,
      prompt_id: promptId,
      stress_score: stressScore,
      indicators_json: req.body.indicators || null,
      pattern,
      threshold_met: thresholdMet ? 1 : 0,
      created_at,
    });

    res.json({ id, created_at });
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ error: 'Session operation failed' });
  }
});

export default router;
