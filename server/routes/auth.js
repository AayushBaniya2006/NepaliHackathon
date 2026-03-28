import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { name, role, isNonverbal, language } = req.body;
    if (!name || typeof name !== 'string' || name.length > 100 || name.length < 1) {
      return res.status(400).json({ error: 'Name must be 1-100 characters' });
    }
    if (!role) return res.status(400).json({ error: 'Name and role are required' });
    if (!['patient', 'caregiver'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const id = uuid();
    db.prepare(`INSERT INTO users (id, name, role, is_nonverbal, language) VALUES (?, ?, ?, ?, ?)`)
      .run(id, name, role, isNonverbal ? 1 : 0, language || 'en');

    const token = generateToken({ id, role });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json({ token, user });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

export default router;
