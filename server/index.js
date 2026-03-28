import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import analyzeRoutes from './routes/analyze.js';
import voiceRoutes from './routes/voice.js';
import metricsRoutes from './routes/metrics.js';
import resourcesRoutes from './routes/resources.js';
import { setupWebSocket } from './ws.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/resources', resourcesRoutes);

// Protected routes
app.use('/api/sessions', authMiddleware, sessionRoutes);

// API proxy routes (no auth needed — they proxy to external APIs)
app.use('/api/analyze', analyzeRoutes);
app.use('/api/voice', voiceRoutes);

// Serve built frontend in production
app.use(express.static(join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

// WebSocket
const ws = setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`MindCanvas server running on port ${PORT}`);
});
