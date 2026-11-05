export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        displayName: string | null;
        profileImageData?: string | null;
        role?: string | null;
      };
    }
  }
}
