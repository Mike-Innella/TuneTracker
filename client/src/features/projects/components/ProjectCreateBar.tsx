import { Box, Button, Stack, TextField } from '@mui/material';

type ProjectCreateBarProps = {
  title: string;
  creating: boolean;
  onTitleChange: (value: string) => void;
  onCreate: () => void;
};

export default function ProjectCreateBar({
  title,
  creating,
  onTitleChange,
  onCreate,
}: ProjectCreateBarProps) {
  return (
    <Box
      sx={{
        borderRadius: '20px',
        background: 'linear-gradient(90deg, #5f67ff 0%, #8a5dff 100%)',
        boxShadow: '0 14px 30px rgba(102, 87, 255, 0.26)',
        p: { xs: 0.75, sm: 1 },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          alignItems: 'stretch',
        }}
      >
        <TextField
          placeholder="New project title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          fullWidth
          size="small"
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: '14px',
              backgroundColor: 'rgba(10, 10, 14, 0.24)',
              backdropFilter: 'blur(6px)',
            },
          }}
        />

        <Button
          variant="contained"
          onClick={onCreate}
          disabled={creating || !title.trim()}
          sx={{
            minWidth: { xs: '100%', sm: 190 },
            borderRadius: '14px',
            background: 'rgba(8, 8, 12, 0.16)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: 'none',
            '&:hover': {
              background: 'rgba(8, 8, 12, 0.24)',
              boxShadow: 'none',
            },
          }}
        >
          {creating ? 'Creating...' : '+ New Project'}
        </Button>
      </Stack>
    </Box>
  );
}
