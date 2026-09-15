import { Send } from '@mui/icons-material';
import { Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { RefinementTurn } from '../../hooks/useSearch';
import { ChangeSummary } from '../ChangeSummary/ChangeSummary';

const MAX_FEEDBACK_LENGTH = 1000;
const EXAMPLE_FEEDBACK = 'e.g. "1 is too junior, 2 and 4 are right."';

interface RefinementChatProps {
  history: RefinementTurn[];
  onSubmit: (feedback: string) => void;
  disabled?: boolean;
  /** Plain-language note built from per-candidate Yes/No marks, if any are set. */
  verdictNote?: string;
}

export function RefinementChat({ history, onSubmit, disabled, verdictNote }: RefinementChatProps) {
  const [value, setValue] = useState('');
  const trimmed = value.trim();
  const overLimit = value.length > MAX_FEEDBACK_LENGTH;
  const hasVerdictNote = Boolean(verdictNote);
  const canSubmit = (trimmed.length > 0 || hasVerdictNote) && !overLimit && !disabled;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const combined = [verdictNote, trimmed].filter(Boolean).join(' ');
    onSubmit(combined);
    setValue('');
  }

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Refine this search
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Mark candidates above with the thumbs up/down, or describe what's right or wrong below.
        The AI will update the filters and/or rubric, explain what changed, and re-rank
        candidates.
      </Typography>

      {hasVerdictNote && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {verdictNote}
          </Typography>
        </Box>
      )}

      {history.length > 0 && (
        <Stack spacing={2} sx={{ mb: 3 }}>
          {history.map((turn, index) => (
            <Box key={index}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                YOUR FEEDBACK
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                "{turn.feedback}"
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                WHAT CHANGED
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <ChangeSummary changes={turn.changes} />
              </Box>
              {index < history.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
          <Divider />
        </Stack>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={5}
          placeholder={EXAMPLE_FEEDBACK}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          error={overLimit}
          helperText={overLimit ? `Feedback is too long (${value.length}/${MAX_FEEDBACK_LENGTH}).` : ' '}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" startIcon={<Send />} disabled={!canSubmit}>
            Submit feedback
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
