import { randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { mongo } from 'mongoose';
import { config } from '../config/config.js';
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

interface NewOwner {
  orgName: string;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
}

type UserDoc = NonNullable<Awaited<ReturnType<typeof User.findOne>>>;

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

async function createOrgWithOwner({ orgName, ...owner }: NewOwner) {
  const slug = await uniqueSlug(orgName);
  try {
    return await withTransaction(async () => {
      const org = await Organization.create({ name: orgName, slug });
      const user = await User.create(owner);
      await Membership.create({
        orgId: org._id,
        userId: user._id,
        role: 'owner',
      });
      return { user: user.toPublic(), org: org.toPublic() };
    });
  } catch (err) {
    if (isDuplicateKey(err, 'email') || isDuplicateKey(err, 'googleId'))
      throw new AppError(
        'EMAIL_TAKEN',
        409,
        'This email already has an account.',
      );
    throw err;
  }
}

async function signInToOrg(user: UserDoc, orgSlug?: string) {
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

export async function signup({ password, ...input }: SignupInput) {
  return createOrgWithOwner({
    ...input,
    passwordHash: await hashPassword(password),
  });
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
    throw new AppError(
      'INVALID_CREDENTIALS',
      401,
      "That email and password don't match.",
    );
  return signInToOrg(user, orgSlug);
}

const googleClient = new OAuth2Client();

async function verifyGoogleToken(idToken: string) {
  const payload = await googleClient
    .verifyIdToken({ idToken, audience: config.googleClientId })
    .then((ticket) => ticket.getPayload())
    .catch(() => undefined);
  if (!payload?.sub || !payload.email)
    throw new AppError(
      'INVALID_GOOGLE_TOKEN',
      401,
      'Google sign-in failed. Please try again.',
    );
  if (!payload.email_verified)
    throw new AppError(
      'GOOGLE_EMAIL_UNVERIFIED',
      401,
      'Your Google email is not verified.',
    );
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name ?? payload.email,
  };
}

export async function googleAuth(idToken: string, orgName?: string) {
  const { googleId, email, name } = await verifyGoogleToken(idToken);

  if (orgName) return createOrgWithOwner({ orgName, name, email, googleId });

  const user =
    (await User.findOne({ googleId })) ??
    (await User.findOneAndUpdate(
      { email, googleId: { $exists: false } },
      { $set: { googleId } },
      { returnDocument: 'after' },
    ));
  if (!user)
    throw new AppError(
      'NO_ACCOUNT',
      404,
      'No OpsDesk account uses this Google email. Create an organization first.',
    );
  return signInToOrg(user);
}
