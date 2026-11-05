import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getColumnIdFromStatus } from './boardUtils';
import type { Track } from './boardTypes';
import { destructiveTextButtonSx, wrapAnywhereSx } from '../../../../app/theme/uiStyles';

type DraggableTrackCardProps = {
  track: Track;
  onOpen: () => void;
  onDelete: () => void;
};

export default function DraggableTrackCard({
  track,
  onOpen,
  onDelete,
}: DraggableTrackCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: track.id,
      data: {
        type: 'track',
        trackId: track.id,
        currentColumn: getColumnIdFromStatus(track.status),
      },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      elevation={0}
      onClick={onOpen}
      {...listeners}
      {...attributes}
      style={style}
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        borderRadius: '18px',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        position: 'relative',
        zIndex: isDragging ? 2000 : 1,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        background:
          'linear-gradient(180deg, rgba(24, 24, 32, 0.98) 0%, rgba(18, 18, 24, 0.98) 100%)',
        transition:
          'border-color 160ms ease, transform 160ms ease, opacity 160ms ease, box-shadow 160ms ease',
        opacity: isDragging ? 0 : 1,
        boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.45)' : 'none',
        '&:hover': {
          borderColor: 'rgba(140, 154, 255, 0.20)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent
        sx={{
          p: 2,
          '&:last-child': {
            pb: 2,
          },
        }}
      >
        <Stack spacing={1}>
          <Typography
            sx={{
              ...wrapAnywhereSx,
              fontWeight: 700,
              fontSize: { xs: 20, md: 24 },
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {track.title}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.40)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {(track.status || 'DRAFT').toUpperCase()}
          </Typography>

          <Box sx={{ pt: 0.5 }}>
            <Button
              size="small"
              color="error"
              variant="text"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              sx={[destructiveTextButtonSx, { width: { xs: '100%', sm: 'fit-content' } }]}
            >
              Delete
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
