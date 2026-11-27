import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { AppError } from '../utils/errors.js';
import redis from '../utils/redis.js';

export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

interface Session {
  userId: string;
  orgId: string;
  familyId: string;
}

const sha256 = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const invalid = () =>
  new AppError('INVALID_REFRESH_TOKEN', 401, 'Please sign in again');

const revokeFamily = (familyId: string) =>
  redis.set(`family:${familyId}:revoked`, '1', 'EX', REFRESH_TTL_SECONDS);

async function lookup(hash: string): Promise<Session | null> {
  const raw = await redis.get(`refresh:${hash}`);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export const signAccessToken = (userId: string, orgId: string) =>
  jwt.sign({ orgId }, config.jwtSecret, { subject: userId, expiresIn: '15m' });

export async function issueRefreshToken(
  userId: string,
  orgId: string,
  familyId: string = randomUUID(),
): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const session: Session = { userId, orgId, familyId };
  await redis.set(
    `refresh:${sha256(token)}`,
    JSON.stringify(session),
    'EX',
    REFRESH_TTL_SECONDS,
  );
  return token;
}

export async function rotateRefreshToken(token: string) {
  const hash = sha256(token);
  const session = await lookup(hash);
  if (!session) throw invalid();
  if (await redis.exists(`family:${session.familyId}:revoked`)) throw invalid();

  // NX makes concurrent refreshes race-safe.
  const firstUse = await redis.set(
    `refresh:${hash}:used`,
    '1',
    'EX',
    REFRESH_TTL_SECONDS,
    'NX',
  );
  if (!firstUse) {
    await revokeFamily(session.familyId);
    throw invalid();
  }

  const { userId, orgId, familyId } = session;
  return {
    session,
    refreshToken: await issueRefreshToken(userId, orgId, familyId),
  };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const session = await lookup(sha256(token));
  if (session) await revokeFamily(session.familyId);
}
