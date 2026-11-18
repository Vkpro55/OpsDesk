import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: Schemas) {
  return function validateRequest(req: Request, _res: Response, next: NextFunction) {
    try {
      if (schemas.body) {
        // parse() throws a ZodError if the data is wrong, otherwise returns the clean data
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        const cleanQuery = schemas.query.parse(req.query);
        // Express 5 makes req.query read-only, so we replace the property instead of assigning
        Object.defineProperty(req, 'query', { value: cleanQuery, writable: true });
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request['params'];
      }

      next();
    } catch (err) {
      // Hand the error to errorHandler, which turns a ZodError into 400 VALIDATION_ERROR
      next(err);
    }
  };
}
