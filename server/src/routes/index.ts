import { Router } from 'express';
import authRoutes from './auth.route';
import projectRoutes from './project.route';
import postRoutes from './post.route';

const router = Router();

router.get('/ping', (_req, res) => {
  res.json({ ok: true, message: 'API router working' });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/posts', postRoutes);

export default router;
