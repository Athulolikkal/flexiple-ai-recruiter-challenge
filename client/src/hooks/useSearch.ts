import { useCallback, useState } from 'react';
import { fetchRefinedResults, fetchRerunResults, fetchSearchResults } from '../services/api';
import type { ApiError } from '../services/api';
import type { RankedCandidate } from '../types/candidate';
import type { Change, Filters } from '../types/search';
import type { LoadingKind } from '../utils/loadingStages';

export interface RefinementTurn {
  feedback: string;
  changes: Change[];
}

export interface SearchState {
  query: string;
  filters: Filters | null;
  rubric: string | null;
  results: RankedCandidate[];
  refinementHistory: RefinementTurn[];
  loading: LoadingKind;
  error: ApiError | null;
  isFrozen: boolean;
}

type LastRequest =
  | { type: 'search'; query: string }
  | { type: 'rerun'; filters: Filters; rubric: string }
  | { type: 'refine'; feedback: string };

const initialState: SearchState = {
  query: '',
  filters: null,
  rubric: null,
  results: [],
  refinementHistory: [],
  loading: null,
  error: null,
  isFrozen: false,
};

export function useSearch() {
  const [state, setState] = useState<SearchState>(initialState);
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null);

  const runSearch = useCallback(async (query: string) => {
    setLastRequest({ type: 'search', query });
    setState((s) => ({ ...s, query, loading: 'search', error: null }));
    try {
      const response = await fetchSearchResults(query);
      setState((s) => ({
        ...s,
        filters: response.filters,
        rubric: response.rubric,
        results: response.results,
        refinementHistory: [],
        loading: null,
        error: null,
        isFrozen: false,
      }));
    } catch (error) {
      setState((s) => ({ ...s, loading: null, error: error as ApiError }));
    }
  }, []);

  const applyEdits = useCallback(
    async (filters: Filters, rubric: string) => {
      setLastRequest({ type: 'rerun', filters, rubric });
      setState((s) => ({ ...s, filters, rubric, loading: 'rerun', error: null }));
      try {
        const response = await fetchRerunResults({ query: state.query, filters, rubric });
        setState((s) => ({
          ...s,
          filters: response.filters,
          rubric: response.rubric,
          results: response.results,
          loading: null,
          error: null,
        }));
      } catch (error) {
        setState((s) => ({ ...s, loading: null, error: error as ApiError }));
      }
    },
    [state.query],
  );

  const submitFeedback = useCallback(
    async (feedback: string) => {
      if (!state.filters || !state.rubric) {
        return;
      }
      const candidateIds = state.results.map((r) => r.id);
      setLastRequest({ type: 'refine', feedback });
      setState((s) => ({ ...s, loading: 'refine', error: null }));
      try {
        const response = await fetchRefinedResults({
          query: state.query,
          filters: state.filters,
          rubric: state.rubric,
          candidateIds,
          feedback,
        });
        setState((s) => ({
          ...s,
          filters: response.filters,
          rubric: response.rubric,
          results: response.results,
          refinementHistory: [...s.refinementHistory, { feedback, changes: response.changes }],
          loading: null,
          error: null,
        }));
      } catch (error) {
        setState((s) => ({ ...s, loading: null, error: error as ApiError }));
      }
    },
    [state.filters, state.rubric, state.results, state.query],
  );

  const retry = useCallback(() => {
    if (!lastRequest) return;
    if (lastRequest.type === 'search') void runSearch(lastRequest.query);
    if (lastRequest.type === 'rerun') void applyEdits(lastRequest.filters, lastRequest.rubric);
    if (lastRequest.type === 'refine') void submitFeedback(lastRequest.feedback);
  }, [lastRequest, runSearch, applyEdits, submitFeedback]);

  const freeze = useCallback(() => {
    setState((s) => ({ ...s, isFrozen: true }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    setLastRequest(null);
  }, []);

  return {
    state,
    runSearch,
    applyEdits,
    submitFeedback,
    retry,
    freeze,
    reset,
  };
}
