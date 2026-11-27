import { randomBytes } from 'node:crypto';
import { mongo } from 'mongoose';
import { Membership } from '../models/membership.js';
import { Organization } from '../models/organization.js';
import { User } from '../models/user.js';
import { withTransaction } from '../utils/db.js';
import { AppError } from '../utils/errors.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

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
  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueSlug(input.orgName);

  try {
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
      return { user: user.toPublic(), org: org.toPublic() };
    });
  } catch (err) {
    if (isDuplicateKey(err, 'email'))
      throw new AppError('EMAIL_TAKEN', 409, 'Email is already registered');
    throw err;
  }
}

let dummyHash: Promise<string> | undefined;

export async function login(email: string, password: string, orgSlug?: string) {
  const user = await User.findOne({ email }).select('+passwordHash');
  dummyHash ??= hashPassword('dummy-password');
  const ok = await verifyPassword(
    password,
    user?.passwordHash ?? (await dummyHash),
  );
  if (!user || !ok)
    throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');

  const filter: Record<string, unknown> = {
    userId: user._id,
    status: 'active',
  };
  if (orgSlug)
    filter.orgId = (await Organization.findOne({ slug: orgSlug }))?._id ?? null;
  const membership = await Membership.findOne(filter).sort({ createdAt: 1 });
  const org = membership && (await Organization.findById(membership.orgId));
  if (!org)
    throw new AppError(
      'NO_ORG_ACCESS',
      403,
      'No active membership in this organization',
    );

  return { user: user.toPublic(), org: org.toPublic() };
}
