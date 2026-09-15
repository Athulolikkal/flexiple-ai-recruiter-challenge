import { Candidate } from '../types/candidate.types';
import { Filters } from '../types/search.types';
import { filterCandidates } from './candidate-filter.util';

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'p1',
    name: 'Test Candidate',
    current_title: 'Backend Engineer',
    years_experience: 5,
    location: 'Bangalore',
    current_company: 'NimbusPay',
    current_company_type: 'startup',
    skills: ['PostgreSQL', 'AWS RDS', 'Node.js'],
    past_companies: [{ company: 'Infosys', company_type: 'enterprise', title: 'Engineer', years: 2 }],
    education: 'B.Tech',
    summary: 'Summary',
    ...overrides,
  };
}

function emptyFilters(overrides: Partial<Filters> = {}): Filters {
  return {
    skills: [],
    minYearsExperience: null,
    maxYearsExperience: null,
    location: null,
    companyTypes: [],
    ...overrides,
  };
}

describe('filterCandidates', () => {
  it('returns all candidates when filters are empty', () => {
    const candidates = [makeCandidate({ id: 'p1' }), makeCandidate({ id: 'p2' })];
    expect(filterCandidates(candidates, emptyFilters())).toHaveLength(2);
  });

  it('filters out candidates below minimum years of experience', () => {
    const candidates = [
      makeCandidate({ id: 'junior', years_experience: 2 }),
      makeCandidate({ id: 'senior', years_experience: 6 }),
    ];
    const result = filterCandidates(candidates, emptyFilters({ minYearsExperience: 4 }));
    expect(result.map((c) => c.id)).toEqual(['senior']);
  });

  it('filters out candidates above maximum years of experience', () => {
    const candidates = [
      makeCandidate({ id: 'mid', years_experience: 5 }),
      makeCandidate({ id: 'veteran', years_experience: 13 }),
    ];
    const result = filterCandidates(candidates, emptyFilters({ maxYearsExperience: 7 }));
    expect(result.map((c) => c.id)).toEqual(['mid']);
  });

  it('matches skills case-insensitively and via substring overlap', () => {
    const candidates = [
      makeCandidate({ id: 'match', skills: ['AWS RDS', 'PostgreSQL'] }),
      makeCandidate({ id: 'no-match', skills: ['Kotlin', 'Swift'] }),
    ];
    const result = filterCandidates(candidates, emptyFilters({ skills: ['rds'] }));
    expect(result.map((c) => c.id)).toEqual(['match']);
  });

  it('matches location case-insensitively', () => {
    const candidates = [
      makeCandidate({ id: 'blr', location: 'Bangalore' }),
      makeCandidate({ id: 'del', location: 'Delhi NCR' }),
    ];
    const result = filterCandidates(candidates, emptyFilters({ location: 'bangalore' }));
    expect(result.map((c) => c.id)).toEqual(['blr']);
  });

  it('matches company type against current OR past companies', () => {
    const candidates = [
      makeCandidate({
        id: 'past-startup',
        current_company_type: 'enterprise',
        past_companies: [{ company: 'Acme', company_type: 'startup', title: 'Eng', years: 2 }],
      }),
      makeCandidate({
        id: 'never-startup',
        current_company_type: 'enterprise',
        past_companies: [{ company: 'Acme', company_type: 'agency', title: 'Eng', years: 2 }],
      }),
    ];
    const result = filterCandidates(candidates, emptyFilters({ companyTypes: ['startup'] }));
    expect(result.map((c) => c.id)).toEqual(['past-startup']);
  });

  it('handles a candidate with no past companies without throwing', () => {
    const candidates = [makeCandidate({ id: 'no-history', past_companies: [] })];
    expect(() =>
      filterCandidates(candidates, emptyFilters({ companyTypes: ['startup'] })),
    ).not.toThrow();
  });

  it('returns an empty array when no candidate matches', () => {
    const candidates = [makeCandidate({ years_experience: 1 })];
    const result = filterCandidates(candidates, emptyFilters({ minYearsExperience: 20 }));
    expect(result).toEqual([]);
  });

  it('combines multiple filters with AND semantics', () => {
    const candidates = [
      makeCandidate({
        id: 'fits-all',
        years_experience: 5,
        location: 'Bangalore',
        current_company_type: 'startup',
        skills: ['AWS RDS'],
      }),
      makeCandidate({
        id: 'wrong-location',
        years_experience: 5,
        location: 'Berlin',
        current_company_type: 'startup',
        skills: ['AWS RDS'],
      }),
    ];
    const result = filterCandidates(
      candidates,
      emptyFilters({
        minYearsExperience: 4,
        maxYearsExperience: 7,
        location: 'Bangalore',
        companyTypes: ['startup'],
        skills: ['RDS'],
      }),
    );
    expect(result.map((c) => c.id)).toEqual(['fits-all']);
  });
});
