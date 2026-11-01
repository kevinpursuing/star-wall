"use client";

import type { CSSProperties, PointerEvent } from "react";
import { FramedArt } from "@/components/art/framed-art";
import { authorLine } from "@/lib/format";
import { frameGeometry } from "@/lib/geometry";
import type { Work } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MuseumLabel } from "./museum-label";

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const U = (n: number) => `calc(var(--u) * ${n})`;

function trackGlare(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  event.currentTarget.style.setProperty("--mx", x.toFixed(3));
}

interface HungWorkProps {
  work: Work;
  no: number;
  lampDelay: number;
  lifted: boolean;
  eager?: boolean;
  onOpen: (id: string) => void;
  artRef: (el: HTMLDivElement | null) => void;
}

export function HungWork({ work, no, lampDelay, lifted, eager, onOpen, artRef }: HungWorkProps) {
  const g = frameGeometry(work);
  const plinth = work.frame === "plinth";

  return (
    <figure
      className={cn("work", plinth && "work--plinth")}
      style={{ "--tw": g.w, "--th": g.h } as Vars}
      data-work={work.id}
    >
      <div className="work__piece">
        <div className="work__pool lamp" style={{ "--delay": `${lampDelay}ms` } as Vars} aria-hidden />
        <button
          type="button"
          className="work__button"
          data-work-button={work.id}
          aria-label={`近观《${work.title}》，${authorLine(work)}`}
          aria-describedby={`label-${work.id}`}
          onClick={() => onOpen(work.id)}
          onPointerMove={trackGlare}
        >
          <FramedArt ref={artRef} work={work} variant="wall" eager={eager} className={lifted ? "work__lifted" : undefined} />
          {lifted && (
            <span
              className="work__ghost"
              style={{ left: U(g.body.x), top: U(g.body.y), width: U(g.body.w), height: U(g.body.h) }}
              aria-hidden
            />
          )}
        </button>
        {plinth && <div className="pedestal" style={{ width: U(g.w + 1.4) }} aria-hidden />}
      </div>
      <MuseumLabel work={work} no={no} id={`label-${work.id}`} />
    </figure>
  );
}
