import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../auth/api/authApi';
import type { SocialLink } from '../../social/types';
import ProfileImageEditor from '../../social/components/ProfileImageEditor';
import SocialLinksEditor from '../../social/components/SocialLinksEditor';
import { processProfileImageFile } from '../../social/utils';
import { useAuth } from '../../auth/state/useAuth';
import {
  destructiveButtonSx,
  pageShellSx,
  panelSx,
} from '../../../app/theme/uiStyles';
import { getErrorMessage, getFormErrorMessage } from '../../../shared/lib/feedback';
import InlineNotice from '../../../shared/ui/InlineNotice';
import PageIntro from '../../../shared/ui/PageIntro';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshMe } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [profileImageData, setProfileImageData] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setProfileImageData(user?.profileImageData || '');
    setSocialLinks(
      Array.isArray(user?.socialLinks)
        ? user.socialLinks.map((link) => ({ label: link.label, url: link.url }))
        : []
    );
  }, [user?.displayName, user?.profileImageData, user?.socialLinks]);

  async function handleImageFileChange(file?: File | null) {
    if (!file) return;

    try {
      setError(null);
      const dataUrl = await processProfileImageFile(file);
      setProfileImageData(dataUrl);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load selected image'));
    }
  }

  async function handleSave() {
    if (!user || saving) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.updateMe({
        displayName: displayName.trim(),
        profileImageData: profileImageData.trim(),
        socialLinks: socialLinks
          .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
          .filter((link) => link.label && link.url),
      });
      await refreshMe();
      setSuccess('Profile updated');
    } catch (error: unknown) {
      setError(getFormErrorMessage(error, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProfile() {
    if (!user || deleting) return;

    const confirmed = window.confirm(
      'Delete your account permanently? This cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await authApi.deleteMe();
      try {
        await refreshMe();
      } finally {
        navigate('/auth', { replace: true });
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete profile'));
      setDeleting(false);
    }
  }

  return (
    <Box className="page-wrap page-wrap-narrow" sx={pageShellSx}>
      <Stack spacing={3}>
        <PageIntro title="Profile" description="Update your image and social links." />

        <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
          <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: { xs: 2.25, sm: 3 } } }}>
            <Stack spacing={2}>
              <ProfileImageEditor
                displayName={displayName}
                email={user?.email}
                profileImageData={profileImageData}
                onImageFileChange={(file) => {
                  void handleImageFileChange(file);
                }}
                onRemoveImage={() => setProfileImageData('')}
              />

              <TextField
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
              />

              <TextField label="Email" value={user?.email || ''} fullWidth disabled />

              <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />

              {success && <InlineNotice severity="success">{success}</InlineNotice>}
              {error && <InlineNotice severity="error">{error}</InlineNotice>}

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                useFlexGap
                sx={{ width: '100%' }}
              >
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving || !displayName.trim()}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>

                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => {
                    void handleDeleteProfile();
                  }}
                  disabled={deleting}
                  sx={destructiveButtonSx}
                  fullWidth={false}
                >
                  {deleting ? 'Deleting...' : 'Delete Profile'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
