import { Avatar, Button, Stack } from '@mui/material';

type ProfileImageEditorProps = {
  displayName: string;
  email?: string | null;
  profileImageData: string;
  onImageFileChange: (file?: File | null) => void;
  onRemoveImage: () => void;
};

export default function ProfileImageEditor({
  displayName,
  email,
  profileImageData,
  onImageFileChange,
  onRemoveImage,
}: ProfileImageEditorProps) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
      <Avatar
        src={profileImageData || undefined}
        alt={displayName || email || 'Profile'}
        sx={{ width: 72, height: 72 }}
      >
        {(displayName || email || 'U').charAt(0).toUpperCase()}
      </Avatar>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        <Button
          component="label"
          variant="outlined"
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Upload Image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              onImageFileChange(e.target.files?.[0]);
              e.currentTarget.value = '';
            }}
          />
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={onRemoveImage}
          disabled={!profileImageData}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Remove
        </Button>
      </Stack>
    </Stack>
  );
}
