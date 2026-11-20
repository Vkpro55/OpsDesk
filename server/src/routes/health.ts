import { Router } from 'express';
import { readinessHandler } from '../controllers/health.js';
import redis from '../utils/redis.js';
import mongoose from 'mongoose';

const healthRouter = Router();

healthRouter.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

healthRouter.get('/health/ready', readinessHandler(mongoose.connection, redis));

export { healthRouter };
