import type { Filters } from '../types/search';

export interface FormattedFilter {
  label: string;
  value: string;
}

export function formatFilters(filters: Filters): FormattedFilter[] {
  const rows: FormattedFilter[] = [];

  if (filters.skills.length > 0) {
    rows.push({ label: 'Skills', value: filters.skills.join(', ') });
  }
  if (filters.minYearsExperience != null || filters.maxYearsExperience != null) {
    const min = filters.minYearsExperience ?? '0';
    const max = filters.maxYearsExperience ?? '∞';
    rows.push({ label: 'Experience', value: `${min}–${max} years` });
  }
  if (filters.location) {
    rows.push({ label: 'Location', value: filters.location });
  }
  if (filters.companyTypes.length > 0) {
    rows.push({ label: 'Company background', value: filters.companyTypes.join(', ') });
  }
  if (rows.length === 0) {
    rows.push({ label: 'Filters', value: 'None - all candidates considered' });
  }

  return rows;
}
