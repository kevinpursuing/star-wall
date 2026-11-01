export type RoomId = "science" | "arts" | "letters" | "practice" | "sports";

export type Grade = "初一" | "初二" | "初三" | "高一" | "高二" | "高三";

export type AwardLevel = "国家级" | "省级" | "市级" | "区级" | "校级";

/**
 * How a piece is mounted on the wall. Each kind has its own geometry
 * (see `lib/geometry.ts`) and its own look (see `styles/frames.css`).
 */
export type FrameKind =
  | "gilt" // 金色雕花画框 — oil paintings
  | "oak" // 原木画框 — documents, photos, maps
  | "black" // 黑色细框 + 白卡纸 — photography, prints
  | "white" // 白色细框 + 宽卡纸 — botanical / paper works
  | "float" // 无框悬浮装裱 — scientific / contemporary prints
  | "shadowbox" // 深框画箱 — objects, books, paper-cuts
  | "scroll" // 立轴装裱 — ink painting & calligraphy
  | "clip" // 夹挂手稿 — manuscripts
  | "plinth"; // 展台玻璃罩 — 3D objects

export type HangSize = "sm" | "md" | "lg";

export interface Author {
  name: string;
  grade?: Grade;
  /** Class number, e.g. "3" renders as “（3）班”. */
  className?: string;
}

export interface Award {
  level: AwardLevel;
  /** Competition or programme name. */
  event: string;
  /** Prize, e.g. “一等奖”“金奖”“冠军”. */
  prize: string;
  /** 2–4 characters carved into the vermilion seal on the label. */
  seal: string;
}

export type Artwork =
  | {
      kind: "image";
      src: string;
      width: number;
      height: number;
      /** Average colour, shown while the image is loading. */
      tone?: string;
      alt: string;
    }
  | {
      /** Typeset onto Chinese manuscript paper (稿纸). */
      kind: "manuscript";
      title: string;
      byline: string;
      text: string;
    }
  | {
      /** Procedural ink-landscape placeholder for works without an image. */
      kind: "generative";
      seed: string;
      aspect: number;
    };

export interface Work {
  id: string;
  title: string;
  subtitle?: string;
  room: RoomId;
  /** First author is the lead author. */
  authors: Author[];
  /** Optional collective name, e.g. “青屿辩论队”. */
  team?: string;
  mentor?: string;
  /** Form / medium / material, shown on the label. */
  medium: string;
  /** Completion month, `YYYY-MM`; empty when unknown. */
  date: string;
  award?: Award;
  tags: string[];
  /** Curator's note. Paragraphs separated by a blank line. */
  description: string;
  /** The student's own words. */
  quote?: string;
  link?: { label: string; url: string };
  art: Artwork;
  frame: FrameKind;
  size: HangSize;
  hidden?: boolean;
}

export interface Room {
  id: RoomId;
  numeral: string;
  /** Short hall name, e.g. “格物”. */
  name: string;
  /** Subject line, e.g. “科创与探究”. */
  theme: string;
  en: string;
  intro: string;
  /** Wall paint. */
  wall: string;
}
