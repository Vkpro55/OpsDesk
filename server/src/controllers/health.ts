import type { Connection } from 'mongoose';
import type { Redis } from 'ioredis';
import type { Request, Response } from 'express';

export function readinessHandler(
  dbConnection: Connection,
  redisConnection: Redis,
) {
  return async (req: Request, res: Response) => {
    try {
      await dbConnection.db!.admin().ping();
      await redisConnection.ping();
      res.status(200).json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'error' });
    }
  };
}
