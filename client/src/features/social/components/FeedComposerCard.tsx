import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  mutedTextSx,
  panelSx,
  responsiveActionButtonSx,
} from '../../../app/theme/uiStyles';

type FeedComposerCardProps = {
  isSignedIn: boolean;
  content: string;
  creating: boolean;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
};

export default function FeedComposerCard({
  isSignedIn,
  content,
  creating,
  onContentChange,
  onSubmit,
}: FeedComposerCardProps) {
  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: { xs: 2.25, sm: 3 } } }}>
        <Stack spacing={1.5}>
          <TextField
            multiline
            minRows={3}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder={isSignedIn ? 'Write a public post...' : 'Sign in to create posts'}
            disabled={!isSignedIn || creating}
            fullWidth
          />

          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!isSignedIn || creating || !content.trim()}
            sx={responsiveActionButtonSx}
          >
            {creating ? 'Posting...' : 'Create Post'}
          </Button>

          {!isSignedIn && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Typography sx={mutedTextSx}>You can browse posts while signed out.</Typography>
              <Button component={RouterLink} to="/auth" size="small" variant="text">
                Sign In
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
