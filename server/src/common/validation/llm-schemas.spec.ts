import {
  refinementResponseSchema,
  scoreCandidatesResponseSchema,
  searchCriteriaSchema,
} from './llm-schemas';

describe('searchCriteriaSchema', () => {
  it('accepts a well-formed response and defaults optional filter fields', () => {
    const result = searchCriteriaSchema.safeParse({
      filters: { skills: ['AWS RDS'], minYearsExperience: 4, maxYearsExperience: 7 },
      rubric: 'Prioritize startup ownership.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filters.location).toBeNull();
      expect(result.data.filters.companyTypes).toEqual([]);
    }
  });

  it('rejects a response missing the rubric', () => {
    const result = searchCriteriaSchema.safeParse({
      filters: { skills: [], minYearsExperience: null, maxYearsExperience: null },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a response where minYearsExperience is not a number', () => {
    const result = searchCriteriaSchema.safeParse({
      filters: {
        skills: [],
        minYearsExperience: '4',
        maxYearsExperience: null,
        location: null,
        companyTypes: [],
      },
      rubric: 'Some rubric',
    });
    expect(result.success).toBe(false);
  });
});

describe('scoreCandidatesResponseSchema', () => {
  it('accepts a well-formed list of scores', () => {
    const result = scoreCandidatesResponseSchema.safeParse({
      scores: [{ candidateId: 'p01', score: 82, explanation: 'Has 6 years experience.' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a score outside the 0-100 range', () => {
    const result = scoreCandidatesResponseSchema.safeParse({
      scores: [{ candidateId: 'p01', score: 140, explanation: 'Too high.' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an entry missing an explanation', () => {
    const result = scoreCandidatesResponseSchema.safeParse({
      scores: [{ candidateId: 'p01', score: 50 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('refinementResponseSchema', () => {
  it('accepts a response with a populated changes array', () => {
    const result = refinementResponseSchema.safeParse({
      filters: {
        skills: ['AWS RDS'],
        minYearsExperience: 6,
        maxYearsExperience: null,
        location: 'Bangalore',
        companyTypes: ['startup'],
      },
      rubric: 'Prioritize production ownership.',
      changes: [
        {
          field: 'minYearsExperience',
          previousValue: '4',
          newValue: '6',
          reason: 'Candidate 1 (4 years) was marked too junior.',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a change entry missing a reason', () => {
    const result = refinementResponseSchema.safeParse({
      filters: {
        skills: [],
        minYearsExperience: null,
        maxYearsExperience: null,
        location: null,
        companyTypes: [],
      },
      rubric: 'Rubric text',
      changes: [{ field: 'minYearsExperience', previousValue: '4', newValue: '6' }],
    });
    expect(result.success).toBe(false);
  });
});
