import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { Candidate } from '../types/candidate.types';
import { Filters } from '../types/search.types';
import { filterCandidates } from './candidate-filter.util';

const pastCompanySchema = z.object({
  company: z.string(),
  company_type: z.string(),
  title: z.string(),
  years: z.number(),
});

const candidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_title: z.string(),
  years_experience: z.number(),
  location: z.string(),
  current_company: z.string(),
  current_company_type: z.string(),
  skills: z.array(z.string()),
  past_companies: z.array(pastCompanySchema),
  education: z.string(),
  summary: z.string(),
});

const candidatesFileSchema = z.array(candidateSchema);

/**
 * Loads the local candidate dataset once at startup and serves it read-only.
 * This is the single source of truth for candidate facts - the LLM never
 * supplies or overrides candidate data, it only scores what this service hands it.
 */
@Injectable()
export class CandidatesService implements OnModuleInit {
  private readonly logger = new Logger(CandidatesService.name);
  private candidates: Candidate[] = [];

  onModuleInit(): void {
    const filePath = join(process.cwd(), 'data', 'profiles.json');
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = candidatesFileSchema.parse(JSON.parse(raw));
    this.candidates = parsed;
    this.logger.log(`Loaded ${this.candidates.length} candidate profiles`);
  }

  getAll(): Candidate[] {
    return this.candidates;
  }

  filter(filters: Filters): Candidate[] {
    return filterCandidates(this.candidates, filters);
  }

  /** Preserves the order of `ids`; ids with no matching candidate are silently skipped. */
  getByIds(ids: string[]): Candidate[] {
    const byId = new Map(this.candidates.map((c) => [c.id, c]));
    return ids.map((id) => byId.get(id)).filter((c): c is Candidate => c !== undefined);
  }
}
