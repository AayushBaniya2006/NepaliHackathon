import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const avgStress = db.prepare('SELECT AVG(stress_score) as avg FROM sessions WHERE stress_score IS NOT NULL').get().avg || 0;
    const todaySessions = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE created_at >= date('now')").get().count;

    res.json({
      totalSessions,
      totalUsers,
      avgStress: Math.round(avgStress * 10) / 10,
      todaySessions,
      soapNotesGenerated: totalSessions,
      languagesSupported: 15,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/live', (req, res) => {
  try {
    const activeSessions = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE created_at >= datetime('now', '-5 minutes')").get().count;
    res.json({ active_sessions: activeSessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
