import type { Request, Response, NextFunction } from 'express';
import type { CreateProjectBody } from '../validators/project.create.schema';
import { createProject } from '../services/project.create.service';

export async function createProjectController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const uid = (req as any).user?.id; // align to your requireAuth shape (cookie uid -> req.user)
    const body = req.body as CreateProjectBody;

    const project = await createProject(uid, body);
    return res.status(201).json({ data: project });
  } catch (err) {
    return next(err);
  }
}
