import type { Request, Response, NextFunction } from 'express';
import type { LoginBody, RegisterBody, UpdateProfileBody } from '../validators/auth.schema';
import {
  authenticateUser,
  deleteProfile,
  getPublicProfile,
  getProfile,
  registerUser,
  updateProfile,
} from '../services/auth.service';
import {
  clearSessionCookie,
  setSessionCookie,
  signSessionToken,
} from '../auth/session';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    // validateBody(registerSchema) overwrites req.body with parsed data
    const body = req.body as RegisterBody;

    const user = await registerUser(body);

    return res.status(201).json({
      ok: true,
      user,
    });
  } catch (err) {
    return next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    }

    const user = await getProfile(req.user.id);
    if (!user) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    }

    return res.json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
}

export async function publicProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params as { userId: string };
    const user = await getPublicProfile(userId);
    return res.json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as LoginBody;
    const user = await authenticateUser(body);

    const token = signSessionToken(user.id);
    setSessionCookie(res, token);

    return res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    return next(err);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    }

    const body = req.body as UpdateProfileBody;
    const user = await updateProfile(req.user.id, {
      ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
      ...(body.profileImageData !== undefined
        ? { profileImageData: body.profileImageData }
        : {}),
      ...(body.socialLinks !== undefined ? { socialLinks: body.socialLinks } : {}),
    });

    return res.status(200).json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
    }

    await deleteProfile(req.user.id);
    clearSessionCookie(res);

    return res.status(200).json({ ok: true, success: true });
  } catch (err) {
    return next(err);
  }
}
