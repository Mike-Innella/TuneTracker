import express, { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody, validateParams } from '../middleware/validate';
import { trackController } from '../controllers/track.controller';
import { trackPublicController } from '../controllers/track.public.controller';
import {
  createTrackEntryBodySchema,
  createTrackCommentBodySchema,
  createTrackBodySchema,
  projectTrackParamsSchema,
  trackIdParamsSchema,
  upsertTrackRatingBodySchema,
  updateTrackBodySchema,
} from '../validators/track.schema';

const router = Router({ mergeParams: true });

router.get(
  '/',
  requireAuth,
  validateParams(projectTrackParamsSchema),
  trackController.getProjectTracks
);

router.post(
  '/',
  requireAuth,
  validateParams(projectTrackParamsSchema),
  validateBody(createTrackBodySchema),
  trackController.createTrack
);

router.get(
  '/:trackId',
  requireAuth,
  validateParams(trackIdParamsSchema),
  trackController.getTrackById
);

router.patch(
  '/:trackId',
  requireAuth,
  validateParams(trackIdParamsSchema),
  validateBody(updateTrackBodySchema),
  trackController.updateTrack
);

router.delete(
  '/:trackId',
  requireAuth,
  validateParams(trackIdParamsSchema),
  trackController.deleteTrack
);

router.put(
  '/:trackId/audio',
  requireAuth,
  validateParams(trackIdParamsSchema),
  express.raw({
    type: ['audio/*', 'application/octet-stream'],
    limit: '150mb',
  }),
  trackController.uploadTrackAudio
);

router.delete(
  '/:trackId/audio',
  requireAuth,
  validateParams(trackIdParamsSchema),
  trackController.deleteTrackAudio
);

router.get(
  '/:trackId/session-logs',
  requireAuth,
  validateParams(trackIdParamsSchema),
  trackController.getSessionLogs
);

router.post(
  '/:trackId/session-logs',
  requireAuth,
  validateParams(trackIdParamsSchema),
  validateBody(createTrackEntryBodySchema),
  trackController.createSessionLog
);

router.get(
  '/:trackId/notes',
  requireAuth,
  validateParams(trackIdParamsSchema),
  trackController.getNotes
);

router.post(
  '/:trackId/notes',
  requireAuth,
  validateParams(trackIdParamsSchema),
  validateBody(createTrackEntryBodySchema),
  trackController.createNote
);

// Public track engagement routes mounted under /projects/:projectId/tracks/:trackId/*
router.get(
  '/:trackId/engagement',
  validateParams(trackIdParamsSchema),
  trackPublicController.getPublicTrackEngagement
);

router.get(
  '/:trackId/comments',
  validateParams(trackIdParamsSchema),
  trackPublicController.getPublicTrackComments
);

router.post(
  '/:trackId/comments',
  requireAuth,
  validateParams(trackIdParamsSchema),
  validateBody(createTrackCommentBodySchema),
  trackPublicController.createPublicTrackComment
);

router.post(
  '/:trackId/like',
  requireAuth,
  validateParams(trackIdParamsSchema),
  trackPublicController.likePublicTrack
);

router.delete(
  '/:trackId/like',
  requireAuth,
  validateParams(trackIdParamsSchema),
  trackPublicController.unlikePublicTrack
);

router.post(
  '/:trackId/rating',
  requireAuth,
  validateParams(trackIdParamsSchema),
  validateBody(upsertTrackRatingBodySchema),
  trackPublicController.ratePublicTrack
);

export default router;
