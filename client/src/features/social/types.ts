export type SocialAuthor = {
  id: string;
  displayName: string | null;
  email?: string | null;
  profileImageData?: string | null;
};

export type SocialLink = {
  id?: string;
  label: string;
  url: string;
};

export type PublicUserProfile = {
  id: string;
  displayName: string | null;
  profileImageData?: string | null;
  socialLinks: SocialLink[];
};

export type FeedPost = {
  id: string;
  content: string;
  createdAt: string;
  author: SocialAuthor;
  project?: {
    id: string;
    title: string;
  } | null;
  _count?: {
    comments: number;
    likes: number;
  };
  likedByMe?: boolean;
};

export type PostComment = {
  id: string;
  content: string;
  createdAt: string;
  author: SocialAuthor;
};

export type PublicTrack = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  audioUrl?: string | null;
};

export type PublicProject = {
  id: string;
  title: string;
  description?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  owner?: SocialAuthor;
  _count?: {
    tracks: number;
  };
  trackCount?: number;
  tracks?: PublicTrack[];
};

export type TrackEngagement = {
  likesCount: number;
  commentsCount: number;
  ratingAverage: number | null;
  ratingCount: number;
  likedByMe: boolean;
  myRating: number | null;
};

export type TrackComment = {
  id: string;
  body: string;
  createdAt: string;
  author: SocialAuthor;
};
