import { Lock, RestartAlt } from '@mui/icons-material';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { useStageMessage } from '../../hooks/useStageMessage';
import { CandidateList } from '../../components/CandidateList/CandidateList';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { FrozenSummary } from '../../components/FrozenSummary/FrozenSummary';
import { LoadingState } from '../../components/LoadingState/LoadingState';
import { RefinementChat } from '../../components/RefinementChat/RefinementChat';
import { SearchCriteria } from '../../components/SearchCriteria/SearchCriteria';
import { SearchInput } from '../../components/SearchInput/SearchInput';
import type { Verdict } from '../../types/candidate';
import { buildVerdictNote } from '../../utils/formatVerdicts';
import { stagesFor } from '../../utils/loadingStages';

export function SearchPage() {
  const { state, runSearch, applyEdits, submitFeedback, retry, freeze, reset } = useSearch();
  const stageMessage = useStageMessage(stagesFor(state.loading));
  const hasCriteria = state.filters !== null && state.rubric !== null;
  const isBusy = state.loading !== null;

  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  useEffect(() => {
    setVerdicts({});
  }, [state.results]);

  function handleVerdictChange(candidateId: string, verdict: Verdict | null) {
    setVerdicts((prev) => {
      if (verdict === null) {
        const next = { ...prev };
        delete next[candidateId];
        return next;
      }
      return { ...prev, [candidateId]: verdict };
    });
  }

  function handleFeedbackSubmit(feedback: string) {
    submitFeedback(feedback);
    setVerdicts({});
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
      >
        <Box>
          <Typography variant="h1">Flexiple AI Recruiter</Typography>
          <Typography variant="subtitle1">
            Describe who you're hiring for in plain English. We'll turn it into search criteria,
            find matches, and refine as you review.
          </Typography>
        </Box>
        {hasCriteria && (
          <Button
            variant="text"
            size="small"
            startIcon={<RestartAlt />}
            onClick={reset}
            disabled={isBusy}
          >
            Start new search
          </Button>
        )}
      </Stack>

      {!hasCriteria && (
        <Box sx={{ mt: 4 }}>
          <SearchInput onSubmit={runSearch} disabled={isBusy} />
          {state.loading === 'search' && stageMessage && (
            <LoadingState message={stageMessage} />
          )}
          {state.error && !isBusy && (
            <Box sx={{ mt: 3 }}>
              <ErrorState message={state.error.message} onRetry={retry} />
            </Box>
          )}
        </Box>
      )}

      {hasCriteria && (
        <Stack spacing={3} sx={{ mt: 4 }}>
          {isBusy && stageMessage && <LoadingState message={stageMessage} />}
          {state.error && !isBusy && (
            <ErrorState message={state.error.message} onRetry={retry} />
          )}

          {state.isFrozen ? (
            <FrozenSummary
              filters={state.filters!}
              rubric={state.rubric!}
              results={state.results}
            />
          ) : (
            <>
              <SearchCriteria
                filters={state.filters!}
                rubric={state.rubric!}
                onApply={applyEdits}
                disabled={isBusy}
              />

              <Box>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
                >
                  <Typography variant="h2">Shortlist</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Lock fontSize="small" />}
                    onClick={freeze}
                    disabled={isBusy || state.results.length === 0}
                  >
                    Freeze search
                  </Button>
                </Stack>

                {state.results.length === 0 && !isBusy ? (
                  <EmptyState
                    title="No matching candidates"
                    description="No one in the dataset matches the current filters. Try broadening the experience range, location, or skills above."
                  />
                ) : (
                  <CandidateList
                    candidates={state.results}
                    verdicts={verdicts}
                    onVerdictChange={handleVerdictChange}
                    disabled={isBusy}
                  />
                )}
              </Box>

              <RefinementChat
                history={state.refinementHistory}
                onSubmit={handleFeedbackSubmit}
                disabled={isBusy || state.results.length === 0}
                verdictNote={buildVerdictNote(state.results, verdicts)}
              />
            </>
          )}
        </Stack>
      )}
    </Container>
  );
}
