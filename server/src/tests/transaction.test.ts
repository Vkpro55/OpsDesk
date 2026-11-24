import mongoose from 'mongoose';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { config } from '../config/config.js';
import { User } from '../models/user.js';
import { withTransaction } from '../utils/db.js';

beforeAll(async () => {
  await mongoose.connect(config.mongoUrl, { dbName: 'opsdesk_test_tx' });
  await User.init();
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

it('rolls back both writes when an error is thrown after the second', async () => {
  await expect(
    withTransaction(async () => {
      await User.create({ email: 'a@x.com', name: 'A' });
      await User.create({ email: 'b@x.com', name: 'B' });
      throw new Error('boom');
    }),
  ).rejects.toThrow('boom');

  expect(await User.countDocuments()).toBe(0);
});
