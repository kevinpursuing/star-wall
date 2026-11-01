import { MANUSCRIPT } from "@/lib/geometry";
import { seeded } from "@/lib/random";

const NO_LINE_START = new Set("，。、；：？！”’）》」』…—".split(""));

interface Glyph {
  ch: string;
  row: number;
  col: number;
}

/** Lays text out the way a student fills 20×15 manuscript paper. */
function layout(title: string, byline: string, text: string): Glyph[] {
  const { cols, rows } = MANUSCRIPT;
  const glyphs: Glyph[] = [];
  const titleChars = [...title].slice(0, cols);
  const titleStart = Math.max(0, Math.floor((cols - titleChars.length) / 2));
  titleChars.forEach((ch, i) => glyphs.push({ ch, row: 0, col: titleStart + i }));

  const bylineChars = [...byline].slice(0, cols - 2);
  const bylineStart = cols - 2 - bylineChars.length;
  bylineChars.forEach((ch, i) => glyphs.push({ ch, row: 1, col: bylineStart + i }));

  let row = 2;
  for (const paragraph of text.split(/\n+/).map((p) => p.trim()).filter(Boolean)) {
    let col = 2;
    for (const ch of paragraph) {
      if (col >= cols) {
        if (NO_LINE_START.has(ch)) {
          glyphs.push({ ch, row, col: cols });
          col = cols + 1;
          continue;
        }
        row += 1;
        col = 0;
      }
      if (row >= rows) return glyphs;
      glyphs.push({ ch, row, col });
      col += 1;
    }
    row += 1;
    if (row >= rows) break;
  }
  return glyphs;
}

export function ManuscriptArt({ title, byline, text }: { title: string; byline: string; text: string }) {
  const { cols, rows, cell, gap, marginX, marginTop, width, height } = MANUSCRIPT;
  const rand = seeded(title + byline);
  const gridW = cols * cell;
  const rowY = (r: number) => marginTop + r * (cell + gap);

  let grid = "";
  for (let r = 0; r < rows; r++) {
    const y = rowY(r);
    grid += `M${marginX} ${y}H${marginX + gridW}M${marginX} ${y + cell}H${marginX + gridW}`;
    for (let c = 0; c <= cols; c++) grid += `M${marginX + c * cell} ${y}V${y + cell}`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}（手稿节选）`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ms-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7f1e2" />
          <stop offset="1" stopColor="#ece2cb" />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill="url(#ms-paper)" />
      <rect x={marginX - 3} y={marginTop - 3} width={gridW + 6} height={rowY(rows - 1) + cell - marginTop + 6} fill="none" stroke="#c4553b" strokeOpacity="0.7" strokeWidth="0.9" />
      <path d={grid} fill="none" stroke="#c4553b" strokeOpacity="0.55" strokeWidth="0.45" />
      <text x={marginX} y={marginTop - 8} fontSize="5" fill="#b0563f" fillOpacity="0.8" style={{ fontFamily: "var(--font-display)" }}>
        青屿中学 · 作文稿纸
      </text>
      <text x={marginX + gridW} y={marginTop - 8} fontSize="5" textAnchor="end" fill="#b0563f" fillOpacity="0.8" style={{ fontFamily: "var(--font-display)" }}>
        第 1 页
      </text>
      <text x={marginX + gridW} y={height - 9} fontSize="4.6" textAnchor="end" fill="#b0563f" fillOpacity="0.75" style={{ fontFamily: "var(--font-latin-serif)" }}>
        20 × 15 = 300
      </text>
      <g fill="#22304f" style={{ fontFamily: "var(--font-handwriting)" }}>
        {layout(title, byline, text).map(({ ch, row, col }, i) => {
          const x = marginX + col * cell + cell / 2 + (rand() - 0.5) * 0.9;
          const y = rowY(row) + cell / 2 + (rand() - 0.5) * 0.9;
          const r = (rand() - 0.5) * 7;
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize={row === 0 ? 9 : 8.4}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${r.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}
              fillOpacity={0.86 + rand() * 0.14}
            >
              {ch}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
