import type { Artwork, FrameKind, HangSize, Work } from "./types";

/**
 * All gallery geometry is expressed in wall units (`u`). On the desktop wall
 * 1u ≈ 1% of the viewport height; in the detail view `u` is chosen so the
 * same framed piece fits the stage. Because every measurement of a frame is a
 * multiple of `u`, a piece keeps its exact proportions at any scale — which is
 * what lets it fly from the wall to the viewing stage without distortion.
 */

/** Target painted area (u²) for each hanging size. */
const SIZE_AREA: Record<HangSize, number> = { sm: 540, md: 1000, lg: 1560 };
const MAX_ART_H = 48;
const MAX_ART_W = 66;
/** The wall between skirting and ceiling is 71u tall; leave air above and below. */
const MAX_TOTAL_H = 62;
const MAX_TOTAL_W = 84;

export const MANUSCRIPT = {
  cols: 20,
  rows: 15,
  cell: 10,
  gap: 4,
  marginX: 14,
  marginTop: 22,
  marginBottom: 22,
  get width() {
    return this.marginX * 2 + this.cols * this.cell;
  },
  get height() {
    return this.marginTop + this.rows * (this.cell + this.gap) - this.gap + this.marginBottom;
  },
};

export function artAspect(art: Artwork): number {
  switch (art.kind) {
    case "image":
      return art.width / art.height;
    case "manuscript":
      return MANUSCRIPT.width / MANUSCRIPT.height;
    case "generative":
      return art.aspect;
  }
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FrameGeometry {
  kind: FrameKind;
  /** Total box, including protrusions such as scroll rollers or hanging wire. */
  w: number;
  h: number;
  /** The painted surface inside the box. */
  art: Rect;
  /** The visible body of the frame (excludes hanging cords / wires). */
  body: Rect;
  /** Moulding thickness. */
  m: number;
  /** Mat / liner / backing width between moulding and art. */
  mat: number;
  /** Characteristic size of the artwork, √(w·h). */
  s: number;
  /** Kind-specific measurements. */
  extra: Record<string, number>;
}

function artSize(aspect: number, size: HangSize) {
  let h = Math.sqrt(SIZE_AREA[size] / aspect);
  let w = h * aspect;
  if (h > MAX_ART_H) {
    h = MAX_ART_H;
    w = h * aspect;
  }
  if (w > MAX_ART_W) {
    w = MAX_ART_W;
    h = w / aspect;
  }
  return { w, h };
}

const round = (n: number) => Math.round(n * 100) / 100;

export function frameGeometry(work: Pick<Work, "art" | "frame" | "size">): FrameGeometry {
  const art = artSize(artAspect(work.art), work.size);
  let g = mount(work.frame, art.w, art.h);
  // Tall mounts (scrolls especially) can outgrow the wall: shrink the painting until the whole piece fits.
  for (let i = 0; i < 3 && (g.h > MAX_TOTAL_H || g.w > MAX_TOTAL_W); i++) {
    const k = Math.min(MAX_TOTAL_H / g.h, MAX_TOTAL_W / g.w);
    g = mount(work.frame, g.art.w * k, g.art.h * k);
  }
  return g;
}

function mount(kind: FrameKind, aw: number, ah: number): FrameGeometry {
  const s = Math.sqrt(aw * ah);

  const boxed = (m: number, mat: number, matBottomExtra = 0): FrameGeometry => {
    const w = aw + 2 * (m + mat);
    const h = ah + 2 * (m + mat) + matBottomExtra;
    return {
      kind,
      w,
      h,
      art: { x: m + mat, y: m + mat, w: aw, h: ah },
      body: { x: 0, y: 0, w, h },
      m,
      mat,
      s,
      extra: { matBottomExtra },
    };
  };

  let g: FrameGeometry;
  switch (kind) {
    case "gilt":
      g = boxed(0.13 * s, 0.03 * s);
      break;
    case "oak":
      g = boxed(0.055 * s, 0.06 * s);
      break;
    case "black":
      g = boxed(0.024 * s, 0.15 * s, 0.025 * s);
      break;
    case "white":
      g = boxed(0.03 * s, 0.19 * s, 0.03 * s);
      break;
    case "float":
      g = boxed(0, 0);
      break;
    case "shadowbox": {
      const m = 0.05 * s;
      const depth = 0.05 * s;
      const backing = 0.075 * s;
      g = boxed(m, depth + backing);
      g.extra.depth = depth;
      break;
    }
    case "plinth": {
      const glass = 0.012 * s;
      const base = 0.07 * s;
      const w = aw + 2 * glass;
      const h = ah + 2 * glass + base;
      g = {
        kind,
        w,
        h,
        art: { x: glass, y: glass, w: aw, h: ah },
        body: { x: 0, y: 0, w, h },
        m: glass,
        mat: 0,
        s,
        extra: { base },
      };
      break;
    }
    case "clip": {
      const hang = 0.12 * s;
      g = {
        kind,
        w: aw,
        h: ah + hang,
        art: { x: 0, y: hang, w: aw, h: ah },
        body: { x: 0, y: hang, w: aw, h: ah },
        m: 0,
        mat: 0,
        s,
        extra: { hang },
      };
      break;
    }
    case "scroll": {
      const side = 0.085 * aw;
      const top = 0.26 * aw + 0.12 * ah;
      const bottom = top * 0.52;
      const stick = Math.max(0.9, 0.018 * ah);
      const cord = 0.1 * ah;
      const roller = Math.max(1.4, 0.03 * ah);
      const overhang = Math.max(1.1, 0.06 * aw);
      const mountW = aw + 2 * side;
      const w = mountW + 2 * overhang;
      const h = cord + stick + top + ah + bottom + roller;
      g = {
        kind,
        w,
        h,
        art: { x: overhang + side, y: cord + stick + top, w: aw, h: ah },
        body: { x: overhang, y: cord, w: mountW, h: h - cord },
        m: 0,
        mat: side,
        s,
        extra: { side, top, bottom, stick, cord, roller, overhang, mountW },
      };
      break;
    }
  }

  return {
    ...g,
    w: round(g.w),
    h: round(g.h),
    m: round(g.m),
    mat: round(g.mat),
    art: { x: round(g.art.x), y: round(g.art.y), w: round(g.art.w), h: round(g.art.h) },
    body: { x: round(g.body.x), y: round(g.body.y), w: round(g.body.w), h: round(g.body.h) },
    extra: Object.fromEntries(Object.entries(g.extra).map(([k, v]) => [k, round(v)])),
  };
}

/** Height of the pedestal under a `plinth` piece on the desktop wall (in u). */
export const PEDESTAL_HEIGHT = 25;
