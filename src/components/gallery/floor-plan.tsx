"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { ROOM_BY_ID } from "@/lib/rooms";
import type { RoomId } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { CorridorMetrics } from "./corridor";

const PLAN_WIDTH = 460;

interface FloorPlanProps {
  metrics: CorridorMetrics | null;
  scrollX: MotionValue<number>;
  currentRoom: string | null;
  onJump: (x: number, smooth: boolean) => void;
}

/** A floor plan of the corridor: rooms, every piece as a tick, and a lantern for where you stand. */
export function FloorPlan({ metrics, scrollX, currentRoom, onJump }: FloorPlanProps) {
  const planRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const track = metrics?.trackWidth || 1;
  const scale = PLAN_WIDTH / track;
  const windowX = useTransform(scrollX, (x) => x * scale);

  useMotionValueEvent(scrollX, "change", (x) => {
    if (!metrics || !planRef.current) return;
    const percent = Math.round((x / Math.max(1, metrics.trackWidth - metrics.viewportWidth)) * 100);
    planRef.current.setAttribute("aria-valuenow", String(Math.max(0, Math.min(100, percent))));
  });

  if (!metrics || metrics.trackWidth <= metrics.viewportWidth + 4) return null;
  const windowW = Math.max(14, metrics.viewportWidth * scale);
  const maxX = metrics.trackWidth - metrics.viewportWidth;

  const jumpTo = (clientX: number, smooth: boolean) => {
    const rect = planRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) / scale - metrics.viewportWidth / 2;
    onJump(Math.max(0, Math.min(maxX, x)), smooth);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    jumpTo(event.clientX, true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) jumpTo(event.clientX, false);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = metrics.viewportWidth * 0.5;
    const x = scrollX.get();
    const map: Record<string, number> = {
      ArrowRight: x + step,
      ArrowLeft: x - step,
      Home: 0,
      End: maxX,
    };
    if (event.key in map) {
      event.preventDefault();
      event.stopPropagation();
      onJump(Math.max(0, Math.min(maxX, map[event.key])), true);
    }
  };

  return (
    <nav className="floorplan" aria-label="平面导览图">
      <div className="floorplan__labels" aria-hidden>
        {metrics.rooms.map((room) => {
          const info = ROOM_BY_ID[room.id as RoomId];
          return (
            <span
              key={room.id}
              className={cn("floorplan__label", currentRoom === room.id && "is-current")}
              style={{ left: (room.left + room.width / 2) * scale }}
            >
              {info?.name ?? room.id}
            </span>
          );
        })}
      </div>
      <motion.div
        ref={planRef}
        className="floorplan__strip"
        style={{ width: PLAN_WIDTH }}
        role="slider"
        tabIndex={0}
        aria-label="在展厅中的位置"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-valuetext={currentRoom ? `${ROOM_BY_ID[currentRoom as RoomId]?.name ?? ""}厅` : "入口与出口"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        data-no-drag
      >
        <span className="floorplan__door floorplan__door--in" aria-hidden>
          入
        </span>
        {metrics.rooms.map((room) => (
          <span
            key={room.id}
            className={cn("floorplan__room", currentRoom === room.id && "is-current")}
            style={{
              left: room.left * scale,
              width: room.width * scale,
              background: ROOM_BY_ID[room.id as RoomId]?.wall,
            }}
            aria-hidden
          />
        ))}
        {metrics.works.map((work) => (
          <span
            key={work.id}
            className="floorplan__work"
            style={{ left: (work.left + work.width / 2) * scale }}
            aria-hidden
          />
        ))}
        <span className="floorplan__door floorplan__door--out" aria-hidden>
          出
        </span>
        <motion.span className="floorplan__window" style={{ x: windowX, width: windowW }} aria-hidden />
      </motion.div>
    </nav>
  );
}
