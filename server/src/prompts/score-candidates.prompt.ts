export interface ScoringCandidateInput {
  id: string;
  current_title: string;
  years_experience: number;
  location: string;
  current_company: string;
  current_company_type: string;
  skills: string[];
  past_companies: { company: string; company_type: string; title: string; years: number }[];
  education: string;
  summary: string;
}

/**
 * Scores an already objectively-filtered candidate pool against the subjective
 * rubric. The prompt repeatedly stresses "only the facts given" because this is
 * the step most prone to the model inventing flattering details.
 */
export function buildScoreCandidatesPrompt(
  query: string,
  rubric: string,
  candidates: ScoringCandidateInput[],
): string {
  return `You are the candidate-scoring component of an AI technical recruiter.

ORIGINAL REQUIREMENT
"""
${query}
"""

SUBJECTIVE FIT RUBRIC
This candidate pool has already passed the objective filters (skills/experience/location/company type). Use this rubric only to judge quality beyond that baseline.
"""
${rubric}
"""

CANDIDATES
This is the ONLY source of truth about these people. Do not invent, assume, guess, or embellish any fact that is not present below.
${JSON.stringify(candidates)}

TASK
Score every candidate above from 0 to 100 against the fit rubric, and give a one-to-two sentence explanation for each score.

RULES
- Every explanation MUST cite only facts that appear verbatim in that candidate's data above (years_experience, location, current_company, current_company_type, skills, past_companies, education, summary).
- Never state a fact about a candidate that is not present in their data. Never invent years of experience, employers, or skills.
- Do not use ungrounded generic praise such as "excellent candidate" or "great technical skills". Every claim must be traceable to a specific field you were given.
- A higher score should reflect closer alignment with the rubric and the requirement, not just seniority.
- Return exactly one entry per candidate, using the candidate's "id" field verbatim as "candidateId".
- Return only the structured data described by the response schema - no prose, no markdown, no extra commentary.`;
}
