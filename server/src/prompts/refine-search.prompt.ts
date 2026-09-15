import { Filters } from '../types/search.types';

export interface ReviewedCandidateInput {
  displayPosition: number;
  id: string;
  name: string;
  current_title: string;
  years_experience: number;
  location: string;
  current_company: string;
  current_company_type: string;
  skills: string[];
}

/**
 * Turns recruiter feedback on the currently displayed shortlist into an updated
 * filters/rubric pair, plus an explicit, auditable list of what changed and why.
 * The "changes" array is what lets the UI say *why* something changed, not just *that* it did.
 */
export function buildRefineSearchPrompt(
  query: string,
  filters: Filters,
  rubric: string,
  candidates: ReviewedCandidateInput[],
  feedback: string,
): string {
  return `You are the search-refinement component of an AI technical recruiter.

ORIGINAL REQUIREMENT
"""
${query}
"""

CURRENT OBJECTIVE FILTERS
${JSON.stringify(filters)}

CURRENT SUBJECTIVE FIT RUBRIC
"""
${rubric}
"""

CANDIDATES THE RECRUITER JUST REVIEWED, IN THE ORDER SHOWN (displayPosition is the 1-based rank the recruiter saw; use it to resolve references like "candidate 1" or "the second one". Scores from the last pass are not repeated here - use these facts directly.)
${JSON.stringify(candidates)}

RECRUITER FEEDBACK
"""
${feedback}
"""

TASK
Interpret the recruiter's feedback and propose an updated set of objective filters and/or subjective rubric that will produce a better shortlist on the next run.

RULES
- Only change a field if the feedback actually implies a change to it. Copy every other field through unchanged from the current filters/rubric shown above.
- "skills" / "minYearsExperience" / "maxYearsExperience" / "location" / "companyTypes" follow the same semantics as before: null/empty means "no constraint". Never invent a constraint the feedback does not support.
- "companyTypes" may only contain values from this fixed vocabulary: "startup", "scaleup", "enterprise", "agency".
- For every field you change, add one entry to "changes" with the exact previous value, the exact new value, and a one-sentence reason that names the specific recruiter feedback or candidate that drove it (e.g. "Raised minYearsExperience from 4 to 6 because candidate 1 (4 years experience) was marked too junior.").
- If a field is unchanged, do not add a "changes" entry for it.
- Resolve any ordinal or positional reference ("1", "the first one", "candidate 2") against the displayPosition values above, then use the candidate's real facts (not just their score/explanation) to justify the change.
- Do not invent facts about any candidate beyond what is given above.
- Return only the structured data described by the response schema - no prose, no markdown, no extra commentary.`;
}
