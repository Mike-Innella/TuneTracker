import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Validates request body using a provided Zod schema.
 *
 * - Returns HTTP 400 if validation fails.
 * - Replaces req.body with the parsed result to ensure the controller receives
 *   sanitized and type-safe values.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const err = Object.assign(new Error('Validation failed'), {
        statusCode: 400,
        details: result.error.flatten(),
      });
      return next(err);
    }

    // Replace body with validated payload
    req.body = result.data;
    return next();
  };
}

/**
 * Validates query parameters using a Zod schema.
 *
 * Note:
 * Express 5 exposes req.query as a getter-only property, so the validated
 * result is not reassigned. Controllers should parse values from req.query
 * as needed after this middleware passes.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const err = Object.assign(new Error('Validation failed'), {
        statusCode: 400,
        details: result.error.flatten(),
      });
      return next(err);
    }

    return next();
  };
}

/**
 * Validates route parameters (req.params).
 *
 * Used primarily for resources with ID parameters (e.g., /projects/:projectId).
 * If validation succeeds, req.params is replaced with the parsed result so
 * downstream handlers receive normalized values.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const err = Object.assign(new Error('Validation failed'), {
        statusCode: 400,
        details: result.error.flatten(),
      });
      return next(err);
    }

    // Replace params with validated values
    (req as any).params = result.data;

    return next();
  };
}
