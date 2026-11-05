import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../../auth/state/useAuth';
import { panelSx, fullWidthPrimaryButtonSx } from '../../../app/theme/uiStyles';
import { getFormErrorMessage } from '../../../shared/lib/feedback';
import InlineNotice from '../../../shared/ui/InlineNotice';
import PageIntro from '../../../shared/ui/PageIntro';

// auth page
export default function AuthScreen() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth(); // update auth state after login/register

  const [mode, setMode] = useState<'login' | 'register'>('login'); // toggle form

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [submitting, setSubmitting] = useState(false); // disables button
  const [error, setError] = useState<string | null>(null); // error message

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'login') {
        await authApi.login({ email, password });
      } else {
        await authApi.register({
          email,
          password,
          displayName: displayName.trim(),
        });
      }

      // populate auth context from /me
      await refreshMe();

      navigate('/dashboard');
    } catch (error: unknown) {
      setError(getFormErrorMessage(error, 'Auth failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 86px)', sm: 'calc(100vh - 106px)' },
        display: 'grid',
        placeItems: { xs: 'start stretch', sm: 'center' },
        px: { xs: 0, sm: 2 },
        pb: { xs: 4, sm: 6 },
      }}
    >
      <Stack spacing={{ xs: 2.5, sm: 3 }} sx={{ width: '100%', maxWidth: 460, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box
            component="img"
            src="/logo.png"
            alt="TuneTracker logo"
            sx={{
              width: { xs: 72, sm: 88 },
              height: 'auto',
              userSelect: 'none',
              filter: 'drop-shadow(0 4px 14px rgba(33, 216, 255, 0.22))',
            }}
          />
        </Box>

        <PageIntro
          title="TuneTracker"
          description="Project Management for Music Producers"
          centered
        />

        <Card
          elevation={0}
          sx={{
            ...panelSx,
            borderRadius: '24px',
            background:
              'linear-gradient(180deg, rgba(20, 20, 28, 0.96) 0%, rgba(15, 15, 22, 0.98) 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 2.25, sm: 4 } }}>
            <Stack spacing={2.5}>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: 26, sm: 32 },
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                }}
              >
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mt: -0.5,
                }}
              >
                {mode === 'login'
                  ? 'Sign in to keep your sessions and project boards in sync.'
                  : 'Create your account and start tracking ideas, drafts, and mixes.'}
              </Typography>

              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mb: 1,
                    fontWeight: 500,
                  }}
                >
                  Email Address
                </Typography>

                <TextField
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mb: 1,
                    fontWeight: 500,
                  }}
                >
                  Password
                </Typography>

                <TextField
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                />
              </Box>

              {mode === 'register' && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mb: 1,
                      fontWeight: 500,
                    }}
                  >
                    Display Name
                  </Typography>

                  <TextField
                    placeholder="Artist alias"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    fullWidth
                  />
                </Box>
              )}

              {error && (
                <InlineNotice severity="error" sx={{ mt: -0.5 }}>
                  {error}
                </InlineNotice>
              )}

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !email ||
                  !password ||
                  (mode === 'register' && displayName.trim().length < 2)
                }
                sx={fullWidthPrimaryButtonSx}
              >
                {submitting
                  ? 'Working...'
                  : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
              </Button>

              <Box sx={{ textAlign: 'center', pt: 0.5 }}>
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  {mode === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                </Typography>

                <Button
                  variant="text"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  sx={{
                    minHeight: 'auto',
                    p: 0,
                    minWidth: 'auto',
                    fontWeight: 700,
                    verticalAlign: 'baseline',
                  }}
                >
                  {mode === 'login' ? 'Create One' : 'Sign In'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Typography
          sx={{
            textAlign: 'center',
            fontSize: 14,
            color: 'rgba(255,255,255,0.28)',
          }}
        >
          Built for producers, by producers
        </Typography>

      </Stack>
    </Box>
  );
}
