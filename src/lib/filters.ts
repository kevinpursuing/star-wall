import { classLabel } from "./format";
import { ROOMS } from "./rooms";
import type { AwardLevel, Grade, RoomId, Work } from "./types";

export interface Filters {
  q: string;
  rooms: RoomId[];
  grades: Grade[];
  levels: AwardLevel[];
  tags: string[];
}

export const EMPTY_FILTERS: Filters = { q: "", rooms: [], grades: [], levels: [], tags: [] };

export function isFiltering(f: Filters) {
  return f.q.trim() !== "" || f.rooms.length + f.grades.length + f.levels.length + f.tags.length > 0;
}

function haystack(work: Work) {
  return [
    work.title,
    work.subtitle,
    work.team,
    work.medium,
    work.mentor,
    work.description,
    work.quote,
    work.award?.event,
    work.award?.prize,
    ...work.tags,
    ...work.authors.flatMap((a) => [a.name, classLabel(a), `${a.grade ?? ""}${a.className ?? ""}班`]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matches(work: Work, f: Filters) {
  if (f.rooms.length && !f.rooms.includes(work.room)) return false;
  if (f.grades.length && !work.authors.some((a) => a.grade && f.grades.includes(a.grade))) return false;
  if (f.levels.length && (!work.award || !f.levels.includes(work.award.level))) return false;
  if (f.tags.length && !f.tags.some((t) => work.tags.includes(t))) return false;
  const terms = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length) {
    const text = haystack(work);
    if (!terms.every((t) => text.includes(t))) return false;
  }
  return true;
}

/** Visible works in hanging order: by room, then by their order in the collection. */
export function hangingOrder(works: Work[]) {
  const visible = works.filter((w) => !w.hidden);
  return ROOMS.flatMap((room) => visible.filter((w) => w.room === room.id));
}

export function tagCounts(works: Work[]) {
  const counts = new Map<string, number>();
  for (const w of works) for (const t of w.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh"));
}

/** Human summary of the active conditions, e.g. “「机器人」· 高二 · 省级”. */
export function describeFilters(f: Filters) {
  const parts: string[] = [];
  if (f.q.trim()) parts.push(`「${f.q.trim()}」`);
  if (f.rooms.length) parts.push(f.rooms.map((id) => ROOMS.find((r) => r.id === id)?.name ?? id).join("、"));
  if (f.grades.length) parts.push(f.grades.join("、"));
  if (f.levels.length) parts.push(f.levels.join("、"));
  if (f.tags.length) parts.push(f.tags.map((t) => `#${t}`).join(" "));
  return parts.join(" · ");
}
