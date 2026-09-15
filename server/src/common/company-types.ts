/**
 * Fixed vocabulary for company background/type, matching the values present in
 * data/profiles.json. Shared by request DTO validation and LLM response validation
 * so both trust boundaries enforce the same set.
 */
export const COMPANY_TYPES = ['startup', 'scaleup', 'enterprise', 'agency'] as const;
