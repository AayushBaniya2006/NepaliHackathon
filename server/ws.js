import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mindcanvas-dev-secret';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map(); // userId → Set<ws>

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

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) clients.delete(userId);
      }
    });

    // Send initial metrics
    ws.send(JSON.stringify({ type: 'metrics.update', data: getMetrics() }));
  });

  // Broadcast metrics every 10 seconds
  setInterval(() => {
    const msg = JSON.stringify({ type: 'metrics.update', data: getMetrics() });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(msg);
    });
  }, 10000);

  function getMetrics() {
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
    const todaySessions = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE created_at >= date('now')").get().count;
    const activeSessions = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE created_at >= datetime('now', '-5 minutes')").get().count;
    return { totalSessions, todaySessions, activeSessions };
  }

  // Expose broadcast function for routes to use
  return {
    broadcast(type, data) {
      const msg = JSON.stringify({ type, data });
      wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(msg);
      });
    },
    sendToUser(userId, type, data) {
      const userClients = clients.get(userId);
      if (userClients) {
        const msg = JSON.stringify({ type, data });
        userClients.forEach(client => {
          if (client.readyState === 1) client.send(msg);
        });
      }
    },
  };
}
