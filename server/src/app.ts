import express from 'express';
import { errorHandler, notFound } from './middleware/error.js';
import { requestContext } from './middleware/requestContext.js';

const app = express();
app.use(requestContext);

// Serialize the request body as JSON
app.use(express.json());

// routes mount here

app.use(notFound);

// Express register this as error handler and calls it -> next(err)
app.use(errorHandler);

export default app;
