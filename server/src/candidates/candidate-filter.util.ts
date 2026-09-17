import { Candidate } from '../types/candidate.types';
import { Filters } from '../types/search.types';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Strips punctuation ("Node.js" -> "nodejs", "CI/CD" -> "cicd") so skill names
 * that differ only by separators still match. Applied on top of `normalize`,
 * only for skill comparison - location/company text keeps its own spacing.
 */
function normalizeSkillToken(value: string): string {
  return normalize(value).replace(/[^a-z0-9]/g, '');
}

/**
 * A candidate's skill list matches a required skill if either string contains
 * the other once normalized. This lets a filter skill of "RDS" match a candidate
 * skill of "AWS RDS", "Postgres" match "PostgreSQL", and "nodejs" match "Node.js",
 * without fuzzy/AI matching.
 */
function hasMatchingSkill(candidateSkills: string[], requiredSkill: string): boolean {
  const required = normalizeSkillToken(requiredSkill);
  return candidateSkills.some((skill) => {
    const owned = normalizeSkillToken(skill);
    return owned.includes(required) || required.includes(owned);
  });
}

/**
 * "Worked at startups" can be satisfied by the candidate's current company or
 * any past company - a candidate currently at an enterprise who spent years at
 * a startup earlier in their career still qualifies.
 */
function matchesCompanyType(candidate: Candidate, requiredTypes: string[]): boolean {
  const required = requiredTypes.map(normalize);
  const owned = [
    normalize(candidate.current_company_type),
    ...candidate.past_companies.map((p) => normalize(p.company_type)),
  ];
  return required.some((type) => owned.includes(type));
}

function matchesLocation(candidate: Candidate, requiredLocation: string): boolean {
  const required = normalize(requiredLocation);
  const owned = normalize(candidate.location);
  return owned.includes(required) || required.includes(owned);
}

/**
 * Deterministic, explainable local filtering. Applied before any LLM call -
 * the LLM never decides who is objectively in or out of the candidate pool.
 */
export function filterCandidates(candidates: Candidate[], filters: Filters): Candidate[] {
  return candidates.filter((candidate) => {
    if (
      filters.minYearsExperience != null &&
      candidate.years_experience < filters.minYearsExperience
    ) {
      return false;
    }

    if (
      filters.maxYearsExperience != null &&
      candidate.years_experience > filters.maxYearsExperience
    ) {
      return false;
    }

    if (filters.location && !matchesLocation(candidate, filters.location)) {
      return false;
    }

    if (filters.companyTypes.length > 0 && !matchesCompanyType(candidate, filters.companyTypes)) {
      return false;
    }

    if (
      filters.skills.length > 0 &&
      !filters.skills.some((skill) => hasMatchingSkill(candidate.skills, skill))
    ) {
      return false;
    }

    return true;
  });
}
