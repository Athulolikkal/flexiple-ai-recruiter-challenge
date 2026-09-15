import { ErrorOutlineOutlined } from '@mui/icons-material';
import { Alert, AlertTitle, Button, Stack } from '@mui/material';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      icon={<ErrorOutlineOutlined />}
      sx={{ alignItems: 'center' }}
      action={
        onRetry ? (
          <Button color="error" size="small" variant="outlined" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    >
      <Stack spacing={0.5}>
        <AlertTitle sx={{ mb: 0 }}>{title}</AlertTitle>
        {message}
      </Stack>
    </Alert>
  );
}
