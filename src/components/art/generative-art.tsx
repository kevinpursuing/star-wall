import { seeded } from "@/lib/random";

/**
 * A procedural ink landscape, used when a work has no image yet
 * (or its image fails to load). Same seed → same painting.
 */
export function GenerativeArt({ seed, aspect, label }: { seed: string; aspect: number; label?: string }) {
  const rand = seeded(seed);
  const width = 300;
  const height = Math.round(width / Math.max(0.3, Math.min(aspect, 3.5)));
  const ridges = 5;
  const sunX = width * (0.2 + rand() * 0.6);
  const sunY = height * (0.16 + rand() * 0.16);
  const sunR = Math.min(width, height) * (0.06 + rand() * 0.05);

  const ridgePath = (index: number) => {
    const base = height * (0.42 + index * 0.12 + rand() * 0.04);
    const amp = height * (0.16 - index * 0.022) * (0.7 + rand() * 0.6);
    const f1 = 1.2 + rand() * 2.2;
    const f2 = 3 + rand() * 5;
    const p1 = rand() * Math.PI * 2;
    const p2 = rand() * Math.PI * 2;
    let d = `M0 ${height}`;
    for (let x = 0; x <= width; x += 6) {
      const t = x / width;
      const y = base - amp * (0.65 * Math.sin(t * f1 * Math.PI + p1) + 0.35 * Math.sin(t * f2 * Math.PI + p2)) ** 2;
      d += `L${x} ${y.toFixed(1)}`;
    }
    return `${d}L${width} ${height}Z`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label ?? "抽象水墨占位画"} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`g-paper-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1e9d6" />
          <stop offset="1" stopColor="#e3d7bd" />
        </linearGradient>
        <linearGradient id={`g-mist-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1e9d6" stopOpacity="0" />
          <stop offset="1" stopColor="#f1e9d6" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#g-paper-${seed})`} />
      <circle cx={sunX} cy={sunY} r={sunR} fill="#b5321f" fillOpacity="0.82" />
      {Array.from({ length: ridges }, (_, i) => (
        <g key={i}>
          <path d={ridgePath(i)} fill="#1d1b18" fillOpacity={0.1 + i * 0.16} />
          <rect y={height * (0.4 + i * 0.12)} width={width} height={height * 0.1} fill={`url(#g-mist-${seed})`} />
        </g>
      ))}
      <rect x={width - 26} y={height - 30} width="12" height="12" fill="#b5321f" fillOpacity="0.85" rx="1" />
    </svg>
  );
}
