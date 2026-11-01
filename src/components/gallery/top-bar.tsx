"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Link2, Search, X } from "lucide-react";
import { SealMark } from "@/components/brand/seal-mark";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cnNumber } from "@/lib/format";
import { ROOM_BY_ID, ROOMS } from "@/lib/rooms";
import { copyCurrentLink } from "@/lib/share";
import type { RoomId } from "@/lib/types";
import { site } from "@/site.config";

interface TopBarProps {
  currentRoom: string | null;
  filtering: boolean;
  resultCount: number;
  conditions: string;
  onOpenGuide: () => void;
  onClearFilters: () => void;
  onHome: () => void;
}

export function TopBar({ currentRoom, filtering, resultCount, conditions, onOpenGuide, onClearFilters, onHome }: TopBarProps) {
  const room = currentRoom ? ROOM_BY_ID[currentRoom as RoomId] : null;
  const roomIndex = room ? ROOMS.findIndex((r) => r.id === room.id) : -1;

  return (
    <header className="topbar">
      <Link
        href="/"
        className="topbar__brand"
        onClick={(event) => {
          event.preventDefault();
          onHome();
        }}
        aria-label={`${site.name} · 回到入口`}
      >
        <SealMark />
        <span className="flex flex-col">
          <span className="topbar__name">{site.name}</span>
          <span className="topbar__sub">
            {site.school} · {site.kind}
          </span>
        </span>
      </Link>

      <div className="topbar__center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {filtering ? (
            <motion.div
              key="filtering"
              className="topbar__ribbon"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <span className="topbar__ribbon-tag">特展</span>
              <span className="truncate">
                {resultCount} 件 · {conditions}
              </span>
              <button type="button" className="topbar__ribbon-clear" onClick={onClearFilters} aria-label="清除筛选，回到常设展">
                <X className="size-3.5" aria-hidden />
              </button>
            </motion.div>
          ) : room ? (
            <motion.p
              key={room.id}
              className="topbar__room"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.35 }}
            >
              <span className="topbar__room-no">ROOM {room.numeral}</span>
              <span>
                第{cnNumber(roomIndex + 1)}展厅 · {room.name} — {room.theme}
              </span>
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="topbar__actions">
        <Button variant="ghost" className="topbar__search" onClick={onOpenGuide} aria-keyshortcuts="/">
          <Search className="size-4" aria-hidden />
          <span>寻找作品</span>
          <kbd className="topbar__kbd" aria-hidden>
            /
          </kbd>
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon" className="topbar__icon" onClick={copyCurrentLink} aria-label="复制当前展览的链接" />}
          >
            <Link2 className="size-4" aria-hidden />
          </TooltipTrigger>
          <TooltipContent side="bottom">复制链接 · 连同筛选与近观的作品</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
