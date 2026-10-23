import express from 'express';
import request from 'supertest';
import { expect, it } from 'vitest';
import { getContext, requestContext } from '../middleware/requestContext.js';

it('exposes the request id to downstream code and echoes it in the header', async () => {
  const app = express();
  app.use(requestContext);
  app.get('/', async (_req, res) => {
    await new Promise((r) => setTimeout(r, 1));
    res.json({ id: getContext()?.requestId });
  });

  const res = await request(app).get('/');
  expect(res.body.id).toBe(res.headers['x-request-id']);
});
