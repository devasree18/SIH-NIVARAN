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

app.use(cors());
app.use(express.json());
app.use(correlationMiddleware);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'UP',
    platform: 'NIVARAN - Smart Agricultural Procurement Management Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Versioned API Routes
app.use('/api/v1', routes);

// Serve frontend static assets in production
const possibleDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];
const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  logger.info(`Serving static client assets from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-API GET routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`NIVARAN Backend API Server listening on port ${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/api/health`);
  });
}

export default app;
