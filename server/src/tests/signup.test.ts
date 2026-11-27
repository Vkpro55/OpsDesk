import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import app from '../app.js';
import { config } from '../config/config.js';
import { Membership } from '../models/membership.js';
import { Organization } from '../models/organization.js';
import { User } from '../models/user.js';
import { verifyPassword } from '../utils/password.js';

const body = {
  orgName: 'Acme Support',
  name: 'Ann',
  email: ' Ann@Acme.com ',
  password: 'correct-horse',
};

beforeAll(async () => {
  await mongoose.connect(config.mongoUrl, { dbName: 'opsdesk_test_signup' });
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Organization.init(), Membership.init()]); // Indexes can't build inside a transaction.
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

it('creates org, user and owner membership', async () => {
  const res = await request(app).post('/api/v1/auth/signup').send(body);
  expect(res.status).toBe(201);
  expect(res.body.user.email).toBe('ann@acme.com');
  expect(res.body.org.slug).toBe('acme-support');
  expect(res.body.accessToken).toBeTypeOf('string');

  const org = await Organization.findById(res.body.org.id);
  expect(org?.nextTicketNumber).toBe(1000);
  const user = await User.findById(res.body.user.id).select('+passwordHash');
  expect(user?.passwordHash).not.toContain(body.password);
  expect(await verifyPassword(body.password, user!.passwordHash!)).toBe(true);
  expect(await verifyPassword('wrong-password', user!.passwordHash!)).toBe(
    false,
  );
  expect(
    await Membership.findOne({ orgId: org!._id, userId: user!._id }),
  ).toMatchObject({ role: 'owner' });
});

it('duplicate email -> 409 EMAIL_TAKEN and rolls back the new org', async () => {
  const orgsBefore = await Organization.countDocuments();
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({ ...body, orgName: 'Other Co' });
  expect(res.status).toBe(409);
  expect(res.body.error.code).toBe('EMAIL_TAKEN');
  expect(await Organization.countDocuments()).toBe(orgsBefore);
});

it('rejects a short password with 400', async () => {
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({ ...body, password: 'short' });
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('VALIDATION_ERROR');
});
