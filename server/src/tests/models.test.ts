import mongoose from 'mongoose';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { config } from '../config/config.js';
import { Membership } from '../models/membership.js';
import { Organization } from '../models/organization.js';
import { User } from '../models/user.js';

beforeAll(async () => {
  await mongoose.connect(config.mongoUrl, { dbName: 'opsdesk_test' });
  await mongoose.connection.dropDatabase();
  await Promise.all([Organization.init(), User.init(), Membership.init()]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

it('creates one of each, applies defaults, and rejects a duplicate membership', async () => {
  const org = await Organization.create({ name: 'Acme', slug: 'Acme' });
  const user = await User.create({ email: 'A@X.com', name: 'Ann', passwordHash: 'secret' });
  const m = await Membership.create({ orgId: org._id, userId: user._id, role: 'agent' });

  expect(org.slug).toBe('acme');
  expect(org.settings.autoAssignMode).toBe('off');
  expect(org.settings.slaPolicies).toHaveLength(4);
  expect(m.openTicketCount).toBe(0);
  expect(user.toPublic()).toEqual({ id: user.id, email: 'a@x.com', name: 'Ann' });

  await expect(
    Membership.create({ orgId: org._id, userId: user._id, role: 'customer' }),
  ).rejects.toThrow(/duplicate key/);
});
