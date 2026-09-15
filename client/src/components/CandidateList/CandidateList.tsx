import { Stack } from '@mui/material';
import type { RankedCandidate, Verdict } from '../../types/candidate';
import { CandidateCard } from '../CandidateCard/CandidateCard';

interface CandidateListProps {
  candidates: RankedCandidate[];
  /** Omit both to render every card read-only (e.g. in the frozen summary). */
  verdicts?: Record<string, Verdict>;
  onVerdictChange?: (candidateId: string, verdict: Verdict | null) => void;
  disabled?: boolean;
}

export function CandidateList({ candidates, verdicts, onVerdictChange, disabled }: CandidateListProps) {
  return (
    <Stack spacing={2}>
      {candidates.map((candidate, index) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          position={index + 1}
          verdict={verdicts?.[candidate.id] ?? null}
          onVerdictChange={
            onVerdictChange ? (verdict) => onVerdictChange(candidate.id, verdict) : undefined
          }
          disabled={disabled}
        />
      ))}
    </Stack>
  );
}
