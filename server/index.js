import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './db.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import analyzeRoutes from './routes/analyze.js';
import voiceRoutes from './routes/voice.js';
import metricsRoutes from './routes/metrics.js';
import resourcesRoutes from './routes/resources.js';
import storageRoutes from './routes/storage.js';
import { setupWebSocket } from './ws.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', generalLimiter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/storage', storageRoutes);

// Protected routes
app.use('/api/sessions', authMiddleware, sessionRoutes);

// API proxy routes (no auth needed — they proxy to external APIs)
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { error: 'Too many requests, try again later' } });
app.use('/api/analyze', apiLimiter, analyzeRoutes);
app.use('/api/voice', apiLimiter, voiceRoutes);

// Serve built frontend in production
app.use(express.static(join(__dirname, '..', 'dist')));
app.get('{*path}', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

// WebSocket
const ws = setupWebSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`MindCanvas server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});
