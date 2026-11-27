import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import app from '../app.js';
import { config } from '../config/config.js';
import { auth, rbac, tenancy } from '../middleware/auth.js';
import { errorHandler } from '../middleware/error.js';
import { requestContext } from '../middleware/requestContext.js';
import { Membership } from '../models/membership.js';
import { Organization } from '../models/organization.js';
import { User } from '../models/user.js';
import { issueRefreshToken, signAccessToken } from '../services/tokens.js';
import redis from '../utils/redis.js';

const agentOnly = express()
  .use(requestContext)
  .get('/agent-only', auth, tenancy, rbac('agent'), (_req, res) => {
    res.json({ ok: true });
  })
  .use(errorHandler);

let owner: { token: string; orgId: string };
let customerToken: string;
let customerId: string;

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  await mongoose.connect(config.mongoUrl, { dbName: 'opsdesk_test_authz' });
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Organization.init(), Membership.init()]);

  const res = await request(app).post('/api/v1/auth/signup').send({
    orgName: 'Acme',
    name: 'Owner',
    email: 'owner@acme.com',
    password: 'correct-horse',
  });
  owner = { token: res.body.accessToken, orgId: res.body.org.id };

  const customer = await User.create({ email: 'cus@x.com', name: 'Cus' });
  customerId = customer.id;
  await Membership.create({
    orgId: owner.orgId,
    userId: customer._id,
    role: 'customer',
  });
  customerToken = signAccessToken(customerId, owner.orgId);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await redis.quit();
});

it('no token or a bad token -> 401', async () => {
  expect((await request(app).get('/api/v1/me')).status).toBe(401);
  const res = await request(app).get('/api/v1/me').set(bearer('garbage'));
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe('UNAUTHENTICATED');
});

it('/me returns user, org and role', async () => {
  const res = await request(app).get('/api/v1/me').set(bearer(owner.token));
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    user: { email: 'owner@acme.com' },
    org: { id: owner.orgId },
    role: 'owner',
  });
});

it('rbac: customer -> 403 on an agent route, owner passes', async () => {
  const denied = await request(agentOnly)
    .get('/agent-only')
    .set(bearer(customerToken));
  expect(denied.status).toBe(403);
  expect(denied.body.error.code).toBe('FORBIDDEN');
  const allowed = await request(agentOnly)
    .get('/agent-only')
    .set(bearer(owner.token));
  expect(allowed.status).toBe(200);
});

it('removed member -> 401 with a still-valid token, and refresh fails', async () => {
  const refreshToken = await issueRefreshToken(customerId, owner.orgId);
  await Membership.deleteOne({ userId: customerId });

  const me = await request(app).get('/api/v1/me').set(bearer(customerToken));
  expect(me.status).toBe(401);
  const refreshed = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', `rt=${refreshToken}`);
  expect(refreshed.status).toBe(401);
});
