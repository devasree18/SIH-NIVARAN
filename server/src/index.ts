import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { correlationMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Parse and normalize allowed frontend origins from FRONTEND_URL environment variable
const rawFrontendUrls = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
const configuredOrigins = rawFrontendUrls
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean)
  .flatMap((url) => (url.startsWith('http://') || url.startsWith('https://') ? [url] : [`https://${url}`, `http://${url}`]));

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl, Postman, health checks)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  })
);

app.use(express.json());
app.use(correlationMiddleware);

// Health check endpoints for Render Web Service and monitoring
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'UP',
    platform: 'NIVARAN - Smart Agricultural Procurement Management Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Versioned API Routes
app.use('/api/v1', routes);

// Serve frontend static assets if client/dist exists (Unified Single Service + Static Fallback)
const candidatePaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];
const clientDist = candidatePaths.find((p) => fs.existsSync(p));

if (clientDist) {
  logger.info(`Serving frontend from: ${clientDist}`);
  app.use(express.static(clientDist));

  // SPA fallback for all non-API GET routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(PORT), '0.0.0.0', () => {
    logger.info(`NIVARAN Backend API Server listening on port ${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);
  });
}

export default app;
