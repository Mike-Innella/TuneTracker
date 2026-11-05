import { Avatar, Box, Stack, Typography } from '@mui/material';
import type { SocialAuthor } from '../types';
import { mutedTextSx, wrapAnywhereSx } from '../../../app/theme/uiStyles';
import { formatDate } from '../utils';

type AuthorMetaProps = {
  author: SocialAuthor;
  createdAt: string;
  avatarSize?: number;
  variant?: 'subtitle2' | 'caption';
  onAvatarClick?: () => void;
};

function authorLabel(author: SocialAuthor) {
  return author.displayName || author.email || 'Unknown';
}

export default function AuthorMeta({
  author,
  createdAt,
  avatarSize = 34,
  variant = 'subtitle2',
  onAvatarClick,
}: AuthorMetaProps) {
  const isClickable = Boolean(onAvatarClick);

  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
      <Avatar
        src={author.profileImageData || undefined}
        alt={authorLabel(author)}
        onClick={onAvatarClick}
        onKeyDown={(event) => {
          if (!onAvatarClick) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onAvatarClick();
          }
        }}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        sx={{
          width: avatarSize,
          height: avatarSize,
          transition: 'transform 140ms ease, filter 140ms ease, opacity 140ms ease',
          ...(isClickable
            ? {
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.04)',
                  filter: 'brightness(1.06)',
                },
              }
            : {}),
        }}
      >
        {authorLabel(author).charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant={variant} sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>
          {authorLabel(author)} · {formatDate(createdAt)}
        </Typography>
      </Box>
    </Stack>
  );
}
