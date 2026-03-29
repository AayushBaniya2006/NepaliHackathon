import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const totalSessions = await db.collection('sessions').countDocuments();
    const totalUsers = await db.collection('users').countDocuments();

    const avgResult = await db.collection('sessions').aggregate([
      { $match: { stress_score: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$stress_score' } } },
    ]).toArray();
    const avgStress = avgResult[0]?.avg || 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = await db.collection('sessions').countDocuments({
      created_at: { $gte: todayStart.toISOString() },
    });

    res.json({
      totalSessions,
      totalUsers,
      avgStress: Math.round(avgStress * 10) / 10,
      todaySessions,
      soapNotesGenerated: totalSessions,
      languagesSupported: 2,
    });
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

router.get('/live', async (req, res) => {
  try {
    const db = getDB();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const activeSessions = await db.collection('sessions').countDocuments({
      created_at: { $gte: fiveMinAgo },
    });
    res.json({ active_sessions: activeSessions });
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

export default router;
