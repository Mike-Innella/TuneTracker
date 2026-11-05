import { http } from '../../../shared/api/http';
import type { AuthUser } from '../state/auth-types';
import type { PublicUserProfile } from '../../social/types';
import { getStatusCode } from '../../../shared/lib/feedback';

// auth API Wrapper
export const authApi = {
  // get current session user
  async me(): Promise<AuthUser> {
    const res = await http.get('/auth/me');

    // supports either { user } or just user shape directly
    return res.data.user ?? res.data;
  },

  // login request
  async login(payload: { email: string; password: string }) {
    const res = await http.post('/auth/login', payload);
    return res.data;
  },

  // register request
  async register(payload: { email: string; password: string; displayName?: string }) {
    const res = await http.post('/auth/register', payload);
    return res.data;
  },

  // logout request
  async logout() {
    const res = await http.post('/auth/logout');
    return res.data;
  },

  // update profile request
  async updateMe(payload: {
    displayName?: string;
    profileImageData?: string;
    socialLinks?: Array<{ label: string; url: string }>;
  }) {
    try {
      const res = await http.patch('/auth/me', payload);
      return (res.data?.user ?? res.data) as AuthUser;
    } catch (error: unknown) {
      const status = getStatusCode(error);
      if (status === 404 || status === 405) {
        const fallback = await http.post('/auth/me', payload);
        return (fallback.data?.user ?? fallback.data) as AuthUser;
      }
      throw error;
    }
  },

  // delete profile request
  async deleteMe() {
    const res = await http.delete('/auth/me');
    return res.data;
  },

  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    const res = await http.get(`/auth/public/${userId}`);
    return (res.data?.user ?? res.data?.data ?? res.data) as PublicUserProfile;
  },
};
