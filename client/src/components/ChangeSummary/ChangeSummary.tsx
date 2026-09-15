import { ArrowRightAlt } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import type { Change } from '../../types/search';

const FIELD_LABELS: Record<string, string> = {
  skills: 'Skills',
  minYearsExperience: 'Minimum experience',
  maxYearsExperience: 'Maximum experience',
  location: 'Location',
  companyTypes: 'Company background',
  rubric: 'Fit rubric',
};

interface ChangeSummaryProps {
  changes: Change[];
}

/**
 * Renders exactly what changed and why - the trust-building explanation the
 * recruiter needs after every refinement. Empty means the feedback didn't
 * warrant any filter/rubric change (still worth saying explicitly).
 */
export function ChangeSummary({ changes }: ChangeSummaryProps) {
  if (changes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        No filters or rubric changes were needed for this feedback.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {changes.map((change, index) => (
        <Box key={`${change.field}-${index}`}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {FIELD_LABELS[change.field] ?? change.field}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {change.previousValue || '(none)'}
            </Typography>
            <ArrowRightAlt fontSize="small" color="disabled" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {change.newValue || '(none)'}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {change.reason}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
