import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: Schemas) {
  return function validateRequest(
    req: Request,
    _res: Response,
    next: NextFunction,
  ) {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        const cleanQuery = schemas.query.parse(req.query);
        // Express 5 req.query is read-only.
        Object.defineProperty(req, 'query', {
          value: cleanQuery,
          writable: true,
        });
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request['params'];
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
