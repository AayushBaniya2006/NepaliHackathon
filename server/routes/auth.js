import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, role, isNonverbal, language } = req.body;
    if (!name || typeof name !== 'string' || name.length > 100 || name.length < 1) {
      return res.status(400).json({ error: 'Name must be 1-100 characters' });
    }
    if (!role) return res.status(400).json({ error: 'Name and role are required' });
    if (!['patient', 'caregiver'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const db = getDB();
    const id = uuid();
    const user = {
      id,
      name,
      role,
      is_nonverbal: isNonverbal ? 1 : 0,
      language: language || 'en',
      created_at: new Date().toISOString(),
    };
    await db.collection('users').insertOne(user);

    const token = generateToken({ id, role });
    res.json({ token, user });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

export default router;
