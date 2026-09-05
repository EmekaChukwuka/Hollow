// src/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from './config/env.js';
import { connectToDatabase, createIndexes, getDb } from './config/database.js';
import { constants } from './config/constants.js';

// Route imports
import { authRoutes } from './routes/authRoutes.js';
import { projectRoutes } from './routes/projectRoutes.js';
import { endpointRoutes } from './routes/endpointRoutes.js';
import { dataRoutes } from './routes/dataRoutes.js';
import { publicRoutes } from './routes/publicRoutes.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// --- Middleware ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(corsMiddleware);
app.use(express.json({ limit: env.MAX_RESPONSE_SIZE }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// --- Static Files ---
app.use(express.static(join(__dirname, 'dashboard')));

// --- Favicon ---
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// --- Root ---
app.get('/', (req, res) => {
  res.json({
    name: 'Hollow',
    version: '0.1.0',
    status: 'running',
    docs: 'https://hollow.dev/docs',
    dashboard: '/dashboard',
    health: '/health'
  });
});

// ============================================
// 🔥 IMPORTANT: API Routes MUST come BEFORE publicRoutes
// ============================================

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/endpoints', endpointRoutes);
app.use('/api/projects/:projectId/endpoints/:endpointId/data', dataRoutes);

// --- Public API Router (catch-all - MUST be LAST) ---
app.use('/', publicRoutes);

// --- Error Handler (MUST be last) ---
app.use(errorHandler);

// --- Start Server ---
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();
    const db = getDb();

    // Create indexes
    await createIndexes();

    // Start server
    app.listen(env.PORT, () => {
      console.log(`🚀 Hollow running on http://localhost:${env.PORT}`);
      console.log(`📡 Dashboard: http://localhost:${env.PORT}/dashboard`);
      console.log(`🔗 Health: http://localhost:${env.PORT}/health`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});

startServer();