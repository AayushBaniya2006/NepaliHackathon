import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db.js';

const router = Router();

// ── Profile ──────────────────────────────────────────────
router.get('/profile/:userId', async (req, res) => {
  try {
    const db = getDB();
    const profile = await db.collection('profiles').findOne({ userId: req.params.userId });
    res.json(profile || null);
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const db = getDB();
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    await db.collection('profiles').updateOne(
      { userId },
      { $set: { ...data, userId, updated_at: new Date().toISOString() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// ── Sessions ─────────────────────────────────────────────
router.get('/sessions', async (req, res) => {
  try {
    if (!req.query.userId) return res.status(400).json({ error: 'userId query param required' });
    const db = getDB();
    const filter = { userId: req.query.userId };
    const sessions = await db.collection('patient_sessions')
      .find(filter)
      .sort({ timestamp: -1 })
      .toArray();
    res.json(sessions);
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const db = getDB();
    const session = {
      ...req.body,
      id: req.body.id || uuid(),
      timestamp: req.body.timestamp || new Date().toISOString(),
    };
    await db.collection('patient_sessions').insertOne(session);
    res.json(session);
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// ── Analytics ────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    if (!req.query.userId) return res.status(400).json({ error: 'userId query param required' });
    const db = getDB();
    const filter = { userId: req.query.userId };
    const analytics = await db.collection('patient_analytics')
      .find(filter)
      .sort({ timestamp: -1 })
      .toArray();
    res.json(analytics);
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

router.post('/analytics', async (req, res) => {
  try {
    const db = getDB();
    const entry = {
      ...req.body,
      timestamp: new Date().toISOString(),
    };
    await db.collection('patient_analytics').insertOne(entry);
    res.json(entry);
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).json({ error: 'Failed to save analytics' });
  }
});

// ── Onboarded flag ───────────────────────────────────────
router.get('/onboarded/:userId', async (req, res) => {
  try {
    const db = getDB();
    const doc = await db.collection('onboarded').findOne({ userId: req.params.userId });
    res.json({ onboarded: doc?.onboarded ?? false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check onboarded status' });
  }
});

router.put('/onboarded', async (req, res) => {
  try {
    const db = getDB();
    const { userId, onboarded } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    await db.collection('onboarded').updateOne(
      { userId },
      { $set: { userId, onboarded, updated_at: new Date().toISOString() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save onboarded status' });
  }
});

// ── Clear all data for a user ────────────────────────────
router.delete('/all/:userId', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    await Promise.all([
      db.collection('profiles').deleteMany({ userId }),
      db.collection('patient_sessions').deleteMany({ userId }),
      db.collection('patient_analytics').deleteMany({ userId }),
      db.collection('onboarded').deleteMany({ userId }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// ── Team: Get ALL data (no auth, for teammates) ─────────
router.get('/team/all', async (req, res) => {
  try {
    const db = getDB();
    const [profiles, sessions, analytics] = await Promise.all([
      db.collection('profiles').find().toArray(),
      db.collection('patient_sessions').find().sort({ timestamp: -1 }).toArray(),
      db.collection('patient_analytics').find().sort({ timestamp: -1 }).toArray(),
    ]);
    res.json({ profiles, sessions, analytics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get team data' });
  }
});

export default router;
