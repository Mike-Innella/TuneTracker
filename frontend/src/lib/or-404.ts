import 'server-only';
import { notFound } from 'next/navigation';
import { AppError } from '@tunetracker/backend';

/** Turns a service 404/403 into the Next.js not-found page; other errors propagate. */
export async function or404<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (err) {
    if (err instanceof AppError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }
}
