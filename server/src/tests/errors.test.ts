import request from 'supertest';
import { z } from 'zod';
import { expect, it } from 'vitest';
import express from 'express';
import { errorHandler, notFound } from '../middleware/error.js';
import { requestContext } from '../middleware/requestContext.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../utils/errors.js';

const app = express();
app.use(requestContext, express.json());
app.get('/t/app-error', () => {
  throw new AppError('TICKET_NOT_FOUND', 404, 'nope');
});
app.post('/t/validate', validate({ body: z.object({ n: z.number() }) }), (req, res) => res.json(req.body));
app.use(notFound);
app.use(errorHandler);

it('unknown route -> 404 standard shape with requestId', async () => {
  const res = await request(app).get('/nope');
  expect(res.status).toBe(404);
  expect(res.body.error).toMatchObject({ code: 'ROUTE_NOT_FOUND', requestId: res.headers['x-request-id'] });
});

it('AppError renders its code/status', async () => {
  const res = await request(app).get('/t/app-error');
  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('TICKET_NOT_FOUND');
});

it('validate rejects bad body with 400 VALIDATION_ERROR, passes good body', async () => {
  const bad = await request(app).post('/t/validate').send({ n: 'x' });
  expect(bad.status).toBe(400);
  expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  const ok = await request(app).post('/t/validate').send({ n: 1 });
  expect(ok.body).toEqual({ n: 1 });
});
