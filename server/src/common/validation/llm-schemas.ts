import { z } from 'zod';
import { COMPANY_TYPES } from '../company-types';

/**
 * Every schema here validates raw JSON returned by Gemini before the application
 * trusts it. Gemini output is treated as untrusted input, same as a client request body.
 */

export const filtersSchema = z.object({
  skills: z.array(z.string().trim().min(1)).max(20).default([]),
  minYearsExperience: z.number().min(0).max(60).nullable().default(null),
  maxYearsExperience: z.number().min(0).max(60).nullable().default(null),
  location: z.string().trim().min(1).max(80).nullable().default(null),
  companyTypes: z
    .array(z.string())
    .max(10)
    .default([])
    .transform((values) =>
      values.filter((value): value is (typeof COMPANY_TYPES)[number] =>
        (COMPANY_TYPES as readonly string[]).includes(value),
      ),
    ),
});

export const searchCriteriaSchema = z.object({
  filters: filtersSchema,
  rubric: z.string().trim().min(1).max(2000),
});

export const scoreCandidatesResponseSchema = z.object({
  scores: z
    .array(
      z.object({
        candidateId: z.string().min(1),
        score: z.number().min(0).max(100),
        explanation: z.string().trim().min(1).max(600),
      }),
    )
    .max(50),
});

export const changeSchema = z.object({
  field: z.string().trim().min(1).max(100),
  // Can hold a full rubric string when the change is to the rubric itself, not just a short filter value.
  previousValue: z.string().trim().max(2000),
  newValue: z.string().trim().max(2000),
  reason: z.string().trim().min(1).max(400),
});

export const refinementResponseSchema = z.object({
  filters: filtersSchema,
  rubric: z.string().trim().min(1).max(2000),
  changes: z.array(changeSchema).max(20),
});

export type FiltersInput = z.infer<typeof filtersSchema>;
export type SearchCriteriaInput = z.infer<typeof searchCriteriaSchema>;
export type ScoreCandidatesResponseInput = z.infer<typeof scoreCandidatesResponseSchema>;
export type RefinementResponseInput = z.infer<typeof refinementResponseSchema>;
