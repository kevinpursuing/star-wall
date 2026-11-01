import { AWARD_LEVELS, GRADES, ROOMS } from "./rooms";
import { EMPTY_FILTERS, type Filters } from "./filters";
import type { AwardLevel, Grade, RoomId } from "./types";

/**
 * Filters and the open work live in the query string so a curated view can be
 * shared: `/?room=arts&grade=高二&w=xishan-qingyuan`.
 * Next.js keeps `window.history.pushState/replaceState` in sync with its router.
 */

const list = (params: URLSearchParams, key: string) =>
  (params.get(key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function readUrlState(): { filters: Filters; workId: string | null } {
  if (typeof window === "undefined") return { filters: EMPTY_FILTERS, workId: null };
  const params = new URLSearchParams(window.location.search);
  const roomIds = new Set<string>(ROOMS.map((r) => r.id));
  return {
    filters: {
      q: params.get("q") ?? "",
      rooms: list(params, "room").filter((r): r is RoomId => roomIds.has(r)),
      grades: list(params, "grade").filter((g): g is Grade => (GRADES as string[]).includes(g)),
      levels: list(params, "level").filter((l): l is AwardLevel => (AWARD_LEVELS as string[]).includes(l)),
      tags: list(params, "tag"),
    },
    workId: params.get("w"),
  };
}

function buildSearch(filters: Filters, workId: string | null) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.rooms.length) params.set("room", filters.rooms.join(","));
  if (filters.grades.length) params.set("grade", filters.grades.join(","));
  if (filters.levels.length) params.set("level", filters.levels.join(","));
  if (filters.tags.length) params.set("tag", filters.tags.join(","));
  if (workId) params.set("w", workId);
  const search = params.toString();
  return `${window.location.pathname}${search ? `?${search}` : ""}`;
}

export function writeUrlState(filters: Filters, workId: string | null, mode: "push" | "replace" = "replace") {
  const url = buildSearch(filters, workId);
  if (url === `${window.location.pathname}${window.location.search}`) return;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}
