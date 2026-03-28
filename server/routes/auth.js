import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { name, role, isNonverbal, language } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'Name and role are required' });
    if (!['patient', 'caregiver'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const id = uuid();
    db.prepare(`INSERT INTO users (id, name, role, is_nonverbal, language) VALUES (?, ?, ?, ?, ?)`)
      .run(id, name, role, isNonverbal ? 1 : 0, language || 'en');

    const token = generateToken({ id, role });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', (req, res) => {
  // This route uses authMiddleware applied in index.js
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
