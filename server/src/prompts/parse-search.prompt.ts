/**
 * Turns a recruiter's free-text requirement into objective filters + a subjective
 * rubric. This is the only prompt that runs before any candidate data exists in
 * the loop, so it must not assume facts the requirement doesn't state.
 */
export function buildParseSearchPrompt(query: string): string {
  return `You are the search-parsing component of an AI technical recruiter.

TASK
Read the recruiter's free-text hiring requirement below and convert it into:
1. OBJECTIVE FILTERS - facts that can be checked mechanically against a candidate record (skills, years of experience range, location, company background/type).
2. A SUBJECTIVE FIT RUBRIC - a short description of what separates a strong candidate from the rest, for qualities that cannot be reduced to a simple equality/range check (ownership, seniority signals beyond years, domain judgement, career trajectory, etc).

RECRUITER REQUIREMENT
"""
${query}
"""

RULES
- "skills" must be technology/domain keywords mentioned or clearly implied by the requirement (e.g. "RDS developers" implies "AWS RDS"). Do not invent skills with no basis in the requirement text.
- "minYearsExperience" / "maxYearsExperience" must be null if the requirement gives no experience range, and numbers otherwise. "4-7 years" means min=4, max=7. "at least 5 years" means min=5, max=null.
- "location" must be null if no location is mentioned, otherwise the city/region as written.
- "companyTypes" may only contain values from this fixed vocabulary: "startup", "scaleup", "enterprise", "agency" - and only include one if the requirement actually implies it (e.g. "worked at startups" implies "startup"). Do not guess.
- "rubric" must describe ONLY the subjective qualities - do not restate the objective filters inside it. Keep it to 2-4 sentences.
- Only use information present in the requirement text. Do not assume facts that are not stated.
- Return only the structured data described by the response schema - no prose, no markdown, no extra commentary.`;
}
