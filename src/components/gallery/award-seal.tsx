import type { Award } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A vermilion seal carrying the prize. National and provincial honours are cut
 * in relief (白文, solid stamp); city level and below in intaglio (朱文, outlined).
 */
export function AwardSeal({ award, size = 28, className }: { award: Award; size?: number; className?: string }) {
  const chars = [...(award.seal || award.prize)].slice(0, 4);
  if (chars.length === 0) return null;
  const solid = award.level === "国家级" || award.level === "省级";
  const square = chars.length === 1 || chars.length === 4;
  // Seal text reads top-to-bottom, right column first.
  const ordered = chars.length === 4 ? [chars[2], chars[0], chars[3], chars[1]] : chars;
  const width = square ? size : size * 0.62;
  const height = square ? size : size * (chars.length === 3 ? 1.45 : 1.1);

  return (
    <span
      className={cn("seal seal--small", !solid && "seal--outline", className)}
      style={{
        width,
        height,
        fontSize: chars.length === 1 ? size * 0.62 : size * 0.4,
        gridTemplateColumns: chars.length === 4 ? "1fr 1fr" : "1fr",
        padding: size * 0.08,
        gap: size * 0.02,
      }}
      title={`${award.level} · ${award.prize}`}
      aria-hidden
    >
      {ordered.map((ch, i) => (
        <span key={i} className="leading-none">
          {ch}
        </span>
      ))}
    </span>
  );
}
