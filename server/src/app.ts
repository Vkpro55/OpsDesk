import express from 'express';
import { errorHandler, notFound } from './middleware/error.js';
import { requestContext } from './middleware/requestContext.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';

const app = express();
app.use(requestContext);
app.use(express.json());

app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', meRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
