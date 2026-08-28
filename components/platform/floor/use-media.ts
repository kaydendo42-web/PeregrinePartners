"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A media query, read as an external store rather than as state set from an
 * effect.
 *
 * The Floor asks two of these: whether the reader wants motion, and whether
 * the viewport is wide enough for the scene at all. Both were written as
 * `useState` plus an effect that sets it on mount, which is the shape React's
 * compiler flags as cascading renders, and it is right to: the answer exists
 * before the first paint, so subscribing to it is simpler than correcting the
 * first render afterwards.
 *
 * `null` on the server, where there is no viewport to ask. Callers render the
 * neutral thing for that case, which for the stage means nothing at all.
 */
export function useMedia(query: string): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const q = window.matchMedia(query);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => null,
  );
}
