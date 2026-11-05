import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { verifySessionToken, clearSessionCookie, SESSION_COOKIE_NAME } from "../auth/session";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (!token || typeof token !== "string") {
      return next(Object.assign(new Error("Unauthorized"), { statusCode: 401 }));
    }

    const { sub: userId } = verifySessionToken(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        profileImageData: true,
      },
    });

    if (!user) {
      clearSessionCookie(res);
      return next(Object.assign(new Error("Unauthorized"), { statusCode: 401 }));
    }

    req.user = user;
    return next();
  } catch {
    clearSessionCookie(res);
    return next(Object.assign(new Error("Unauthorized"), { statusCode: 401 }));
  }
}
