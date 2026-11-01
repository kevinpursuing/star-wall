"use client";

import { useSyncExternalStore } from "react";

export const CORRIDOR_QUERY = "(min-width: 768px) and (min-height: 540px)";

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
