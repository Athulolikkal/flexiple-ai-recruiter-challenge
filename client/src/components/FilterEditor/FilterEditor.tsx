import { Autocomplete, Box, Stack, TextField, Typography } from '@mui/material';
import type { Filters } from '../../types/search';

const COMPANY_TYPE_OPTIONS = ['startup', 'scaleup', 'enterprise', 'agency'];

interface FilterEditorProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  disabled?: boolean;
}

function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function FilterEditor({ filters, onChange, disabled }: FilterEditorProps) {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
          Skills
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={[]}
          value={filters.skills}
          disabled={disabled}
          onChange={(_event, value) => onChange({ ...filters, skills: value as string[] })}
          renderInput={(params) => (
            <TextField {...params} placeholder="Add a skill and press Enter" />
          )}
        />
      </Box>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Min years experience"
          type="number"
          size="small"
          fullWidth
          disabled={disabled}
          value={filters.minYearsExperience ?? ''}
          onChange={(e) =>
            onChange({ ...filters, minYearsExperience: toNumberOrNull(e.target.value) })
          }
          slotProps={{ htmlInput: { min: 0, max: 60 } }}
        />
        <TextField
          label="Max years experience"
          type="number"
          size="small"
          fullWidth
          disabled={disabled}
          value={filters.maxYearsExperience ?? ''}
          onChange={(e) =>
            onChange({ ...filters, maxYearsExperience: toNumberOrNull(e.target.value) })
          }
          slotProps={{ htmlInput: { min: 0, max: 60 } }}
        />
      </Stack>

      <TextField
        label="Location"
        size="small"
        fullWidth
        disabled={disabled}
        value={filters.location ?? ''}
        placeholder="e.g. Bangalore"
        onChange={(e) => onChange({ ...filters, location: e.target.value.trim() || null })}
      />

      <Box>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
          Company background
        </Typography>
        <Autocomplete
          multiple
          size="small"
          options={COMPANY_TYPE_OPTIONS}
          value={filters.companyTypes}
          disabled={disabled}
          onChange={(_event, value) => onChange({ ...filters, companyTypes: value })}
          renderInput={(params) => (
            <TextField {...params} placeholder="startup, scaleup, enterprise, agency" />
          )}
        />
      </Box>
    </Stack>
  );
}
