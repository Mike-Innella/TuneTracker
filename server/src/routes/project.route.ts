import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';

import { publicProjectsQuerySchema } from '../validators/project.schema';
import {
  projectIdParamSchema,
  updateProjectBodySchema,
} from '../validators/project.schema';

import { createProjectBodySchema } from '../validators/project.create.schema';
import { createProjectController } from '../controllers/project.create.controller';
import trackRoutes from './track.route';
import { trackPublicController } from '../controllers/track.public.controller';
import {
  createTrackCommentBodySchema,
  publicTrackParamsSchema,
  upsertTrackRatingBodySchema,
} from '../validators/track.schema';

const router = Router();

// Public endpoints first
router.get(
  '/public',
  validateQuery(publicProjectsQuerySchema),
  projectController.getPublicProjects
);
router.get(
  '/public/:projectId',
  validateParams(projectIdParamSchema),
  projectController.getPublicProjectById
);
router.get(
  '/public/:projectId/tracks/:trackId/engagement',
  validateParams(publicTrackParamsSchema),
  trackPublicController.getPublicTrackEngagement
);
router.get(
  '/public/:projectId/tracks/:trackId/comments',
  validateParams(publicTrackParamsSchema),
  trackPublicController.getPublicTrackComments
);
router.post(
  '/public/:projectId/tracks/:trackId/comments',
  requireAuth,
  validateParams(publicTrackParamsSchema),
  validateBody(createTrackCommentBodySchema),
  trackPublicController.createPublicTrackComment
);
router.post(
  '/public/:projectId/tracks/:trackId/like',
  requireAuth,
  validateParams(publicTrackParamsSchema),
  trackPublicController.likePublicTrack
);
router.delete(
  '/public/:projectId/tracks/:trackId/like',
  requireAuth,
  validateParams(publicTrackParamsSchema),
  trackPublicController.unlikePublicTrack
);
router.post(
  '/public/:projectId/tracks/:trackId/rating',
  requireAuth,
  validateParams(publicTrackParamsSchema),
  validateBody(upsertTrackRatingBodySchema),
  trackPublicController.ratePublicTrack
);

// Authenticated collection routes
router.get('/', requireAuth, projectController.getMyProjects);

router.post(
  '/',
  requireAuth,
  validateBody(createProjectBodySchema),
  createProjectController
);

// ID routes last
router.get(
  '/:projectId',
  requireAuth,
  validateParams(projectIdParamSchema),
  projectController.getProjectById
);

router.patch(
  '/:projectId',
  requireAuth,
  validateParams(projectIdParamSchema),
  validateBody(updateProjectBodySchema),
  projectController.updateProject
);

router.delete(
  '/:projectId',
  requireAuth,
  validateParams(projectIdParamSchema),
  projectController.deleteProject
);

router.use('/:projectId/tracks', trackRoutes);

export default router;
