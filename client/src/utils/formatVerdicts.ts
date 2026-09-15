import type { RankedCandidate, Verdict } from '../types/candidate';

/**
 * Turns per-candidate Yes/No marks into a plain-language note the refine
 * prompt can interpret the same way as typed feedback (e.g. "1 is too junior").
 * Position-based so it resolves the same way the recruiter saw the shortlist.
 */
export function buildVerdictNote(
  candidates: RankedCandidate[],
  verdicts: Record<string, Verdict>,
): string {
  const notes = candidates
    .map((candidate, index) => {
      const verdict = verdicts[candidate.id];
      if (!verdict) return null;
      const label = verdict === 'yes' ? 'a right fit' : 'not a fit';
      return `Candidate ${index + 1} (${candidate.name}) is marked as ${label}.`;
    })
    .filter((note): note is string => note !== null);

  return notes.join(' ');
}

export function countVerdicts(verdicts: Record<string, Verdict>): { yes: number; no: number } {
  const values = Object.values(verdicts);
  return {
    yes: values.filter((v) => v === 'yes').length,
    no: values.filter((v) => v === 'no').length,
  };
}
