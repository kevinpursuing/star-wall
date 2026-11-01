import type { Author, Work } from "./types";

export function classLabel(author: Author) {
  if (!author.grade) return author.className ? `${author.className}班` : "";
  return author.className ? `${author.grade}（${author.className}）班` : author.grade;
}

/** “林小满” / “周以宁 等 3 人” / “青屿辩论队 · 4 人” */
export function authorLine(work: Work) {
  const [lead] = work.authors;
  if (work.team) return `${work.team} · ${work.authors.length} 人`;
  if (work.authors.length === 1) return lead.name;
  return `${lead.name} 等 ${work.authors.length} 人`;
}

export function leadClass(work: Work) {
  return classLabel(work.authors[0]);
}

/** “2026-04” → “2026.04” */
export function dotDate(date: string) {
  return date.replace("-", ".");
}

/** “2026-04” → “2026 年 4 月” */
export function longDate(date: string) {
  if (!date) return "";
  const [y, m] = date.split("-");
  return `${y} 年 ${Number(m)} 月`;
}

export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

const CN_DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** 18 → “十八”, 41 → “四十一” (good enough for counts under 100). */
export function cnNumber(n: number) {
  if (n < 10) return CN_DIGITS[n];
  if (n < 20) return `十${n % 10 ? CN_DIGITS[n % 10] : ""}`;
  if (n < 100) return `${CN_DIGITS[Math.floor(n / 10)]}十${n % 10 ? CN_DIGITS[n % 10] : ""}`;
  return String(n);
}
