import { SearchOff } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        py: 8,
        px: 2,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <SearchOff sx={{ fontSize: 32, color: 'text.secondary' }} />
      <Typography variant="h3">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {description}
      </Typography>
      {action}
    </Box>
  );
}
