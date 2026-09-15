import { Lock } from '@mui/icons-material';
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import type { RankedCandidate } from '../../types/candidate';
import type { Filters } from '../../types/search';
import { formatFilters } from '../../utils/formatFilters';
import { CandidateList } from '../CandidateList/CandidateList';

interface FrozenSummaryProps {
  filters: Filters;
  rubric: string;
  results: RankedCandidate[];
}

export function FrozenSummary({ filters, rubric, results }: FrozenSummaryProps) {
  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Lock />
        <Box>
          <Typography variant="h2" sx={{ color: 'inherit' }}>
            Search frozen
          </Typography>
          <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.85 }}>
            This search is final. Filters, rubric, and shortlist below will no longer change.
          </Typography>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h3" gutterBottom>
          Final filters
        </Typography>
        <Stack spacing={1} sx={{ mb: 3 }}>
          {formatFilters(filters).map((row) => (
            <Stack direction="row" spacing={1} key={row.label}>
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 160 }}>
                {row.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h3" gutterBottom>
          Final fit rubric
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {rubric}
        </Typography>
      </Paper>

      <Box>
        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <Typography variant="h3">Final shortlist</Typography>
          <Chip label={`${results.length} candidates`} size="small" />
        </Stack>
        <CandidateList candidates={results} />
      </Box>
    </Stack>
  );
}
