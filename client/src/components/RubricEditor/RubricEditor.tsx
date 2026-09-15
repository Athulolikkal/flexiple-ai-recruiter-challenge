import { TextField } from '@mui/material';

const MAX_RUBRIC_LENGTH = 2000;

interface RubricEditorProps {
  rubric: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function RubricEditor({ rubric, onChange, disabled }: RubricEditorProps) {
  return (
    <TextField
      fullWidth
      multiline
      minRows={3}
      maxRows={8}
      size="small"
      value={rubric}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value.slice(0, MAX_RUBRIC_LENGTH))}
      helperText={`${rubric.length}/${MAX_RUBRIC_LENGTH}`}
    />
  );
}
