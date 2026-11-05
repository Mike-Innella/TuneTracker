import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody, validateParams } from '../middleware/validate';
import {
  createPostBodySchema,
  createPostCommentBodySchema,
  postCommentParamsSchema,
  postIdParamSchema,
} from '../validators/post.schema';

const router = Router();

router.get('/', postController.getFeed);

router.get(
  '/:postId',
  validateParams(postIdParamSchema),
  postController.getPostById
);

router.post(
  '/',
  requireAuth,
  validateBody(createPostBodySchema),
  postController.createPost
);

router.delete(
  '/:postId',
  requireAuth,
  validateParams(postIdParamSchema),
  postController.deletePost
);

router.get(
  '/:postId/comments',
  validateParams(postIdParamSchema),
  postController.getPostComments
);

router.post(
  '/:postId/comments',
  requireAuth,
  validateParams(postIdParamSchema),
  validateBody(createPostCommentBodySchema),
  postController.createPostComment
);

router.delete(
  '/:postId/comments/:commentId',
  requireAuth,
  validateParams(postCommentParamsSchema),
  postController.deletePostComment
);

router.post(
  '/:postId/like',
  requireAuth,
  validateParams(postIdParamSchema),
  postController.likePost
);

router.delete(
  '/:postId/like',
  requireAuth,
  validateParams(postIdParamSchema),
  postController.unlikePost
);

export default router;
