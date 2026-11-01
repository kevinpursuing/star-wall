import type { CSSProperties } from "react";
import { cnNumber } from "@/lib/format";
import type { Room, Work } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bench, Fireflies } from "./ambience";
import { HungWork } from "./hung-work";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Consecutive small pieces share a bay and hang one above the other (salon style). */
function groupBays(works: Work[]) {
  const bays: Work[][] = [];
  for (const work of works) {
    const last = bays.at(-1);
    const pairable = work.size === "sm" && work.frame !== "plinth";
    if (pairable && last?.length === 1 && last[0].size === "sm" && last[0].frame !== "plinth") last.push(work);
    else bays.push([work]);
  }
  return bays;
}

interface RoomSectionProps {
  room: Room;
  roomIndex: number;
  works: Work[];
  numbering: Map<string, number>;
  liftedId: string | null;
  lampBase: number;
  eagerCount: number;
  onOpen: (id: string) => void;
  registerArt: (id: string) => (el: HTMLDivElement | null) => void;
}

export function RoomSection({
  room,
  roomIndex,
  works,
  numbering,
  liftedId,
  lampBase,
  eagerCount,
  onOpen,
  registerArt,
}: RoomSectionProps) {
  const bays = groupBays(works);
  let workIndex = 0;

  return (
    <section
      className="room"
      id={`room-${room.id}`}
      data-room={room.id}
      style={{ "--wall": room.wall } as Vars}
      aria-labelledby={`room-title-${room.id}`}
    >
      <div className="room__ceiling" aria-hidden />
      <div className="room__wall">
        <header className="room-intro">
          <span className="room-intro__wash lamp" style={{ "--delay": `${lampBase}ms` } as Vars} aria-hidden />
          <h2 id={`room-title-${room.id}`} className="room-intro__name">
            {room.name}
            <span className="sr-only">
              厅 · {room.theme}
            </span>
          </h2>
          <div className="room-intro__body">
            <p className="room-intro__numeral">
              ROOM {room.numeral} · 第{cnNumber(roomIndex + 1)}展厅
            </p>
            <p className="room-intro__theme" aria-hidden>
              {room.name}厅 · {room.theme}
            </p>
            <p className="room-intro__en">{room.en}</p>
            <p className="room-intro__text">{room.intro}</p>
            <p className="room-intro__count">本厅展出 {works.length} 件</p>
          </div>
        </header>

        {bays.map((bay) => {
          const delay = lampBase + 260 + workIndex * 140;
          return (
            <div key={bay.map((w) => w.id).join("+")} className={cn("bay", bay[0].frame === "plinth" && "bay--plinth")}>
              <span className="bay__fixture" aria-hidden />
              <span className="bay__beam lamp" style={{ "--delay": `${delay}ms` } as Vars} aria-hidden />
              <span className="bay__floorglow lamp" style={{ "--delay": `${delay}ms` } as Vars} aria-hidden />
              {bay.map((work) => {
                const index = workIndex++;
                return (
                  <HungWork
                    key={work.id}
                    work={work}
                    no={numbering.get(work.id) ?? index + 1}
                    lampDelay={delay + 60}
                    lifted={liftedId === work.id}
                    eager={index < eagerCount}
                    onOpen={onOpen}
                    artRef={registerArt(work.id)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="room__floor" aria-hidden>
        <Bench offset={roomIndex % 2 === 0 ? 46 : 58} />
      </div>
      <Fireflies seed={room.id} count={Math.min(7, 3 + works.length)} />
    </section>
  );
}
