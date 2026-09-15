import type { Filters, RefineResponse, SearchResponse } from '../types/search';

// Search and refine each chain two sequential LLM calls server-side (each capped
// at 45s there), so the client timeout must comfortably exceed that combined worst case.
const REQUEST_TIMEOUT_MS = 100_000;

export class ApiError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(message: string, code: string, retryable: boolean) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The request took too long. Please try again.', 'TIMEOUT', true);
    }
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
      'NETWORK_ERROR',
      true,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body.message === 'string' ? body.message : 'Something went wrong.';
    const code = body && typeof body.code === 'string' ? body.code : 'UNKNOWN_ERROR';
    throw new ApiError(message, code, response.status >= 500 || response.status === 429);
  }

  return response.json() as Promise<TResponse>;
}

export function fetchSearchResults(query: string): Promise<SearchResponse> {
  return postJson<SearchResponse>('/api/search', { query });
}

export function fetchRerunResults(payload: {
  query: string;
  filters: Filters;
  rubric: string;
}): Promise<SearchResponse> {
  return postJson<SearchResponse>('/api/search/score', payload);
}

export function fetchRefinedResults(payload: {
  query: string;
  filters: Filters;
  rubric: string;
  candidateIds: string[];
  feedback: string;
}): Promise<RefineResponse> {
  return postJson<RefineResponse>('/api/search/refine', payload);
}
