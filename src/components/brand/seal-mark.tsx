import { cn } from "@/lib/utils";

/** The 萤馆 seal: a carved vermilion stamp with a single firefly of light at its corner. */
export function SealMark({ className, glow = true }: { className?: string; glow?: boolean }) {
  return (
    <span className={cn("relative inline-grid size-9 shrink-0 place-items-center text-[21px]", className)} aria-hidden>
      <span className="seal-ground absolute inset-0" />
      <span className="relative font-serif leading-none font-black text-[#fff4ea]">萤</span>
      {glow && (
        <span className="absolute -top-[3px] -right-[3px] size-[5px] rounded-full bg-firefly shadow-[0_0_8px_3px_rgb(214_255_120/0.55)]" />
      )}
    </span>
  );
}

/** Shared SVG filters, rendered once in the root layout. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <defs>
        {/* Uneven ink and a few missing specks, like a real stamp. */}
        <filter id="seal-rough" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="shaken" />
          <feComponentTransfer in="noise" result="specks">
            <feFuncA type="discrete" tableValues="1 1 1 1 0.35 1 1 1" />
          </feComponentTransfer>
          <feComposite in="shaken" in2="specks" operator="in" />
        </filter>
        {/* Gentler version for small seals, where legibility matters more than texture. */}
        <filter id="seal-soft" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="9" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.55" xChannelSelector="R" yChannelSelector="G" result="shaken" />
          <feComponentTransfer in="noise" result="specks">
            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 0.6 1 1 1" />
          </feComponentTransfer>
          <feComposite in="shaken" in2="specks" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
