"use client";

import { useState } from "react";
import type { Artwork } from "@/lib/types";
import { GenerativeArt } from "./generative-art";
import { ManuscriptArt } from "./manuscript-art";

/** The painted surface of a piece: a photograph, a manuscript page, or a generated stand-in. */
export function ArtSurface({ art, seed, eager }: { art: Artwork; seed: string; eager?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (art.kind === "image" && failedSrc !== art.src) {
    return (
      // A plain <img> on purpose: the wall and the viewing stage must share one
      // cached URL so the piece never flashes while it flies between them.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={art.src}
        alt={art.alt}
        width={art.width}
        height={art.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onError={() => setFailedSrc(art.src)}
      />
    );
  }

  if (art.kind === "manuscript") {
    return <ManuscriptArt title={art.title} byline={art.byline} text={art.text} />;
  }

  const aspect = art.kind === "image" ? art.width / art.height : art.aspect;
  return (
    <>
      <GenerativeArt seed={art.kind === "generative" ? art.seed : seed} aspect={aspect} />
      {art.kind === "image" && (
        <span className="absolute inset-x-0 bottom-[6%] text-center font-serif text-[clamp(9px,calc(var(--u)*1.2),14px)] tracking-[0.2em] text-[#5b5245]">
          图像暂未送达
        </span>
      )}
    </>
  );
}
