import type { NextFunction, Request, Response } from 'express';
import { trackPublicService } from '../services/track.public.service';
import type {
  CreateTrackCommentBody,
  UpsertTrackRatingBody,
} from '../validators/track.schema';

export const trackPublicController = {
  async getPublicTrackEngagement(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const result = await trackPublicService.getEngagement(projectId, trackId, req.user?.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async getPublicTrackComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const result = await trackPublicService.getComments(projectId, trackId);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async createPublicTrackComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const body = req.body as CreateTrackCommentBody;
      const result = await trackPublicService.createComment(
        projectId,
        trackId,
        req.user?.id,
        body
      );
      return res.status(201).json({ data: result });
    } catch (err) {
      return next(err);
    }
  },

  async likePublicTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const result = await trackPublicService.like(projectId, trackId, req.user?.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async unlikePublicTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const result = await trackPublicService.unlike(projectId, trackId, req.user?.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async ratePublicTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const body = req.body as UpsertTrackRatingBody;
      const result = await trackPublicService.rate(projectId, trackId, req.user?.id, body);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
};
