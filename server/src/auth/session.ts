import jwt, { JwtPayload } from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../lib/env";

const COOKIE_NAME = "tt_session";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signSessionToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    getJwtSecret(),
    { expiresIn: "7d" } // adjust if your docs specify differently
  );
}

export function verifySessionToken(token: string): { sub: string } {
  const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

  const sub = decoded.sub;
  if (!sub || typeof sub !== "string") throw new Error("Invalid token payload");

  return { sub };
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.sessionCookieSecure,
    path: "/",
  };
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions(),
    // maxAge is optional because JWT has exp, but it helps the browser manage it:
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  // Must match path/samesite/secure to reliably clear
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
