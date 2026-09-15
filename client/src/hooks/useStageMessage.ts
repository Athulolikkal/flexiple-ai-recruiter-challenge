import { useEffect, useRef, useState } from 'react';
import { STAGE_INTERVAL_MS } from '../utils/loadingStages';

/**
 * Cycles through `stages` on a timer while it is non-null, resetting to the
 * first stage whenever a new (or null) stages array is passed in.
 */
export function useStageMessage(stages: string[] | null): string | null {
  const [index, setIndex] = useState(0);
  const stagesRef = useRef(stages);
  stagesRef.current = stages;

  useEffect(() => {
    setIndex(0);
    if (!stages) {
      return;
    }
    const timer = setInterval(() => {
      setIndex((current) => {
        const active = stagesRef.current;
        if (!active) return current;
        return Math.min(current + 1, active.length - 1);
      });
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [stages]);

  if (!stages) {
    return null;
  }
  return stages[index];
}
