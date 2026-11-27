import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import app from '../app.js';
import { config } from '../config/config.js';
import { Membership } from '../models/membership.js';
import { Organization } from '../models/organization.js';
import { User } from '../models/user.js';
import redis from '../utils/redis.js';

const verify = vi.spyOn(OAuth2Client.prototype, 'verifyIdToken');

const googleSays = (payload: Partial<TokenPayload>) =>
  verify.mockResolvedValue({
    getPayload: () => ({ email_verified: true, ...payload }),
  } as never);

const google = (body: object) =>
  request(app)
    .post('/api/v1/auth/google')
    .send({ idToken: 'x', ...body });

beforeAll(async () => {
  await mongoose.connect(config.mongoUrl, { dbName: 'opsdesk_test_google' });
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Organization.init(), Membership.init()]);
  await request(app).post('/api/v1/auth/signup').send({
    orgName: 'Pass Co',
    name: 'Pat',
    email: 'pat@pass.co',
    password: 'correct-horse',
  });
});

beforeEach(() => verify.mockReset());

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await redis.quit();
});

it('signup with Google creates the org and owner, then signs in by googleId', async () => {
  googleSays({ sub: 'g-new', email: 'New@G.com', name: 'Nia' });
  const created = await google({ orgName: 'Goog Co' });
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({
    user: { email: 'new@g.com', name: 'Nia' },
    org: { name: 'Goog Co' },
  });
  expect(created.body.accessToken).toBeTypeOf('string');
  expect(verify).toHaveBeenCalledWith({
    idToken: 'x',
    audience: config.googleClientId,
  });

  googleSays({ sub: 'g-new', email: 'changed@g.com' });
  const again = await google({});
  expect(again.status).toBe(200);
  expect(again.body.user.email).toBe('new@g.com');
});

it('links an existing password account by verified email', async () => {
  googleSays({ sub: 'g-pat', email: 'pat@pass.co' });
  const res = await google({});
  expect(res.status).toBe(200);
  expect(res.body.org.name).toBe('Pass Co');
  expect(await User.findOne({ email: 'pat@pass.co' })).toMatchObject({
    googleId: 'g-pat',
  });
});

it('Google signup with a taken email -> 409 EMAIL_TAKEN', async () => {
  googleSays({ sub: 'g-other', email: 'pat@pass.co' });
  const res = await google({ orgName: 'Dup Co' });
  expect(res.status).toBe(409);
  expect(res.body.error.code).toBe('EMAIL_TAKEN');
});

it('unknown Google user without orgName -> 404 NO_ACCOUNT', async () => {
  googleSays({ sub: 'g-ghost', email: 'ghost@g.com' });
  expect((await google({})).body.error.code).toBe('NO_ACCOUNT');
});

it('unverified email or a bad token -> 401, nothing linked', async () => {
  googleSays({ sub: 'g-evil', email: 'pat@pass.co', email_verified: false });
  expect((await google({})).body.error.code).toBe('GOOGLE_EMAIL_UNVERIFIED');

  verify.mockResolvedValue({
    getPayload: () => {
      throw new Error('Wrong recipient');
    },
  } as never);
  expect((await google({})).body.error.code).toBe('INVALID_GOOGLE_TOKEN');
});
