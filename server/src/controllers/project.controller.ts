import type { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import type { PublicProjectsQuery, UpdateProjectBody } from '../validators/project.schema';

export const projectController = {
  async getMyProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.getMyProjects(req.user?.id);
      return res.status(200).json(projects);
    } catch (err) {
      return next(err);
    }
  },

  async getPublicProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as PublicProjectsQuery;
      const result = await projectService.getPublicProjects(query);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async getPublicProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params as { projectId: string };
      const project = await projectService.getPublicProjectById(projectId);
      return res.status(200).json(project);
    } catch (err) {
      return next(err);
    }
  },

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params as { projectId: string };
      const project = await projectService.getProjectById(
        projectId,
        req.user?.id
      );
      return res.status(200).json(project);
    } catch (err) {
      return next(err);
    }
  },

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params as { projectId: string };
      const body = req.body as UpdateProjectBody;
      const updated = await projectService.updateProject(
        projectId,
        req.user?.id,
        body
      );

      return res.status(200).json(updated);
    } catch (err) {
      return next(err);
    }
  },

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params as { projectId: string };
      const result = await projectService.deleteProject(
        projectId,
        req.user?.id
      );
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
};
