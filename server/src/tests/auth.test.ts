import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import app from '../app.js';
import { config } from '../config/config.js';
import { Membership } from '../models/membership.js';
import { Organization } from '../models/organization.js';
import { User } from '../models/user.js';
import redis from '../utils/redis.js';

const creds = { email: 'bob@acme.com', password: 'correct-horse' };

const rtCookie = (res: request.Response) =>
  ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((c) => c.startsWith('rt='))
    ?.split(';')[0];

const refresh = (cookie = '') =>
  request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);

beforeAll(async () => {
  await mongoose.connect(config.mongoUrl, { dbName: 'opsdesk_test_auth' });
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Organization.init(), Membership.init()]);
  await request(app)
    .post('/api/v1/auth/signup')
    .send({ ...creds, orgName: 'Acme', name: 'Bob' });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await redis.quit();
});

it('login returns an access token for the org and an httpOnly refresh cookie', async () => {
  const res = await request(app).post('/api/v1/auth/login').send(creds);
  expect(res.status).toBe(200);
  const payload = jwt.verify(
    res.body.accessToken,
    config.jwtSecret,
  ) as jwt.JwtPayload;
  expect(payload).toMatchObject({
    sub: res.body.user.id,
    orgId: res.body.org.id,
  });
  expect(payload.role).toBeUndefined();
  expect(res.headers['set-cookie']?.[0]).toMatch(/HttpOnly/);
});

it('wrong password and unknown email give the same 401', async () => {
  for (const body of [
    { ...creds, password: 'wrong-password' },
    { ...creds, email: 'nobody@acme.com' },
  ]) {
    const res = await request(app).post('/api/v1/auth/login').send(body);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  }
});

it('unknown orgSlug -> 403 NO_ORG_ACCESS', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ ...creds, orgSlug: 'not-mine' });
  expect(res.status).toBe(403);
});

it('refresh rotates; reusing an old token revokes the whole family', async () => {
  const first = rtCookie(
    await request(app).post('/api/v1/auth/login').send(creds),
  );

  const rotated = await refresh(first);
  expect(rotated.status).toBe(200);
  expect(rotated.body.accessToken).toBeTypeOf('string');
  const second = rtCookie(rotated);
  expect(second).not.toBe(first);

  expect((await refresh(first)).status).toBe(401);
  expect((await refresh(second)).status).toBe(401);
});

it('refresh without a cookie -> 401', async () => {
  expect((await refresh()).status).toBe(401);
});

it('logout revokes the refresh token and clears the cookie', async () => {
  const cookie = rtCookie(
    await request(app).post('/api/v1/auth/login').send(creds),
  );
  const out = await request(app)
    .post('/api/v1/auth/logout')
    .set('Cookie', cookie!);
  expect(out.status).toBe(204);
  expect(rtCookie(out)).toBe('rt=');
  expect((await refresh(cookie)).status).toBe(401);
});
