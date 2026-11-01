import { AWARD_LEVELS, FRAME_OPTIONS, GRADES, ROOMS, SIZE_OPTIONS } from "./rooms";
import { hashString } from "./random";
import type { Artwork, Author, Award, AwardLevel, FrameKind, Grade, HangSize, RoomId, Work } from "./types";

/**
 * Turns loosely-shaped records from an external source into gallery `Work`s.
 * The canonical shape is the `Work` type itself; on top of that we accept a few
 * shorthands that school systems commonly produce (see README → 数据源).
 */

type Loose = Record<string, unknown>;

const ROOM_IDS = new Set<string>(ROOMS.map((r) => r.id));
const FRAME_KINDS = new Set<string>(FRAME_OPTIONS.map((f) => f.value));
const SIZES = new Set<string>(SIZE_OPTIONS.map((s) => s.value));
const GRADE_SET = new Set<string>(GRADES);
const LEVELS = new Set<string>(AWARD_LEVELS);

export const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : undefined;
};

// ── Rooms, mounts and sizes are inferred when the source doesn't say ──────────

const ROOM_HINTS: [RoomId, RegExp][] = [
  ["sports", /体育|运动|田径|长跑|短跑|球|游泳|棋|武术|跳绳|健美操|竞走/],
  ["practice", /实践|志愿|公益|社区|社会|调研|调查|劳动|研学|口述|服务/],
  ["letters", /文学|写作|作文|征文|诗|散文|小说|阅读|辩论|演讲|朗诵|英语|语文/],
  ["arts", /艺术|美术|绘画|画|书法|音乐|舞蹈|戏剧|摄影|陶|剪纸|设计|手工|雕塑|器乐|合唱/],
  ["science", /科|技|创客|研究|实验|机器人|编程|数学|物理|化学|生物|天文|工程|信息|STEM/i],
];

const FRAME_HINTS: [FrameKind, RegExp][] = [
  ["scroll", /水墨|国画|中国画|书法|楷书|行书|草书|隶书|篆书|山水|工笔/],
  ["gilt", /油画|丙烯|布面/],
  ["clip", /作文|散文|手稿|稿纸|征文|随笔|日记/],
  ["shadowbox", /剪纸|标本|手工|模型|诗集|绘本|刺绣|折纸|书籍/],
  ["white", /水彩|素描|速写|自然笔记|版画|彩铅/],
  ["black", /摄影|照片|影像|海报/],
];

const ROOM_DEFAULT_FRAME: Record<RoomId, FrameKind> = {
  science: "float",
  arts: "black",
  letters: "oak",
  practice: "oak",
  sports: "black",
};

function inferRoom(explicit: string, context: string): RoomId {
  if (ROOM_IDS.has(explicit)) return explicit as RoomId;
  for (const text of [explicit, context]) {
    if (!text) continue;
    const hit = ROOM_HINTS.find(([, pattern]) => pattern.test(text));
    if (hit) return hit[0];
  }
  return "practice";
}

function inferFrame(room: RoomId, context: string): FrameKind {
  return FRAME_HINTS.find(([, pattern]) => pattern.test(context))?.[0] ?? ROOM_DEFAULT_FRAME[room];
}

// ── People ──────────────────────────────────────────────────────────────────

const CN_GRADES: Record<string, Grade> = {
  七年级: "初一",
  八年级: "初二",
  九年级: "初三",
  初中一年级: "初一",
  初中二年级: "初二",
  初中三年级: "初三",
  高中一年级: "高一",
  高中二年级: "高二",
  高中三年级: "高三",
};

/** Reads “初二（3）班”, “八年级3班”, “高一 5” and friends. */
export function parseGradeClass(input: string): { grade?: Grade; className?: string } {
  const text = input.replace(/\s/g, "");
  let grade: Grade | undefined;
  for (const g of GRADES) if (text.includes(g)) grade = g;
  if (!grade) for (const [k, g] of Object.entries(CN_GRADES)) if (text.includes(k)) grade = g;
  const match = text.match(/[（(]?(\d{1,2})[)）]?班?$/);
  return { grade, className: match?.[1] };
}

function normalizeAuthor(raw: unknown): Author | null {
  if (typeof raw === "string") return raw.trim() ? { name: raw.trim() } : null;
  if (!isObj(raw)) return null;
  const name = str(raw.name);
  if (!name) return null;
  const gradeText = str(raw.grade);
  const classText = str(raw.className ?? raw.class);
  const parsed = parseGradeClass(`${gradeText}${classText}`);
  const grade = GRADE_SET.has(gradeText) ? (gradeText as Grade) : parsed.grade;
  const digits = classText.replace(/[（()）班\s]/g, "");
  const className = /^\d{1,2}$/.test(digits) ? digits : parsed.className;
  return { name, ...(grade ? { grade } : null), ...(className ? { className } : null) };
}

function normalizeAuthors(raw: Loose): Author[] {
  const list = Array.isArray(raw.authors) ? raw.authors : Array.isArray(raw.students) ? raw.students : null;
  if (list) return list.map(normalizeAuthor).filter((a): a is Author => a !== null);
  const single = raw.author ?? raw.student;
  if (typeof single === "string" && single.trim()) {
    const extra = isObj(raw) ? { grade: raw.grade, className: raw.className ?? raw.class } : {};
    const author = normalizeAuthor({ name: single, ...extra });
    return author ? [author] : [];
  }
  const author = normalizeAuthor(single);
  return author ? [author] : [];
}

// ── Honours ─────────────────────────────────────────────────────────────────

const LEVEL_HINTS: [AwardLevel, RegExp][] = [
  ["国家级", /国家级|全国|国际/],
  ["省级", /省/],
  ["市级", /市/],
  ["区级", /区级|区|县/],
  ["校级", /校/],
];

/** “一等奖” → “一等”, “金奖” → “金奖”, “冠军” → “冠军”. */
export function sealFromPrize(prize: string): string {
  const p = prize.replace(/\s/g, "");
  if (!p) return "";
  if (/^[一二三特]等奖$/.test(p)) return p.slice(0, 2);
  return p.slice(0, 4);
}

function normalizeAward(raw: unknown): Award | undefined {
  if (typeof raw === "string") {
    // e.g. “省级 一等奖” or “全国青少年科技创新大赛一等奖”
    const text = raw.trim();
    if (!text) return undefined;
    const level = LEVEL_HINTS.find(([, pattern]) => pattern.test(text))?.[0] ?? "校级";
    const prize = text.match(/(特等奖|[一二三]等奖|金奖|银奖|铜奖|冠军|亚军|季军|优秀奖|入选|第[一二三四五六七八九十\d]+名)$/)?.[1] ?? "";
    const event = text.replace(prize, "").replace(/^(国家级|省级|市级|区级|校级)\s*/, "").trim();
    return { level, event, prize: prize || text, seal: sealFromPrize(prize || text) };
  }
  if (!isObj(raw)) return undefined;
  const prize = str(raw.prize);
  const event = str(raw.event ?? raw.name);
  if (!prize && !event) return undefined;
  const levelText = str(raw.level);
  const level = LEVELS.has(levelText)
    ? (levelText as AwardLevel)
    : (LEVEL_HINTS.find(([, pattern]) => pattern.test(`${levelText}${event}`))?.[0] ?? "校级");
  return { level, event, prize, seal: str(raw.seal) || sealFromPrize(prize) };
}

// ── Artwork ─────────────────────────────────────────────────────────────────

/**
 * Brings the different ways a source can describe the picture into one shape:
 * `art: {...}`, `image: "https://…"`, or `image: { src, width, height, alt }`.
 * Width and height may still be missing; the server adapter measures those.
 */
export function rawArt(raw: Loose): Loose | null {
  if (isObj(raw.art)) return { ...raw.art };
  const image = raw.image ?? raw.imageUrl ?? raw.cover;
  if (typeof image === "string" && image.trim()) {
    return { kind: "image", src: image.trim(), alt: str(raw.imageAlt) };
  }
  if (isObj(image)) return { kind: "image", ...image };
  return null;
}

function normalizeArt(raw: Loose | null, id: string, title: string): Artwork {
  if (raw?.kind === "manuscript" && str(raw.text)) {
    return { kind: "manuscript", title: str(raw.title) || title, byline: str(raw.byline), text: str(raw.text) };
  }
  if (raw && (raw.kind === "image" || raw.kind === undefined) && str(raw.src)) {
    return {
      kind: "image",
      src: str(raw.src),
      // Unmeasurable images hang as 4:3 rather than breaking the wall.
      width: num(raw.width) ?? 1200,
      height: num(raw.height) ?? 900,
      tone: str(raw.tone) || undefined,
      alt: str(raw.alt) || title,
    };
  }
  return { kind: "generative", seed: str(raw?.seed) || id, aspect: num(raw?.aspect) ?? 0.75 };
}

// ── Dates & lists ───────────────────────────────────────────────────────────

/** “2026-04-12”, “2026.4”, “2026年4月” → “2026-04”. */
function normalizeDate(input: unknown): string {
  const match = str(input).match(/(\d{4})\D{0,3}(\d{1,2})?/);
  if (!match) return "";
  return match[2] ? `${match[1]}-${match[2].padStart(2, "0")}` : `${match[1]}-01`;
}

const toList = (v: unknown) =>
  (Array.isArray(v) ? v.map(str) : str(v).split(/[,，、;；|]+/)).map((t) => t.trim()).filter(Boolean);

// ── Work ────────────────────────────────────────────────────────────────────

/** Returns a clean `Work`, or `null` when the record has no title or no author. */
export function normalizeWork(raw: unknown): Work | null {
  if (!isObj(raw)) return null;
  const title = str(raw.title ?? raw.name);
  const authors = normalizeAuthors(raw);
  if (!title || authors.length === 0) return null;

  const id = str(raw.id) || `w-${hashString(`${title}|${authors[0].name}`).toString(36)}`;
  const medium = str(raw.medium ?? raw.form);
  const category = str(raw.room ?? raw.category ?? raw.type);
  const tags = toList(raw.tags);
  if (category && !ROOM_IDS.has(category) && !tags.includes(category)) tags.unshift(category);
  const context = [title, medium, category, ...tags].join(" ");
  const room = inferRoom(category, context);
  const award = normalizeAward(raw.award ?? raw.honor);
  const link = isObj(raw.link) ? raw.link : typeof raw.link === "string" ? { url: raw.link } : null;
  const linkUrl = link ? str(link.url) : "";

  return {
    id,
    title,
    subtitle: str(raw.subtitle) || undefined,
    room,
    authors,
    team: str(raw.team) || undefined,
    mentor: str(raw.mentor ?? raw.teacher) || undefined,
    medium,
    date: normalizeDate(raw.date),
    award,
    tags,
    description: str(raw.description ?? raw.summary),
    quote: str(raw.quote) || undefined,
    link: linkUrl ? { label: str(link?.label) || "查看项目", url: linkUrl } : undefined,
    art: normalizeArt(rawArt(raw), id, title),
    frame: FRAME_KINDS.has(str(raw.frame)) ? (str(raw.frame) as FrameKind) : inferFrame(room, context),
    size: SIZES.has(str(raw.size)) ? (str(raw.size) as HangSize) : award?.level === "国家级" ? "lg" : "md",
    hidden: raw.hidden === true || undefined,
  };
}

/** Accepts an array of works, or an object wrapping one in `works`, `data` or `items`. */
export function extractList(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (!isObj(payload)) return null;
  for (const key of ["works", "data", "items", "list", "records"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isObj(value)) {
      const nested = extractList(value);
      if (nested) return nested;
    }
  }
  return null;
}

export function normalizeCollection(list: unknown[]): Work[] {
  const seen = new Set<string>();
  const works: Work[] = [];
  for (const item of list) {
    const work = normalizeWork(item);
    if (!work || seen.has(work.id)) continue;
    seen.add(work.id);
    works.push(work);
  }
  return works;
}
