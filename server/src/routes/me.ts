import { Router } from 'express';
import { auth, tenancy } from '../middleware/auth.js';
import { getContext } from '../middleware/requestContext.js';
import { Organization } from '../models/organization.js';
import { User } from '../models/user.js';

const meRouter = Router();

meRouter.get('/me', auth, tenancy, async (_req, res) => {
  const { userId, orgId, role } = getContext()!;
  const [user, org] = await Promise.all([
    User.findById(userId),
    Organization.findById(orgId),
  ]);
  res.json({ user: user!.toPublic(), org: org!.toPublic(), role });
});

export { meRouter };
