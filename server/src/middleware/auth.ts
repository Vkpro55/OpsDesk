import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { Membership, ROLES, type Role } from '../models/membership.js';
import { AppError } from '../utils/errors.js';
import { getContext } from './requestContext.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; orgId: string };
    }
  }
}

const unauthenticated = () =>
  new AppError('UNAUTHENTICATED', 401, 'Authentication required');

export function auth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1] ?? '';
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;
    req.auth = { userId: payload.sub!, orgId: payload.orgId };
  } catch {
    throw unauthenticated();
  }
  next();
}

export async function tenancy(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const { userId, orgId } = req.auth!;
  const membership = await Membership.findOne({
    orgId,
    userId,
    status: 'active',
  });
  if (!membership) throw unauthenticated();
  Object.assign(getContext()!, { orgId, userId, role: membership.role });
  next();
}

export const rbac =
  (minRole: Role) => (_req: Request, _res: Response, next: NextFunction) => {
    const role = getContext()?.role;
    if (!role || ROLES.indexOf(role) > ROLES.indexOf(minRole))
      throw new AppError('FORBIDDEN', 403, 'Insufficient role');
    next();
  };
