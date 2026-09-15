import { CandidatesService } from '../candidates/candidates.service';
import { UnknownCandidatesException } from '../common/errors/app.exceptions';
import { GeminiService } from '../llm/gemini.service';
import { Candidate } from '../types/candidate.types';
import { Filters } from '../types/search.types';
import { SearchService } from './search.service';

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: 'p01',
    name: 'Ananya Rao',
    current_title: 'Senior Backend Engineer',
    years_experience: 4,
    location: 'Bangalore',
    current_company: 'NimbusPay',
    current_company_type: 'startup',
    skills: ['AWS RDS'],
    past_companies: [],
    education: 'M.Tech CSE',
    summary: 'Summary',
    ...overrides,
  };
}

const emptyFilters: Filters = {
  skills: [],
  minYearsExperience: null,
  maxYearsExperience: null,
  location: null,
  companyTypes: [],
};

describe('SearchService', () => {
  let candidatesService: jest.Mocked<Pick<CandidatesService, 'filter' | 'getByIds'>>;
  let geminiService: jest.Mocked<
    Pick<GeminiService, 'generateSearchCriteria' | 'scoreCandidates' | 'refineSearch'>
  >;
  let service: SearchService;

  beforeEach(() => {
    candidatesService = { filter: jest.fn(), getByIds: jest.fn() };
    geminiService = {
      generateSearchCriteria: jest.fn(),
      scoreCandidates: jest.fn(),
      refineSearch: jest.fn(),
    };
    service = new SearchService(
      candidatesService as unknown as CandidatesService,
      geminiService as unknown as GeminiService,
    );
  });

  describe('search', () => {
    it('sorts scored candidates by score descending and caps the shortlist at 5', async () => {
      const candidates = Array.from({ length: 7 }, (_, i) =>
        makeCandidate({ id: `p0${i}`, name: `Candidate ${i}` }),
      );
      geminiService.generateSearchCriteria.mockResolvedValue({
        filters: emptyFilters,
        rubric: 'rubric',
      });
      candidatesService.filter.mockReturnValue(candidates);
      geminiService.scoreCandidates.mockResolvedValue(
        candidates.map((c, i) => ({ candidateId: c.id, score: i * 10, explanation: 'why' })),
      );

      const result = await service.search('some query');

      expect(result.results).toHaveLength(5);
      expect(result.results[0].id).toBe('p06');
      expect(result.results.map((r) => r.score)).toEqual([60, 50, 40, 30, 20]);
    });

    it('drops candidates the LLM did not return a score for, instead of crashing', async () => {
      const candidates = [makeCandidate({ id: 'p01' }), makeCandidate({ id: 'p02' })];
      geminiService.generateSearchCriteria.mockResolvedValue({
        filters: emptyFilters,
        rubric: 'rubric',
      });
      candidatesService.filter.mockReturnValue(candidates);
      geminiService.scoreCandidates.mockResolvedValue([
        { candidateId: 'p01', score: 70, explanation: 'why' },
      ]);

      const result = await service.search('some query');

      expect(result.results).toHaveLength(1);
      expect(result.results[0].id).toBe('p01');
    });

    it('returns no results when local filtering finds nothing, without calling the scorer', async () => {
      geminiService.generateSearchCriteria.mockResolvedValue({
        filters: emptyFilters,
        rubric: 'rubric',
      });
      candidatesService.filter.mockReturnValue([]);

      const result = await service.search('some query');

      expect(result.results).toEqual([]);
      expect(geminiService.scoreCandidates).not.toHaveBeenCalled();
    });
  });

  describe('refine', () => {
    it('throws when a candidateId does not resolve to a real candidate', async () => {
      candidatesService.getByIds.mockReturnValue([makeCandidate({ id: 'p01' })]);

      await expect(
        service.refine('query', emptyFilters, 'rubric', ['p01', 'ghost'], 'feedback'),
      ).rejects.toBeInstanceOf(UnknownCandidatesException);
      expect(geminiService.refineSearch).not.toHaveBeenCalled();
    });

    it('passes reviewed candidates to the refiner in display order with 1-based positions', async () => {
      const candidates = [
        makeCandidate({ id: 'p02', name: 'Second' }),
        makeCandidate({ id: 'p01', name: 'First' }),
      ];
      candidatesService.getByIds.mockReturnValue(candidates);
      geminiService.refineSearch.mockResolvedValue({
        filters: emptyFilters,
        rubric: 'updated rubric',
        changes: [],
      });
      candidatesService.filter.mockReturnValue([]);

      await service.refine('query', emptyFilters, 'rubric', ['p02', 'p01'], '1 is too junior');

      const reviewed = geminiService.refineSearch.mock.calls[0][3];
      expect(reviewed).toEqual([
        expect.objectContaining({ displayPosition: 1, id: 'p02' }),
        expect.objectContaining({ displayPosition: 2, id: 'p01' }),
      ]);
    });

    it('returns the changes and updated filters/rubric from the refiner', async () => {
      candidatesService.getByIds.mockReturnValue([makeCandidate({ id: 'p01' })]);
      const updatedFilters: Filters = { ...emptyFilters, minYearsExperience: 6 };
      geminiService.refineSearch.mockResolvedValue({
        filters: updatedFilters,
        rubric: 'updated rubric',
        changes: [
          {
            field: 'minYearsExperience',
            previousValue: '4',
            newValue: '6',
            reason: 'Candidate 1 was too junior.',
          },
        ],
      });
      candidatesService.filter.mockReturnValue([]);

      const result = await service.refine('query', emptyFilters, 'rubric', ['p01'], 'too junior');

      expect(result.filters).toEqual(updatedFilters);
      expect(result.rubric).toBe('updated rubric');
      expect(result.changes).toHaveLength(1);
    });
  });
});
