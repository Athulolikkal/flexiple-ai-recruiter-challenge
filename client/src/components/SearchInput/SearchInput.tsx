import { Search } from '@mui/icons-material';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { FormEvent } from 'react';

const MAX_QUERY_LENGTH = 500;
const EXAMPLE_QUERY =
  'RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore.';

interface SearchInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
}

export function SearchInput({ onSubmit, disabled }: SearchInputProps) {
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const overLimit = value.length > MAX_QUERY_LENGTH;
  const canSubmit = trimmed.length > 0 && !overLimit && !disabled;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(trimmed);
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <TextField
        fullWidth
        multiline
        minRows={3}
        maxRows={6}
        placeholder={EXAMPLE_QUERY}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        error={overLimit}
        helperText={
          overLimit
            ? `Requirement is too long (${value.length}/${MAX_QUERY_LENGTH} characters).`
            : ' '
        }
        slotProps={{
          htmlInput: { maxLength: MAX_QUERY_LENGTH + 50 },
        }}
        sx={{
          '& .MuiInputBase-root': { fontSize: '1.05rem' },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {value.length}/{MAX_QUERY_LENGTH}
        </Typography>
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<Search />}
          disabled={!canSubmit}
        >
          Find Candidates
        </Button>
      </Box>
    </Box>
  );
}
