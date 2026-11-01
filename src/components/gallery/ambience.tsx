import type { CSSProperties } from "react";
import { seeded } from "@/lib/random";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** A handful of fireflies drifting through the dark parts of a room. Deterministic per seed. */
export function Fireflies({ seed, count }: { seed: string; count: number }) {
  const rand = seeded(`fireflies:${seed}`);
  const drift = () => `${Math.round((rand() - 0.5) * 140)}px`;
  const flies = Array.from({ length: count }, () => ({
    left: 4 + rand() * 92,
    top: rand() < 0.5 ? 14 + rand() * 18 : 66 + rand() * 26,
    dur: 11 + rand() * 12,
    blink: 2.4 + rand() * 3.2,
    delay: -rand() * 14,
    size: 3 + rand() * 2,
    path: [drift(), drift(), drift(), drift(), drift(), drift()],
  }));

  return (
    <div className="fireflies" aria-hidden>
      {flies.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={
            {
              left: `${f.left.toFixed(2)}%`,
              top: `${f.top.toFixed(2)}%`,
              width: f.size,
              height: f.size,
              "--dur": `${f.dur.toFixed(1)}s`,
              "--blink": `${f.blink.toFixed(1)}s`,
              "--delay": `${f.delay.toFixed(1)}s`,
              "--dx1": f.path[0],
              "--dy1": f.path[1],
              "--dx2": f.path[2],
              "--dy2": f.path[3],
              "--dx3": f.path[4],
              "--dy3": f.path[5],
            } as Vars
          }
        />
      ))}
    </div>
  );
}

/** A gallery bench in the foreground. It drifts faster than the wall (see Corridor parallax). */
export function Bench({ offset = 50 }: { offset?: number }) {
  return (
    <div className="bench" data-parallax="0.32" style={{ left: `${offset}%` }} aria-hidden>
      <div className="bench__shadow" />
      <div className="bench__leg bench__leg--l" />
      <div className="bench__leg bench__leg--r" />
      <div className="bench__seat" />
    </div>
  );
}
