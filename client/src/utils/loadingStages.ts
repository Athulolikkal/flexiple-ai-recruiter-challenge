/**
 * Rotating status copy shown while a request is in flight. The backend does
 * parsing/filtering/scoring in one round trip (no server-sent progress), so
 * these messages cycle on a timer to honestly describe the pipeline stages
 * happening server-side, rather than showing a single flat "Loading...".
 */
export const SEARCH_STAGES = [
  'Understanding your search...',
  'Filtering the candidate pool...',
  'Evaluating the shortlisted profiles...',
];

export const RERUN_STAGES = ['Applying your changes...', 'Re-evaluating candidates...'];

export const REFINE_STAGES = [
  'Reading your feedback...',
  'Refining the search based on your feedback...',
  'Re-scoring candidates against the updated criteria...',
];

export const STAGE_INTERVAL_MS = 1600;

export type LoadingKind = 'search' | 'rerun' | 'refine' | null;

export function stagesFor(loading: LoadingKind): string[] | null {
  switch (loading) {
    case 'search':
      return SEARCH_STAGES;
    case 'rerun':
      return RERUN_STAGES;
    case 'refine':
      return REFINE_STAGES;
    default:
      return null;
  }
}
