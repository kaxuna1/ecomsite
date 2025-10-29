import { Router, Request, Response } from 'express';
import userRoutes from './user.routes';
import { db } from '../config/database';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  const dbHealthy = await db.healthCheck();

  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: dbHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy ? 'connected' : 'disconnected',
  };

  const statusCode = dbHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

// API routes
router.use('/users', userRoutes);

export default router;
