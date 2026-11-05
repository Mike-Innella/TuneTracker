import { ZodError, type ZodType, z } from 'zod';
import type { ActionResult } from '@tunetracker/shared';

export class AppError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 413 | 429,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Not found') => new AppError(404, what);
export const forbidden = (what = 'You do not have permission to do that') => new AppError(403, what);

export function parse<S extends ZodType>(schema: S, input: unknown): z.output<S> {
  return schema.parse(input);
}

/** Converts thrown errors into a serialisable result; unknown errors never leak details. */
export function toActionError(err: unknown): ActionResult<never> {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, error: 'Please fix the highlighted fields', fieldErrors };
  }
  if (err instanceof AppError) return { ok: false, error: err.message };
  // Prisma unique violation
  if (typeof err === 'object' && err && 'code' in err && err.code === 'P2002') {
    return { ok: false, error: 'That already exists' };
  }
  console.error('[action] unexpected error', err);
  return { ok: false, error: 'Something went wrong. Please try again.' };
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    // let Next.js redirect()/notFound() control-flow errors propagate
    if (err && typeof err === 'object' && 'digest' in err) throw err;
    return toActionError(err);
  }
}
