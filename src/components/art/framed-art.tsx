import type { CSSProperties, Ref } from "react";
import { frameGeometry, type FrameGeometry, type Rect } from "@/lib/geometry";
import type { Work } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArtSurface } from "./art-surface";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

const U = (n: number) => `calc(var(--u) * ${n})`;
const place = (r: Rect): CSSProperties => ({ left: U(r.x), top: U(r.y), width: U(r.w), height: U(r.h) });
const shrink = (r: Rect, d: number): Rect => ({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d });

const GLAZED = new Set(["oak", "black", "white", "shadowbox"]);
const MATTED = new Set(["oak", "black", "white"]);
const MOULDED = new Set(["gilt", "oak", "black", "white", "shadowbox"]);

function Moulding({ thickness, rect, recess, className }: { thickness: number; rect?: Rect; recess?: boolean; className?: string }) {
  return (
    <div
      className={cn("moulding", recess && "moulding--recess", className)}
      style={{ "--mt": U(thickness), ...(rect ? place(rect) : null) } as Vars}
    >
      <i className="t" />
      <i className="r" />
      <i className="b" />
      <i className="l" />
    </div>
  );
}

function ScrollMount({ g }: { g: FrameGeometry }) {
  const { stick, top, mountW } = g.extra;
  const artTop = g.art.y - g.body.y;
  const band = top * 0.15;
  const swallowW = mountW * 0.045;
  return (
    <>
      <div className="scroll__band" style={place({ x: 0, y: artTop - band, w: mountW, h: band })} />
      <div className="scroll__band" style={place({ x: 0, y: artTop + g.art.h, w: mountW, h: band })} />
      <div className="scroll__swallow" style={place({ x: mountW * 0.27, y: stick, w: swallowW, h: top * 0.84 })} />
      <div className="scroll__swallow" style={place({ x: mountW * 0.73 - swallowW, y: stick, w: swallowW, h: top * 0.84 })} />
      <div className="scroll__stick" style={place({ x: 0, y: 0, w: mountW, h: stick })} />
    </>
  );
}

function ScrollCord({ g }: { g: FrameGeometry }) {
  const { cord, stick, overhang, mountW } = g.extra;
  const h = cord + stick;
  const nail = { x: g.w / 2, y: 0.55 };
  const left = { x: overhang + mountW * 0.3, y: cord + stick * 0.4 };
  const right = { x: overhang + mountW * 0.7, y: cord + stick * 0.4 };
  return (
    <svg className="scroll__cord" style={place({ x: 0, y: 0, w: g.w, h })} viewBox={`0 0 ${g.w} ${h}`} aria-hidden>
      <path
        d={`M${left.x} ${left.y}L${nail.x} ${nail.y + 0.15}L${right.x} ${right.y}`}
        fill="none"
        stroke="#9c8c6c"
        strokeWidth={0.16}
        strokeLinejoin="round"
      />
      <circle cx={nail.x} cy={nail.y} r={0.5} fill="#d5c39a" stroke="#4a3f2c" strokeWidth={0.1} />
    </svg>
  );
}

function ScrollRoller({ g }: { g: FrameGeometry }) {
  const { roller, overhang, mountW } = g.extra;
  const y = g.h - roller;
  const knobH = roller * 1.22;
  const knobY = y - (knobH - roller) / 2;
  return (
    <>
      <div className="scroll__roller" style={place({ x: overhang - 0.25, y, w: mountW + 0.5, h: roller })} />
      <div className="scroll__knob" style={place({ x: 0, y: knobY, w: overhang, h: knobH })} />
      <div className="scroll__knob" style={place({ x: overhang + mountW, y: knobY, w: overhang, h: knobH })} />
    </>
  );
}

function ClipHardware({ g }: { g: FrameGeometry }) {
  const hang = g.extra.hang;
  const clipW = g.s * 0.085;
  const clipH = g.s * 0.048;
  const clipTop = hang - clipH * 0.42;
  const handleH = clipH * 0.95;
  const nail = { x: g.w / 2, y: 0.55 };
  const height = clipTop + clipH;
  const clips = [g.w * 0.2, g.w * 0.8];
  return (
    <svg className="clip__hardware" style={place({ x: 0, y: 0, w: g.w, h: height })} viewBox={`0 0 ${g.w} ${height}`} aria-hidden>
      {clips.map((cx) => {
        const handleTop = clipTop - handleH;
        return (
          <g key={cx}>
            <path d={`M${nail.x} ${nail.y + 0.15}L${cx} ${handleTop}`} stroke="#9c8f78" strokeWidth={0.11} fill="none" />
            <path
              d={`M${cx - clipW * 0.36} ${clipTop + 0.15}L${cx - clipW * 0.12} ${handleTop}H${cx + clipW * 0.12}L${cx + clipW * 0.36} ${clipTop + 0.15}`}
              stroke="#d8d8d8"
              strokeWidth={0.2}
              fill="none"
              strokeLinejoin="round"
            />
            <path
              d={`M${cx - clipW / 2} ${clipTop}H${cx + clipW / 2}L${cx + clipW * 0.56} ${clipTop + clipH}H${cx - clipW * 0.56}Z`}
              fill="#131313"
            />
            <rect x={cx - clipW / 2} y={clipTop + clipH * 0.12} width={clipW} height={clipH * 0.16} fill="#3c3c3c" />
          </g>
        );
      })}
      <circle cx={nail.x} cy={nail.y} r={0.48} fill="#d5c39a" stroke="#4a3f2c" strokeWidth={0.1} />
    </svg>
  );
}

export interface FramedArtProps {
  work: Pick<Work, "id" | "art" | "frame" | "size">;
  variant: "wall" | "stage" | "thumb";
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** A piece in its mount, drawn entirely in wall units so it scales without distortion. */
export function FramedArt({ work, variant, className, style, eager, ref }: FramedArtProps) {
  const g = frameGeometry(work);
  const { kind } = g;
  const bodyLocal: Rect = { x: 0, y: 0, w: g.body.w, h: g.body.h };
  const inner = shrink(bodyLocal, g.m);
  const bevel = Math.max(0.18, g.s * 0.008);
  const tone = work.art.kind === "image" ? work.art.tone : undefined;

  return (
    <div
      ref={ref}
      className={cn("framed", `framed--${kind}`, `framed--${variant}`, className)}
      style={{ "--tw": g.w, "--th": g.h, width: U(g.w), height: U(g.h), ...style } as Vars}
      data-frame={kind}
    >
      <div className="framed__inner">
        {kind === "scroll" && <ScrollCord g={g} />}

        <div className="framed__body" style={place(g.body)}>
          {MOULDED.has(kind) && <Moulding thickness={g.m} />}
          {kind === "gilt" && (
            <>
              <div className="framed__mat" style={{ position: "absolute", ...place(inner) }} />
              <div className="framed__beads" style={{ position: "absolute", ...place(shrink(bodyLocal, g.m * 0.6)) }} />
            </>
          )}
          {MATTED.has(kind) && <div className="framed__mat" style={{ position: "absolute", ...place(inner) }} />}
          {kind === "shadowbox" && (
            <>
              <Moulding thickness={g.extra.depth} rect={inner} recess className="framed__depth" />
              <div className="framed__mat" style={{ position: "absolute", ...place(shrink(inner, g.extra.depth)) }} />
            </>
          )}
          {kind === "scroll" && <ScrollMount g={g} />}
          {kind === "plinth" && (
            <div className="vitrine__base" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: U(g.extra.base) }} />
          )}
        </div>

        {MATTED.has(kind) && <Moulding thickness={bevel} rect={shrink(g.art, -bevel)} className="framed__bevel" />}

        <div className="framed__art" style={{ ...place(g.art), "--tone": tone } as Vars}>
          <ArtSurface art={work.art} seed={work.id} eager={eager} />
          <div className="framed__art-shade" />
        </div>

        {GLAZED.has(kind) && <div className="framed__glass" style={place(shrink(g.body, g.m))} />}
        {kind === "plinth" && (
          <div className="vitrine__glass" style={place({ x: 0, y: 0, w: g.body.w, h: g.body.h - g.extra.base })} />
        )}
        {kind === "scroll" && <ScrollRoller g={g} />}
        {kind === "clip" && <ClipHardware g={g} />}
      </div>
    </div>
  );
}
