import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Filters } from '../../types/search';
import { FilterEditor } from '../FilterEditor/FilterEditor';
import { RubricEditor } from '../RubricEditor/RubricEditor';

interface SearchCriteriaProps {
  filters: Filters;
  rubric: string;
  onApply: (filters: Filters, rubric: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

function filtersEqual(a: Filters, b: Filters): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Filters and rubric are always visible here, and stay editable throughout
 * the search/refinement loop. Edits are held as a local draft and only sent
 * to the server when the recruiter clicks "Apply changes" - the refinement
 * chat is the other way these fields change, driven by feedback instead.
 */
export function SearchCriteria({
  filters,
  rubric,
  onApply,
  disabled,
  readOnly,
}: SearchCriteriaProps) {
  const [draftFilters, setDraftFilters] = useState(filters);
  const [draftRubric, setDraftRubric] = useState(rubric);

  useEffect(() => {
    setDraftFilters(filters);
    setDraftRubric(rubric);
  }, [filters, rubric]);

  const hasChanges = !filtersEqual(draftFilters, filters) || draftRubric !== rubric;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Objective filters
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Applied deterministically against the candidate dataset. Edit directly if the AI got
            something wrong.
          </Typography>
          <FilterEditor
            filters={draftFilters}
            onChange={setDraftFilters}
            disabled={disabled || readOnly}
          />
        </Box>

        <Box>
          <Typography variant="h3" gutterBottom>
            Subjective fit rubric
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Used by the AI to score and explain each candidate beyond the objective filters.
          </Typography>
          <RubricEditor
            rubric={draftRubric}
            onChange={setDraftRubric}
            disabled={disabled || readOnly}
          />
        </Box>

        {!readOnly && (
          <Box>
            <Button
              variant="outlined"
              disabled={disabled || !hasChanges}
              onClick={() => onApply(draftFilters, draftRubric)}
            >
              Apply changes &amp; re-run
            </Button>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
