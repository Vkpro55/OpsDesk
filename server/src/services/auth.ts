import { randomBytes } from 'node:crypto';
import { mongo } from 'mongoose';
import { Membership } from '../models/membership.js';
import { Organization } from '../models/organization.js';
import { User } from '../models/user.js';
import { withTransaction } from '../utils/db.js';
import { AppError } from '../utils/errors.js';
import { hashPassword } from '../utils/password.js';

export interface SignupInput {
  orgName: string;
  name: string;
  email: string;
  password: string;
}

const isDuplicateKey = (err: unknown, field: string) =>
  err instanceof mongo.MongoServerError &&
  err.code === 11000 &&
  field in (err.keyPattern ?? {});

// ponytail: slug race gives 500; retry on E11000.
async function uniqueSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'org';
  const taken = await Organization.exists({ slug: base });
  return taken ? `${base}-${randomBytes(3).toString('hex')}` : base;
}

export async function signup(input: SignupInput) {
  // Slow hashing would hold transaction open.
  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueSlug(input.orgName);

  try {
    // Unique index, not pre-check: race-safe.
    return await withTransaction(async () => {
      const org = await Organization.create({ name: input.orgName, slug });
      const user = await User.create({
        email: input.email,
        name: input.name,
        passwordHash,
      });
      await Membership.create({
        orgId: org._id,
        userId: user._id,
        role: 'owner',
      });
      return {
        user: user.toPublic(),
        org: { id: org.id as string, name: org.name, slug: org.slug },
      };
    });
  } catch (err) {
    if (isDuplicateKey(err, 'email'))
      throw new AppError('EMAIL_TAKEN', 409, 'Email is already registered');
    throw err;
  }
}
