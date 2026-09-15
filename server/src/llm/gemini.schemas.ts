import { Schema, SchemaType } from '@google/generative-ai';
import { COMPANY_TYPES } from '../common/company-types';

/**
 * Gemini response schemas (Google's structured-output format, distinct from
 * the Zod schemas in common/validation). Every LLM call in this app is
 * constrained to one of these shapes, then re-validated with Zod before use.
 */
const FILTERS_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    minYearsExperience: { type: SchemaType.NUMBER, nullable: true },
    maxYearsExperience: { type: SchemaType.NUMBER, nullable: true },
    location: { type: SchemaType.STRING, nullable: true },
    companyTypes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, format: 'enum', enum: [...COMPANY_TYPES] },
    },
  },
  required: ['skills', 'minYearsExperience', 'maxYearsExperience', 'location', 'companyTypes'],
};

export const SEARCH_CRITERIA_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    filters: FILTERS_SCHEMA,
    rubric: { type: SchemaType.STRING },
  },
  required: ['filters', 'rubric'],
};

export const SCORE_CANDIDATES_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    scores: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          candidateId: { type: SchemaType.STRING },
          score: { type: SchemaType.NUMBER },
          explanation: { type: SchemaType.STRING },
        },
        required: ['candidateId', 'score', 'explanation'],
      },
    },
  },
  required: ['scores'],
};

export const REFINEMENT_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    filters: FILTERS_SCHEMA,
    rubric: { type: SchemaType.STRING },
    changes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          field: { type: SchemaType.STRING },
          previousValue: { type: SchemaType.STRING },
          newValue: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ['field', 'previousValue', 'newValue', 'reason'],
      },
    },
  },
  required: ['filters', 'rubric', 'changes'],
};
