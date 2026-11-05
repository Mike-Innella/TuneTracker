export type AuthUser = {
  id: string;
  email: string;
  displayName?: string | null;
  profileImageData?: string | null;
  socialLinks?: Array<{
    id: string;
    label: string;
    url: string;
  }>;
};

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};
