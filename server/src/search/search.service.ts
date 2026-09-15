import { Injectable } from '@nestjs/common';
import { CandidatesService } from '../candidates/candidates.service';
import { UnknownCandidatesException } from '../common/errors/app.exceptions';
import { GeminiService } from '../llm/gemini.service';
import { ReviewedCandidateInput } from '../prompts/refine-search.prompt';
import { Candidate, RankedCandidate } from '../types/candidate.types';
import { Filters, RefineResponse, SearchResponse } from '../types/search.types';

const SHORTLIST_SIZE = 5;

@Injectable()
export class SearchService {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly geminiService: GeminiService,
  ) {}

  async search(query: string): Promise<SearchResponse> {
    const criteria = await this.geminiService.generateSearchCriteria(query);
    const filtered = this.candidatesService.filter(criteria.filters);
    const results = await this.rankAndTrim(query, criteria.rubric, filtered);

    return {
      filters: criteria.filters,
      rubric: criteria.rubric,
      results,
    };
  }

  /**
   * Re-runs local filtering + LLM scoring against filters/rubric the recruiter
   * edited directly in the UI, skipping the feedback-interpretation step since
   * there is no feedback to interpret - the recruiter's edit is already final.
   */
  async rerun(query: string, filters: Filters, rubric: string): Promise<SearchResponse> {
    const filtered = this.candidatesService.filter(filters);
    const results = await this.rankAndTrim(query, rubric, filtered);
    return { filters, rubric, results };
  }

  async refine(
    query: string,
    filters: Filters,
    rubric: string,
    candidateIds: string[],
    feedback: string,
  ): Promise<RefineResponse> {
    const reviewedCandidates = this.candidatesService.getByIds(candidateIds);
    if (reviewedCandidates.length !== candidateIds.length) {
      throw new UnknownCandidatesException();
    }

    const reviewedInputs: ReviewedCandidateInput[] = reviewedCandidates.map((c, index) => ({
      displayPosition: index + 1,
      id: c.id,
      name: c.name,
      current_title: c.current_title,
      years_experience: c.years_experience,
      location: c.location,
      current_company: c.current_company,
      current_company_type: c.current_company_type,
      skills: c.skills,
    }));

    const refinement = await this.geminiService.refineSearch(
      query,
      filters,
      rubric,
      reviewedInputs,
      feedback,
    );

    const filtered = this.candidatesService.filter(refinement.filters);
    const results = await this.rankAndTrim(query, refinement.rubric, filtered);

    return {
      filters: refinement.filters,
      rubric: refinement.rubric,
      changes: refinement.changes,
      results,
    };
  }

  private async rankAndTrim(
    query: string,
    rubric: string,
    candidates: Candidate[],
  ): Promise<RankedCandidate[]> {
    if (candidates.length === 0) {
      return [];
    }

    const scores = await this.geminiService.scoreCandidates(query, rubric, candidates);
    const scoreById = new Map(scores.map((s) => [s.candidateId, s]));

    return candidates
      .filter((c) => scoreById.has(c.id))
      .map((c) => {
        const score = scoreById.get(c.id)!;
        return { ...c, score: score.score, explanation: score.explanation };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, SHORTLIST_SIZE);
  }
}
