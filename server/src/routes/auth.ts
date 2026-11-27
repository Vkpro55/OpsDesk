import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { signup } from '../services/auth.js';

const signupBody = z.object({
  orgName: z.string().trim().min(2).max(80),
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(128), // Caps scrypt cost per request.
});

const authRouter = Router();

authRouter.post('/signup', validate({ body: signupBody }), async (req, res) => {
  res.status(201).json(await signup(req.body));
});

export { authRouter };
