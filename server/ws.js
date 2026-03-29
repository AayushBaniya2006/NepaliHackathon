import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { getDB } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map(); // userId → Set<ws>

  let metricsPollTimeout = null;
  let metricsPollActive = false;
  /** Bumped in stopMetricsPollIfNoClients so in-flight metricsPollTick runs cannot schedule after shutdown. */
  let metricsPollGeneration = 0;

  async function getMetrics() {
    try {
      const db = getDB();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const [totalSessions, todaySessions, activeSessions] = await Promise.all([
        db.collection('sessions').countDocuments(),
        db.collection('sessions').countDocuments({ created_at: { $gte: todayStart.toISOString() } }),
        db.collection('sessions').countDocuments({ created_at: { $gte: fiveMinAgo } }),
      ]);
      return { totalSessions, todaySessions, activeSessions };
    } catch (err) {
      console.warn('WS getMetrics error:', err.message);
      return { totalSessions: 0, todaySessions: 0, activeSessions: 0 };
    }
  }

  function stopMetricsPollIfNoClients() {
    if (wss.clients.size > 0) return;
    metricsPollGeneration += 1;
    if (metricsPollTimeout !== null) {
      clearTimeout(metricsPollTimeout);
      metricsPollTimeout = null;
    }
    metricsPollActive = false;
  }

  async function metricsPollTick() {
    if (wss.clients.size === 0) {
      metricsPollActive = false;
      return;
    }

    const genCap = metricsPollGeneration;

    const data = await getMetrics();

    if (wss.clients.size === 0) {
      metricsPollActive = false;
      return;
    }

    if (!metricsPollActive || genCap !== metricsPollGeneration) {
      return;
    }

    const msg = JSON.stringify({ type: 'metrics.update', data });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(msg);
    });

    metricsPollTimeout = setTimeout(() => {
      metricsPollTimeout = null;
      void metricsPollTick();
    }, 10000);
  }

  /** @returns {boolean} true if a new poll chain was started (immediate tick will broadcast metrics) */
  function startMetricsPollIfNeeded() {
    if (metricsPollActive) return false;
    if (wss.clients.size === 0) return false;
    metricsPollActive = true;
    void metricsPollTick();
    return true;
  }

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    let userId = null;

    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        userId = payload.id;
      } catch { /* anonymous connection */ }
    }

    if (userId) {
      if (!clients.has(userId)) clients.set(userId, new Set());
      clients.get(userId).add(ws);
    }

    const startedFreshPoll = startMetricsPollIfNeeded();

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) clients.delete(userId);
      }
      setImmediate(() => stopMetricsPollIfNoClients());
    });

    // One-off send only when a poll was already running (fresh poll broadcasts immediately via metricsPollTick)
    if (!startedFreshPoll) {
      getMetrics().then((data) => {
        if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'metrics.update', data }));
      });
    }
  });

  // Expose broadcast function for routes to use
  return {
    broadcast(type, data) {
      const msg = JSON.stringify({ type, data });
      wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(msg);
      });
    },
    sendToUser(userId, type, data) {
      const userClients = clients.get(userId);
      if (userClients) {
        const msg = JSON.stringify({ type, data });
        userClients.forEach((client) => {
          if (client.readyState === 1) client.send(msg);
        });
      }
    },
  };
}
