import type { NextFunction, Request, Response } from 'express';
import { postService } from '../services/post.service';
import type { CreatePostBody, CreatePostCommentBody } from '../validators/post.schema';

export const postController = {
  async getFeed(_req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await postService.getFeed();
      return res.status(200).json(posts);
    } catch (err) {
      return next(err);
    }
  },

  async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params as { postId: string };
      const post = await postService.getPostById(postId);
      return res.status(200).json(post);
    } catch (err) {
      return next(err);
    }
  },

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as CreatePostBody;
      const created = await postService.createPost(req.user?.id, body);
      return res.status(201).json({ data: created });
    } catch (err) {
      return next(err);
    }
  },

  async getPostComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params as { postId: string };
      const comments = await postService.getPostComments(postId);
      return res.status(200).json(comments);
    } catch (err) {
      return next(err);
    }
  },

  async createPostComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params as { postId: string };
      const body = req.body as CreatePostCommentBody;
      const created = await postService.createPostComment(
        postId,
        req.user?.id,
        body
      );
      return res.status(201).json({ data: created });
    } catch (err) {
      return next(err);
    }
  },

  async likePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params as { postId: string };
      const result = await postService.likePost(postId, req.user?.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async unlikePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params as { postId: string };
      const result = await postService.unlikePost(postId, req.user?.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params as { postId: string };
      const result = await postService.deletePost(postId, req.user?.id);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async deletePostComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId, commentId } = req.params as {
        postId: string;
        commentId: string;
      };
      const result = await postService.deletePostComment(
        postId,
        commentId,
        req.user?.id
      );
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },
};
