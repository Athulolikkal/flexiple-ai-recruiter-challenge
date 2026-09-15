import { GoogleGenerativeAI, Schema } from '@google/generative-ai';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmInvalidResponseException,
  LlmRateLimitException,
  LlmTimeoutException,
  LlmUnavailableException,
} from '../common/errors/app.exceptions';
import {
  refinementResponseSchema,
  scoreCandidatesResponseSchema,
  searchCriteriaSchema,
} from '../common/validation/llm-schemas';
import { buildParseSearchPrompt } from '../prompts/parse-search.prompt';
import { buildRefineSearchPrompt, ReviewedCandidateInput } from '../prompts/refine-search.prompt';
import { buildScoreCandidatesPrompt, ScoringCandidateInput } from '../prompts/score-candidates.prompt';
import { Candidate } from '../types/candidate.types';
import { Filters, RefinementResult, ScoredCandidate, SearchCriteria } from '../types/search.types';
import { REFINEMENT_SCHEMA, SCORE_CANDIDATES_SCHEMA, SEARCH_CRITERIA_SCHEMA } from './gemini.schemas';

const REQUEST_TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 1_000;

/**
 * The only part of the app that talks to Gemini. Every method: builds a
 * prompt, requests JSON constrained to a fixed schema, parses it, and
 * re-validates it with Zod - never trusting the model's output as-is.
 */
@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private client!: GoogleGenerativeAI;
  private modelName!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not set. Copy server/.env.example to server/.env and add your key.',
      );
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-flash-latest';
  }

  async generateSearchCriteria(query: string): Promise<SearchCriteria> {
    const prompt = buildParseSearchPrompt(query);
    const raw = await this.generateJson(prompt, SEARCH_CRITERIA_SCHEMA);
    const parsed = searchCriteriaSchema.safeParse(raw);
    if (!parsed.success) {
      this.logger.warn(`Invalid search criteria response: ${parsed.error.message}`);
      throw new LlmInvalidResponseException();
    }
    return parsed.data;
  }

  async scoreCandidates(
    query: string,
    rubric: string,
    candidates: Candidate[],
  ): Promise<ScoredCandidate[]> {
    if (candidates.length === 0) {
      return [];
    }

    const inputs: ScoringCandidateInput[] = candidates.map((c) => ({
      id: c.id,
      current_title: c.current_title,
      years_experience: c.years_experience,
      location: c.location,
      current_company: c.current_company,
      current_company_type: c.current_company_type,
      skills: c.skills,
      past_companies: c.past_companies,
      education: c.education,
      summary: c.summary,
    }));

    const prompt = buildScoreCandidatesPrompt(query, rubric, inputs);
    const raw = await this.generateJson(prompt, SCORE_CANDIDATES_SCHEMA);
    const parsed = scoreCandidatesResponseSchema.safeParse(raw);
    if (!parsed.success) {
      this.logger.warn(`Invalid scoring response: ${parsed.error.message}`);
      throw new LlmInvalidResponseException();
    }

    const validIds = new Set(candidates.map((c) => c.id));
    return parsed.data.scores.filter((score) => validIds.has(score.candidateId));
  }

  async refineSearch(
    query: string,
    filters: Filters,
    rubric: string,
    reviewedCandidates: ReviewedCandidateInput[],
    feedback: string,
  ): Promise<RefinementResult> {
    const prompt = buildRefineSearchPrompt(query, filters, rubric, reviewedCandidates, feedback);
    const raw = await this.generateJson(prompt, REFINEMENT_SCHEMA);
    const parsed = refinementResponseSchema.safeParse(raw);
    if (!parsed.success) {
      this.logger.warn(`Invalid refinement response: ${parsed.error.message}`);
      throw new LlmInvalidResponseException();
    }
    return parsed.data;
  }

  private async generateJson(prompt: string, responseSchema: Schema): Promise<unknown> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const call = () =>
      this.withTimeout(
        model
          .generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema,
              temperature: 0.2,
            },
          })
          .then((result) => result.response.text()),
      );

    const text = await this.callWithRetry(call);

    try {
      return JSON.parse(text);
    } catch {
      this.logger.warn(`Gemini returned non-JSON output: ${text.slice(0, 300)}`);
      throw new LlmInvalidResponseException();
    }
  }

  /**
   * Gemini occasionally returns a transient 503 ("high demand") or 429 (rate
   * limit) that resolves within seconds. Retrying a couple of times with a
   * short backoff avoids surfacing those as hard failures to the recruiter.
   */
  private async callWithRetry<T>(attempt: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attemptNumber = 1; attemptNumber <= MAX_ATTEMPTS; attemptNumber++) {
      try {
        return await attempt();
      } catch (error) {
        lastError = error;
        if (!this.isRetryable(error) || attemptNumber === MAX_ATTEMPTS) {
          throw this.mapError(error);
        }
        const status = (error as { status?: number } | null)?.status;
        this.logger.warn(
          `Gemini request failed${status ? ` (status ${status})` : ''}, retrying (attempt ${attemptNumber + 1}/${MAX_ATTEMPTS})`,
        );
        await this.delay(RETRY_BACKOFF_MS * attemptNumber);
      }
    }

    throw this.mapError(lastError);
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof LlmTimeoutException) {
      return false;
    }
    const status = (error as { status?: number } | null)?.status;
    return status === 503 || status === 429;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new LlmTimeoutException()), REQUEST_TIMEOUT_MS);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  }

  private mapError(error: unknown): Error {
    if (error instanceof LlmTimeoutException) {
      return error;
    }

    const status = (error as { status?: number } | null)?.status;
    this.logger.error(
      `Gemini request failed${status ? ` (status ${status})` : ''}`,
      error instanceof Error ? error.stack : String(error),
    );

    if (status === 429) {
      return new LlmRateLimitException();
    }
    return new LlmUnavailableException();
  }
}
