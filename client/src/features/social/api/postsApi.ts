import { http } from '../../../shared/api/http';
import type { FeedPost, PostComment } from '../types';

export type { FeedPost, PostComment } from '../types';

export const postsApi = {
  async getFeed(): Promise<FeedPost[]> {
    const res = await http.get('/posts');
    return (res.data?.data ?? res.data ?? []) as FeedPost[];
  },

  async getPostDetail(postId: string): Promise<FeedPost> {
    const res = await http.get(`/posts/${postId}`);
    return (res.data?.data ?? res.data) as FeedPost;
  },

  async createPost(payload: { content: string; projectId?: string }): Promise<FeedPost> {
    const res = await http.post('/posts', payload);
    return (res.data?.data ?? res.data) as FeedPost;
  },

  async deletePost(postId: string): Promise<{ success: boolean }> {
    const res = await http.delete(`/posts/${postId}`);
    return (res.data?.data ?? res.data) as { success: boolean };
  },

  async getComments(postId: string): Promise<PostComment[]> {
    const res = await http.get(`/posts/${postId}/comments`);
    return (res.data?.data ?? res.data ?? []) as PostComment[];
  },

  async createComment(postId: string, payload: { content: string }): Promise<PostComment> {
    const res = await http.post(`/posts/${postId}/comments`, payload);
    return (res.data?.data ?? res.data) as PostComment;
  },

  async deleteComment(postId: string, commentId: string): Promise<{ success: boolean }> {
    const res = await http.delete(`/posts/${postId}/comments/${commentId}`);
    return (res.data?.data ?? res.data) as { success: boolean };
  },

  async likePost(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await http.post(`/posts/${postId}/like`);
    return (res.data?.data ?? res.data) as { liked: boolean; likesCount: number };
  },

  async unlikePost(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await http.delete(`/posts/${postId}/like`);
    return (res.data?.data ?? res.data) as { liked: boolean; likesCount: number };
  },
};
