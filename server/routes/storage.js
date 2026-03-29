import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/** Profile fields allowed in PUT /profile $set (no spread of req.body). */
const PROFILE_WHITELIST = [
  'name',
  'displayName',
  'bio',
  'avatarUrl',
  'avatar',
  'location',
  'isNonverbal',
  'consentData',
  'startDate',
  'caregiverPhotos',
  'language',
];

function isReservedOrDangerousKey(key) {
  if (typeof key !== 'string') return true;
  if (key === '_id' || key === '__proto__' || key === 'constructor') return true;
  if (key.startsWith('$')) return true;
  return false;
}

function buildSanitizedProfile(body) {
  const out = {};
  if (!body || typeof body !== 'object') return out;
  for (let i = 0; i < PROFILE_WHITELIST.length; i += 1) {
    const key = PROFILE_WHITELIST[i];
    if (isReservedOrDangerousKey(key)) continue;
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const val = body[key];
    if (val === undefined) continue;
    out[key] = val;
  }
  return out;
}

// ── Profile ──────────────────────────────────────────────
router.get('/profile/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const db = getDB();
    const profile = await db.collection('profiles').findOne({ userId: req.params.userId });
    res.json(profile || null);
  } catch (err) {
    console.error('Storage error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const authUserId = req.user.id;
    const bodyUserId = req.body?.userId;
    if (bodyUserId !== undefined && bodyUserId !== null && bodyUserId !== authUserId) {
      return res.status(403).json({ error: 'userId does not match authenticated user' });
    }
    const sanitizedProfile = buildSanitizedProfile(req.body);
    const updatedAt = new Date().toISOString();
    const db = getDB();
    await db.collection('profiles').updateOne(
      { userId: authUserId },
      { $set: { ...sanitizedProfile, userId: authUserId, updated_at: updatedAt } },
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
router.get('/onboarded/:userId', authMiddleware, async (req, res) => {
  try {
    const paramUserId = req.params.userId;
    if (req.user.id !== paramUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const db = getDB();
    const doc = await db.collection('onboarded').findOne({ userId: paramUserId });
    res.json({ onboarded: doc?.onboarded ?? false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check onboarded status' });
  }
});

router.put('/onboarded', authMiddleware, async (req, res) => {
  try {
    const { userId, onboarded } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (!req.user || req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const db = getDB();
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

// ── Admin-only: update a user's role ────────────────────
const VALID_ROLES = ['patient', 'clinician', 'admin'];

router.put('/profile/role', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin role required' });
    }
    const { targetUserId, role } = req.body;
    if (!targetUserId || !role) {
      return res.status(400).json({ error: 'targetUserId and role are required' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }
    const db = getDB();
    const result = await db.collection('profiles').updateOne(
      { userId: targetUserId },
      { $set: { role, updated_at: new Date().toISOString() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;
