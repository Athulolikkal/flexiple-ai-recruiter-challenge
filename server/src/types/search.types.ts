import { RankedCandidate } from './candidate.types';

export interface Filters {
  skills: string[];
  minYearsExperience: number | null;
  maxYearsExperience: number | null;
  location: string | null;
  companyTypes: string[];
}

export interface SearchCriteria {
  filters: Filters;
  rubric: string;
}

export interface ScoredCandidate {
  candidateId: string;
  score: number;
  explanation: string;
}

export interface Change {
  field: string;
  previousValue: string;
  newValue: string;
  reason: string;
}

export interface RefinementResult {
  filters: Filters;
  rubric: string;
  changes: Change[];
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
