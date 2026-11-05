import { Box } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type { ColumnId } from './boardTypes';

type DroppableColumnProps = {
  id: ColumnId;
  children: ReactNode;
};

export default function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: '100%',
        borderRadius: '24px',
        outline: isOver
          ? '1px solid rgba(111, 99, 255, 0.35)'
          : '1px solid transparent',
        transition: 'outline-color 160ms ease',
      }}
    >
      {children}
    </Box>
  );
}
