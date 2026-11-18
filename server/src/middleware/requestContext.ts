import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface Ctx {
  requestId: string;
}

// Store follows the request through nested calls, timers and callbacks.
export const asyncLocalStorage = new AsyncLocalStorage<Ctx>();
export const getContext = () => asyncLocalStorage.getStore();

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = req.header('x-request-id') ?? crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  asyncLocalStorage.run({ requestId }, next);
}
