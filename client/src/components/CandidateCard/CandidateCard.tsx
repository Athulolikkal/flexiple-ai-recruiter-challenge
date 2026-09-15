import { ThumbDownOutlined, ThumbUpOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import type { RankedCandidate, Verdict } from '../../types/candidate';

interface CandidateCardProps {
  candidate: RankedCandidate;
  position: number;
  /** Omit both to render the card read-only (e.g. in the frozen summary). */
  verdict?: Verdict | null;
  onVerdictChange?: (verdict: Verdict | null) => void;
  disabled?: boolean;
}

function scoreColor(score: number): 'success' | 'warning' | 'default' {
  if (score >= 70) return 'success';
  if (score >= 45) return 'warning';
  return 'default';
}

export function CandidateCard({
  candidate,
  position,
  verdict = null,
  onVerdictChange,
  disabled,
}: CandidateCardProps) {
  const canMark = Boolean(onVerdictChange);

  function toggle(next: Verdict) {
    if (!onVerdictChange) return;
    onVerdictChange(verdict === next ? null : next);
  }

  return (
    <Card component="article" variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {position}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h3">{candidate.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {candidate.current_title} · {candidate.current_company} (
                {candidate.current_company_type})
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              label={`${Math.round(candidate.score)}/100`}
              color={scoreColor(candidate.score)}
              size="small"
              sx={{ fontWeight: 700 }}
            />
            {canMark && (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Right fit">
                  <span>
                    <IconButton
                      size="small"
                      color={verdict === 'yes' ? 'success' : 'default'}
                      disabled={disabled}
                      aria-pressed={verdict === 'yes'}
                      aria-label={`Mark ${candidate.name} as a right fit`}
                      onClick={() => toggle('yes')}
                    >
                      <ThumbUpOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Not a fit">
                  <span>
                    <IconButton
                      size="small"
                      color={verdict === 'no' ? 'error' : 'default'}
                      disabled={disabled}
                      aria-pressed={verdict === 'no'}
                      aria-label={`Mark ${candidate.name} as not a fit`}
                      onClick={() => toggle('no')}
                    >
                      <ThumbDownOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={3} sx={{ mt: 2, flexWrap: 'wrap' }} useFlexGap>
          <Typography variant="body2" color="text.secondary">
            {candidate.location}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {candidate.years_experience} yrs experience
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
          {candidate.skills.map((skill) => (
            <Chip key={skill} label={skill} size="small" variant="outlined" />
          ))}
        </Stack>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'grey.50',
            borderRadius: 1,
            borderLeft: '3px solid',
            borderColor: 'primary.light',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            WHY THIS CANDIDATE MATCHED
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {candidate.explanation}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
