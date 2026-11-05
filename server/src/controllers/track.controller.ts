import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  deleteTrackAudioFile,
  saveTrackAudioBuffer,
  saveTrackAudioFile,
  withTrackAudioUrl,
} from '../lib/trackAudio';
import type {
  CreateTrackBody,
  CreateTrackEntryBody,
  UpdateTrackBody,
} from '../validators/track.schema';

async function getProjectForViewer(projectId: string, viewerUserId?: string) {
  if (!viewerUserId) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      visibility: true,
    },
  });

  if (!project) {
    throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  }

  if (project.ownerId !== viewerUserId && project.visibility !== 'PUBLIC') {
    throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }

  return project;
}

function parseUploadedAudio(req: Request) {
  const fileNameHeader = req.header('x-file-name');
  if (!fileNameHeader?.trim()) {
    throw Object.assign(new Error('Missing audio file name header'), { statusCode: 400 });
  }

  let fileName = fileNameHeader.trim();
  try {
    fileName = decodeURIComponent(fileName);
  } catch (_err) {
    // Keep original header value if decode fails.
  }

  const contentTypeHeader = req.header('content-type') || 'application/octet-stream';
  const mimeType = contentTypeHeader.split(';')[0]?.trim().toLowerCase();
  const body = req.body;
  const buffer = Buffer.isBuffer(body)
    ? body
    : body instanceof Uint8Array
      ? Buffer.from(body)
      : Buffer.from([]);

  if (!buffer.byteLength) {
    throw Object.assign(new Error('Audio payload is empty'), { statusCode: 400 });
  }

  return { fileName, buffer, mimeType };
}

export const trackController = {
  async uploadTrackAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const viewerUserId = req.user?.id;
      const project = await getProjectForViewer(projectId, viewerUserId);

      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      const track = await prisma.track.findFirst({
        where: { id: trackId, projectId },
        select: { id: true, s3ObjectKey: true },
      });
      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      const { fileName, buffer, mimeType } = parseUploadedAudio(req);
      const uploadedAudioKey = await saveTrackAudioBuffer({
        fileName,
        buffer,
        ...(mimeType ? { mimeType } : {}),
      });

      try {
        const updated = await prisma.track.update({
          where: { id: track.id },
          data: { s3ObjectKey: uploadedAudioKey },
        });

        if (track.s3ObjectKey) {
          await deleteTrackAudioFile(track.s3ObjectKey);
        }

        return res.status(200).json(withTrackAudioUrl(updated));
      } catch (updateErr) {
        await deleteTrackAudioFile(uploadedAudioKey);
        throw updateErr;
      }
    } catch (err) {
      return next(err);
    }
  },

  async deleteTrackAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const viewerUserId = req.user?.id;
      const project = await getProjectForViewer(projectId, viewerUserId);

      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      const track = await prisma.track.findFirst({
        where: { id: trackId, projectId },
        select: { id: true, s3ObjectKey: true },
      });
      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      const updated = await prisma.track.update({
        where: { id: track.id },
        data: { s3ObjectKey: null },
      });

      if (track.s3ObjectKey) {
        await deleteTrackAudioFile(track.s3ObjectKey);
      }

      return res.status(200).json(withTrackAudioUrl(updated));
    } catch (err) {
      return next(err);
    }
  },

  async getSessionLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const viewerUserId = req.user?.id;
      const project = await getProjectForViewer(projectId, viewerUserId);

      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      const track = await prisma.track.findFirst({
        where: { id: trackId, projectId },
        select: { id: true },
      });
      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      const logs = await prisma.sessionLog.findMany({
        where: { trackId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(logs);
    } catch (err) {
      return next(err);
    }
  },

  async createSessionLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const body = req.body as CreateTrackEntryBody;
      const viewerUserId = req.user?.id;
      const project = await getProjectForViewer(projectId, viewerUserId);

      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      const track = await prisma.track.findFirst({
        where: { id: trackId, projectId },
        select: { id: true },
      });
      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      const created = await prisma.sessionLog.create({
        data: {
          trackId,
          body: body.body,
        },
      });

      return res.status(201).json({ data: created });
    } catch (err) {
      return next(err);
    }
  },

  async getNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const viewerUserId = req.user?.id;
      const project = await getProjectForViewer(projectId, viewerUserId);

      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      const track = await prisma.track.findFirst({
        where: { id: trackId, projectId },
        select: { id: true },
      });
      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      const notes = await prisma.noteForLater.findMany({
        where: { trackId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(notes);
    } catch (err) {
      return next(err);
    }
  },

  async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const body = req.body as CreateTrackEntryBody;
      const viewerUserId = req.user?.id;
      const project = await getProjectForViewer(projectId, viewerUserId);

      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      const track = await prisma.track.findFirst({
        where: { id: trackId, projectId },
        select: { id: true },
      });
      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      const created = await prisma.noteForLater.create({
        data: {
          trackId,
          body: body.body,
        },
      });

      return res.status(201).json({ data: created });
    } catch (err) {
      return next(err);
    }
  },

  async getProjectTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params as { projectId: string };
      await getProjectForViewer(projectId, req.user?.id);

      const tracks = await prisma.track.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(tracks.map((track) => withTrackAudioUrl(track)));
    } catch (err) {
      return next(err);
    }
  },

  async createTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params as { projectId: string };
      const body = req.body as CreateTrackBody;
      const viewerUserId = req.user?.id;

      const project = await getProjectForViewer(projectId, viewerUserId);
      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      let s3ObjectKey: string | undefined;
      if (body.fileName && body.audioDataUrl) {
        s3ObjectKey = await saveTrackAudioFile({
          fileName: body.fileName,
          audioDataUrl: body.audioDataUrl,
        });
      }

      const created = await prisma.track.create({
        data: {
          projectId,
          title: body.title,
          ...(body.description !== undefined
            ? { description: body.description || null }
            : {}),
          status: body.status,
          ...(body.bpm !== undefined ? { bpm: body.bpm } : {}),
          ...(body.key !== undefined ? { key: body.key } : {}),
          ...(s3ObjectKey ? { s3ObjectKey } : {}),
        },
      });

      return res.status(201).json({ data: withTrackAudioUrl(created) });
    } catch (err) {
      return next(err);
    }
  },

  async getTrackById(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      await getProjectForViewer(projectId, req.user?.id);

      const track = await prisma.track.findFirst({
        where: {
          id: trackId,
          projectId,
        },
      });

      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      return res.status(200).json(withTrackAudioUrl(track));
    } catch (err) {
      return next(err);
    }
  },

  async updateTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const body = req.body as UpdateTrackBody;
      const viewerUserId = req.user?.id;

      const project = await getProjectForViewer(projectId, viewerUserId);
      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      const track = await prisma.track.findFirst({
        where: {
          id: trackId,
          projectId,
        },
        select: { id: true, s3ObjectKey: true },
      });

      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      let uploadedAudioKey: string | undefined;

      try {
        if (body.fileName && body.audioDataUrl) {
          uploadedAudioKey = await saveTrackAudioFile({
            fileName: body.fileName,
            audioDataUrl: body.audioDataUrl,
          });
        }

        const updated = await prisma.track.update({
          where: { id: track.id },
          data: {
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.description !== undefined
              ? { description: body.description || null }
              : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
            ...(body.bpm !== undefined ? { bpm: body.bpm } : {}),
            ...(body.key !== undefined ? { key: body.key } : {}),
            ...(uploadedAudioKey !== undefined
              ? { s3ObjectKey: uploadedAudioKey }
              : body.deleteAudio
                ? { s3ObjectKey: null }
                : {}),
          },
        });

        if (
          track.s3ObjectKey &&
          (uploadedAudioKey !== undefined || body.deleteAudio === true)
        ) {
          await deleteTrackAudioFile(track.s3ObjectKey);
        }

        return res.status(200).json(withTrackAudioUrl(updated));
      } catch (updateErr) {
        if (uploadedAudioKey) {
          await deleteTrackAudioFile(uploadedAudioKey);
        }
        throw updateErr;
      }
    } catch (err) {
      return next(err);
    }
  },

  async deleteTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, trackId } = req.params as {
        projectId: string;
        trackId: string;
      };
      const viewerUserId = req.user?.id;

      const project = await getProjectForViewer(projectId, viewerUserId);
      if (project.ownerId !== viewerUserId) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }

      const track = await prisma.track.findFirst({
        where: {
          id: trackId,
          projectId,
        },
        select: { id: true, s3ObjectKey: true },
      });

      if (!track) {
        throw Object.assign(new Error('Track not found'), { statusCode: 404 });
      }

      await prisma.track.delete({
        where: { id: track.id },
      });
      await deleteTrackAudioFile(track.s3ObjectKey);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  },
};
