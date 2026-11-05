import { Avatar, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import type { PublicUserProfile } from '../types';
import InlineNotice from '../../../shared/ui/InlineNotice';

type PublicUserProfileDialogProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  profile: PublicUserProfile | null;
  fallbackDisplayName?: string | null;
  fallbackProfileImageData?: string | null;
  onClose: () => void;
};

export default function PublicUserProfileDialog({
  open,
  loading,
  error,
  profile,
  fallbackDisplayName,
  fallbackProfileImageData,
  onClose,
}: PublicUserProfileDialogProps) {
  const resolvedDisplayName = profile?.displayName || fallbackDisplayName || 'Unknown User';
  const resolvedProfileImageData = profile?.profileImageData || fallbackProfileImageData;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>User Profile</DialogTitle>
      <DialogContent dividers>
        {loading && <InlineNotice loading>Loading profile...</InlineNotice>}
        {!loading && error && <InlineNotice severity="error">{error}</InlineNotice>}

        {open && (
          <Stack spacing={1.2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Avatar
                src={resolvedProfileImageData || undefined}
                alt={resolvedDisplayName}
                sx={{ width: 44, height: 44 }}
              >
                {resolvedDisplayName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {resolvedDisplayName}
              </Typography>
            </Stack>

            {!loading && !error && profile && profile.socialLinks.length === 0 ? (
              <InlineNotice>No links shared.</InlineNotice>
            ) : null}

            {!loading && !error && profile && profile.socialLinks.length > 0 ? (
              <Stack spacing={0.5}>
                {profile.socialLinks.map((link) => (
                  <Button
                    key={link.id || `${link.label}-${link.url}`}
                  component="a"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  variant="text"
                  sx={{ justifyContent: 'flex-start', px: { xs: 1.5, sm: 0 }, width: '100%' }}
                >
                  {link.label}
                </Button>
                ))}
              </Stack>
            ) : null}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
