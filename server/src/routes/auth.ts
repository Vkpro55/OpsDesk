import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { login, signup } from '../services/auth.js';
import {
  issueRefreshToken,
  REFRESH_TTL_SECONDS,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from '../services/tokens.js';
import { AppError } from '../utils/errors.js';

const email = z.string().trim().toLowerCase().pipe(z.email());

const signupBody = z.object({
  orgName: z.string().trim().min(2).max(80),
  name: z.string().trim().min(1).max(80),
  email,
  password: z.string().min(8).max(128),
});

const loginBody = z.object({
  email,
  password: z.string().min(1).max(128),
  orgSlug: z.string().trim().toLowerCase().optional(),
});

const COOKIE = 'rt';
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/api/v1/auth',
} as const;

const readRefreshCookie = (req: Request) =>
  req.headers.cookie?.match(/(?:^|;\s*)rt=([^;]+)/)?.[1];

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(COOKIE, token, {
    ...cookieOptions,
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });

async function startSession(
  res: Response,
  status: number,
  result: { user: { id: string }; org: { id: string } },
) {
  setRefreshCookie(res, await issueRefreshToken(result.user.id, result.org.id));
  res.status(status).json({
    ...result,
    accessToken: signAccessToken(result.user.id, result.org.id),
  });
}

const authRouter = Router();

authRouter.post('/signup', validate({ body: signupBody }), async (req, res) => {
  await startSession(res, 201, await signup(req.body));
});

authRouter.post('/login', validate({ body: loginBody }), async (req, res) => {
  const { email, password, orgSlug } = req.body;
  await startSession(res, 200, await login(email, password, orgSlug));
});

authRouter.post('/refresh', async (req, res) => {
  const token = readRefreshCookie(req);
  if (!token)
    throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Please sign in again');
  const { session, refreshToken } = await rotateRefreshToken(token);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken: signAccessToken(session.userId, session.orgId) });
});

authRouter.post('/logout', async (req, res) => {
  const token = readRefreshCookie(req);
  if (token) await revokeRefreshToken(token);
  res.clearCookie(COOKIE, cookieOptions);
  res.status(204).end();
});

export { authRouter };
