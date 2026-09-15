import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RefineRequestDto } from './refine-request.dto';

function validPayload() {
  return {
    query: 'RDS developers with 4-7 years of experience',
    filters: {
      skills: ['AWS RDS'],
      minYearsExperience: 4,
      maxYearsExperience: 7,
      location: 'Bangalore',
      companyTypes: ['startup'],
    },
    rubric: 'Prioritize production ownership.',
    candidateIds: ['p01', 'p02'],
    feedback: '1 is too junior, 2 is right',
  };
}

async function validateDto(payload: unknown) {
  const dto = plainToInstance(RefineRequestDto, payload);
  return validate(dto);
}

describe('RefineRequestDto', () => {
  it('accepts a well-formed request', async () => {
    const errors = await validateDto(validPayload());
    expect(errors).toHaveLength(0);
  });

  it('rejects an empty feedback string', async () => {
    const errors = await validateDto({ ...validPayload(), feedback: '' });
    expect(errors.some((e) => e.property === 'feedback')).toBe(true);
  });

  it('rejects feedback longer than 1000 characters', async () => {
    const errors = await validateDto({ ...validPayload(), feedback: 'a'.repeat(1001) });
    expect(errors.some((e) => e.property === 'feedback')).toBe(true);
  });

  it('rejects a companyTypes value outside the fixed vocabulary', async () => {
    const payload = validPayload();
    payload.filters.companyTypes = ['unicorn'];
    const errors = await validateDto(payload);
    expect(errors.some((e) => e.property === 'filters')).toBe(true);
  });

  it('rejects a missing candidateIds array', async () => {
    const payload: Record<string, unknown> = validPayload();
    delete payload.candidateIds;
    const errors = await validateDto(payload);
    expect(errors.some((e) => e.property === 'candidateIds')).toBe(true);
  });

  it('rejects a query longer than 500 characters', async () => {
    const errors = await validateDto({ ...validPayload(), query: 'a'.repeat(501) });
    expect(errors.some((e) => e.property === 'query')).toBe(true);
  });
});
