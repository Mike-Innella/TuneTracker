import { Router } from 'express';
import { validateBody, validateParams } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  publicProfileParamsSchema,
  updateProfileSchema,
} from '../validators/auth.schema';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

/**
 * Auth Router
 */

// existing ping route (keep)
router.get('/ping', (_req, res) => {
  return res.json({ ok: true, feature: 'auth', route: 'ping' });
});

// Register (MVC: validate -> controller -> service -> prisma)
router.post('/register', validateBody(registerSchema), authController.register);

// Login (MVC: validate -> controller -> service -> prisma -> set cookie)
router.post('/login', validateBody(loginSchema), authController.login);

// Logout (MVC: controller clears cookie)
router.post('/logout', authController.logout);

// Me (MVC: middleware -> controller)
router.get('/me', requireAuth, authController.me);
router.patch('/me', requireAuth, validateBody(updateProfileSchema), authController.updateMe);
router.post('/me', requireAuth, validateBody(updateProfileSchema), authController.updateMe);
router.delete('/me', requireAuth, authController.deleteMe);
router.get('/public/:userId', validateParams(publicProfileParamsSchema), authController.publicProfile);

export default router;
