import type { RankedCandidate } from './candidate';

export interface Filters {
  skills: string[];
  minYearsExperience: number | null;
  maxYearsExperience: number | null;
  location: string | null;
  companyTypes: string[];
}

export interface Change {
  field: string;
  previousValue: string;
  newValue: string;
  reason: string;
}

export interface SearchResponse {
  filters: Filters;
  rubric: string;
  results: RankedCandidate[];
}

export interface RefineResponse {
  filters: Filters;
  rubric: string;
  changes: Change[];
  results: RankedCandidate[];
}

export interface ApiErrorBody {
  code?: string;
  message: string;
}

export type RefinementTurn = {
  feedback: string;
  changes: Change[];
};

export const COMPANY_TYPE_OPTIONS = ['startup', 'scaleup', 'enterprise', 'agency'] as const;
export type CompanyType = (typeof COMPANY_TYPE_OPTIONS)[number];
