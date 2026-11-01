"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { CORRIDOR_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import { describeFilters, EMPTY_FILTERS, hangingOrder, isFiltering, matches, type Filters } from "@/lib/filters";
import { ROOMS } from "@/lib/rooms";
import type { Work } from "@/lib/types";
import { readUrlState, writeUrlState } from "@/lib/url-state";
import { Corridor, type CorridorHandle, type CorridorMetrics } from "./corridor";
import { DetailView, type DetailHandle } from "./detail-view";
import { FloorPlan } from "./floor-plan";
import { GuidePanel } from "./guide-panel";
import { EmptyWall, EntranceHall, ExitHall, SpecialHall } from "./halls";
import { RoomSection } from "./room-section";
import { TopBar } from "./top-bar";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function GalleryExperience({ works }: { works: Work[] }) {
  const reducedMotion = useReducedMotion() ?? false;
  const horizontal = useMediaQuery(CORRIDOR_QUERY, true);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [wallFilters, setWallFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [lit, setLit] = useState(false);
  const [metrics, setMetrics] = useState<CorridorMetrics | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const scrollX = useMotionValue(0);
  const corridorRef = useRef<CorridorHandle>(null);
  const detailRef = useRef<DetailHandle>(null);
  const wallArt = useRef(new Map<string, HTMLDivElement>());
  const artRefs = useRef(new Map<string, (el: HTMLDivElement | null) => void>());
  const pushedEntry = useRef(false);
  const pendingOpen = useRef<string | null>(null);
  const pendingTag = useRef<string | null>(null);
  /** The address is only written back after the initial one has been read. */
  const urlReady = useRef(false);
  const state = useRef({ wallFilters, selectedId });

  useEffect(() => {
    state.current = { wallFilters, selectedId };
  });

  // ── Collection & filters ───────────────────────────────────────────────
  const ordered = useMemo(() => hangingOrder(works), [works]);
  const numbering = useMemo(() => new Map(ordered.map((w, i) => [w.id, i + 1])), [ordered]);
  const visible = useMemo(() => ordered.filter((w) => matches(w, wallFilters)), [ordered, wallFilters]);
  const roomsOnWall = useMemo(() => {
    const hung: { room: (typeof ROOMS)[number]; index: number; works: Work[]; lampBase: number; eagerCount: number }[] = [];
    let lampBase = 300;
    let eagerLeft = 4;
    for (const [index, room] of ROOMS.entries()) {
      const roomWorks = visible.filter((w) => w.room === room.id);
      if (roomWorks.length === 0) continue;
      hung.push({ room, index, works: roomWorks, lampBase, eagerCount: eagerLeft });
      lampBase += 260 + roomWorks.length * 140;
      eagerLeft = Math.max(0, eagerLeft - roomWorks.length);
    }
    return hung;
  }, [visible]);
  const studentCount = useMemo(() => new Set(ordered.flatMap((w) => w.authors.map((a) => a.name))).size, [ordered]);
  const filtering = isFiltering(wallFilters);
  const conditions = describeFilters(wallFilters);
  const hangKey = JSON.stringify(wallFilters);

  const selected = selectedId ? (ordered.find((w) => w.id === selectedId) ?? null) : null;
  const navList = selected && visible.some((w) => w.id === selected.id) ? visible : ordered;
  const position = selected ? navList.findIndex((w) => w.id === selected.id) : -1;

  // The search box filters as you type; the wall re-hangs once typing settles.
  useEffect(() => {
    const delay = filters.q !== state.current.wallFilters.q ? 280 : 0;
    const timer = window.setTimeout(() => setWallFilters(filters), delay);
    return () => window.clearTimeout(timer);
  }, [filters]);

  const registerArt = useCallback((id: string) => {
    let callback = artRefs.current.get(id);
    if (!callback) {
      callback = (el) => {
        if (el) wallArt.current.set(id, el);
        else wallArt.current.delete(id);
      };
      artRefs.current.set(id, callback);
    }
    return callback;
  }, []);

  // ── Opening, walking through and closing the detail view ───────────────
  const openWork = useCallback((id: string, push = true) => {
    const el = wallArt.current.get(id);
    setOrigin(el ? el.getBoundingClientRect() : null);
    setSelectedId(id);
    if (push) {
      writeUrlState(state.current.wallFilters, id, "push");
      pushedEntry.current = true;
    } else {
      writeUrlState(state.current.wallFilters, id, "replace");
    }
  }, []);

  /** Deep links (?w=…): bring the piece into view first, then lift it off the wall. */
  const openFromLink = useCallback(
    (id: string) => {
      const el = wallArt.current.get(id);
      if (!el) return;
      corridorRef.current?.centre(el, false);
      requestAnimationFrame(() => openWork(id, false));
    },
    [openWork],
  );

  // ── First visit: read the URL, then turn the lights on ─────────────────
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const initial = readUrlState();
      urlReady.current = true;
      if (isFiltering(initial.filters)) {
        // The wall re-hangs first; the piece opens once the new hang is up (see onRehung).
        pendingOpen.current = initial.workId;
        setFilters(initial.filters);
        setWallFilters(initial.filters);
      } else if (initial.workId) {
        openFromLink(initial.workId);
      }
    });
    const timer = window.setTimeout(() => setLit(true), reducedMotion ? 0 : 950);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback(
    (direction: -1 | 1) => {
      if (position < 0 || navList.length < 2) return;
      const next = navList[(position + direction + navList.length) % navList.length];
      setOrigin(null);
      setSelectedId(next.id);
      writeUrlState(state.current.wallFilters, next.id, "replace");
    },
    [navList, position],
  );

  // Keep the wall behind the overlay lined up, so closing flies the piece back to a visible nail.
  useEffect(() => {
    if (!selectedId) return;
    const el = wallArt.current.get(selectedId);
    if (el && corridorRef.current && !corridorRef.current.isVisible(el)) corridorRef.current.centre(el, false);
  }, [selectedId]);

  const handleClosed = useCallback(() => {
    const id = state.current.selectedId;
    setSelectedId(null);
    setOrigin(null);
    if (pushedEntry.current) {
      pushedEntry.current = false;
      window.history.back();
    } else {
      writeUrlState(state.current.wallFilters, null, "replace");
    }
    const tag = pendingTag.current;
    pendingTag.current = null;
    if (tag) {
      const next = { ...EMPTY_FILTERS, tags: [tag] };
      setFilters(next);
      setWallFilters(next);
      return;
    }
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-work-button="${id}"]`)?.focus({ preventScroll: true });
    });
  }, []);

  // Browser back/forward opens and closes pieces; the URL then mirrors the current filters again.
  useEffect(() => {
    const onPop = () => {
      const { workId } = readUrlState();
      const current = state.current.selectedId;
      if (workId && workId !== current && wallArt.current.has(workId)) {
        openWork(workId, false);
      } else if (!workId && current) {
        pushedEntry.current = false;
        detailRef.current?.close();
      }
      writeUrlState(state.current.wallFilters, workId && wallArt.current.has(workId) ? workId : null, "replace");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openWork]);

  // Mirror the hung filters in the URL so a curated view can be shared.
  useEffect(() => {
    if (urlReady.current) writeUrlState(wallFilters, state.current.selectedId, "replace");
  }, [wallFilters]);

  // Lock page scrolling on phones while a piece is open.
  const detailOpen = selected !== null;
  useEffect(() => {
    if (!detailOpen || horizontal) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [detailOpen, horizontal]);

  // “/” opens the guide from anywhere on the wall.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || isTyping(event.target) || state.current.selectedId) return;
      event.preventDefault();
      setGuideOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Walking helpers ────────────────────────────────────────────────────
  const scrollToStart = useCallback(() => corridorRef.current?.scrollToX(0, true), []);

  const beginTour = useCallback(() => {
    const first = document.querySelector<HTMLElement>("[data-room]");
    if (!first) return;
    if (!horizontal) {
      first.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      return;
    }
    const scroller = corridorRef.current?.element();
    if (!scroller) return;
    const left = first.getBoundingClientRect().left + scroller.scrollLeft;
    corridorRef.current?.scrollToX(left, true);
  }, [horizontal, reducedMotion]);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setWallFilters(EMPTY_FILTERS);
  }, []);

  const onTag = useCallback((tag: string) => {
    pendingTag.current = tag;
    detailRef.current?.close();
  }, []);

  const onRehung = useCallback(() => {
    if (horizontal) corridorRef.current?.scrollToX(0, false);
    else window.scrollTo({ top: 0 });
    const id = pendingOpen.current;
    if (!id) return;
    pendingOpen.current = null;
    window.setTimeout(() => openFromLink(id), 80);
  }, [horizontal, openFromLink]);

  const getWallRect = useCallback((id: string) => wallArt.current.get(id)?.getBoundingClientRect() ?? null, []);

  return (
    <div className="gallery" data-lit={lit}>
      <div inert={detailOpen} className="contents">
        <TopBar
          currentRoom={currentRoom}
          filtering={filtering}
          resultCount={visible.length}
          conditions={conditions}
          onOpenGuide={() => setGuideOpen(true)}
          onClearFilters={clearFilters}
          onHome={scrollToStart}
        />

        <main>
          <Corridor
            ref={corridorRef}
            horizontal={horizontal}
            reducedMotion={reducedMotion}
            paused={detailOpen || guideOpen}
            scrollX={scrollX}
            onMetrics={setMetrics}
            onRoomChange={setCurrentRoom}
          >
            <AnimatePresence mode="wait" initial={false} onExitComplete={onRehung}>
              <motion.div
                key={hangKey}
                className="track"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.32, ease: "easeInOut" }}
              >
                {roomsOnWall.length === 0 ? null : filtering ? (
                  <SpecialHall
                    count={visible.length}
                    conditions={conditions}
                    onClear={clearFilters}
                    onAdjust={() => setGuideOpen(true)}
                  />
                ) : (
                  <EntranceHall
                    workCount={ordered.length}
                    roomCount={new Set(ordered.map((w) => w.room)).size}
                    studentCount={studentCount}
                    onBegin={beginTour}
                  />
                )}

                {roomsOnWall.length === 0 ? (
                  ordered.length === 0 ? (
                    <EmptyWall
                      title="展品正在布置中"
                      message="数据源里暂时还没有可以展出的作品。等同学们的成果送达，这里的灯就会亮起来。"
                    />
                  ) : (
                    <EmptyWall
                      title="这面墙暂时空着"
                      message={`没有找到与 ${conditions || "当前条件"} 相符的作品。换个关键词，或者去隔壁展厅走走——也许它就挂在那里。`}
                      actionLabel="清除筛选，回到常设展"
                      onAction={clearFilters}
                      secondaryLabel="调整条件"
                      onSecondary={() => setGuideOpen(true)}
                    />
                  )
                ) : (
                  roomsOnWall.map(({ room, index, works: roomWorks, lampBase, eagerCount }) => (
                    <RoomSection
                      key={room.id}
                      room={room}
                      roomIndex={index}
                      works={roomWorks}
                      numbering={numbering}
                      liftedId={selectedId}
                      lampBase={lampBase}
                      eagerCount={eagerCount}
                      onOpen={openWork}
                      registerArt={registerArt}
                    />
                  ))
                )}

                {roomsOnWall.length > 0 && (
                  <ExitHall
                    workCount={visible.length}
                    roomCount={roomsOnWall.length}
                    filtering={filtering}
                    onRestart={scrollToStart}
                    onClear={clearFilters}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </Corridor>
        </main>

        {horizontal && (
          <FloorPlan
            metrics={metrics}
            scrollX={scrollX}
            currentRoom={currentRoom}
            onJump={(x, smooth) => corridorRef.current?.scrollToX(x, smooth)}
          />
        )}
      </div>

      <GuidePanel
        open={guideOpen}
        onOpenChange={setGuideOpen}
        side={horizontal ? "right" : "bottom"}
        works={ordered}
        filters={filters}
        onChange={setFilters}
      />

      <DetailView
        ref={detailRef}
        work={selected}
        no={selected ? (numbering.get(selected.id) ?? 0) : 0}
        total={ordered.length}
        position={Math.max(0, position)}
        count={navList.length}
        origin={origin}
        reducedMotion={reducedMotion}
        getWallRect={getWallRect}
        onClosed={handleClosed}
        onNavigate={navigate}
        onTag={onTag}
      />

      <div className="curtain" aria-hidden>
        <span className="curtain__seal">萤</span>
        <span className="curtain__text">正在为你开灯</span>
      </div>
    </div>
  );
}
