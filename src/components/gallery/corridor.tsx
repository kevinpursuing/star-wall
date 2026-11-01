"use client";

import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import type { MotionValue } from "motion/react";

export interface CorridorMetrics {
  trackWidth: number;
  viewportWidth: number;
  rooms: { id: string; left: number; width: number }[];
  works: { id: string; left: number; width: number }[];
}

export interface CorridorHandle {
  /** Scroll so `x` (track coordinates) is at the left edge. */
  scrollToX: (x: number, smooth?: boolean) => void;
  /** Bring an element to the centre of the view. */
  centre: (el: Element, smooth?: boolean) => void;
  isVisible: (el: Element) => boolean;
  element: () => HTMLDivElement | null;
}

interface CorridorProps {
  /** True when the horizontal layout is active (see CORRIDOR_QUERY). */
  horizontal: boolean;
  reducedMotion: boolean;
  /** Pause keyboard walking (e.g. while a dialog is open). */
  paused: boolean;
  scrollX: MotionValue<number>;
  onMetrics: (metrics: CorridorMetrics) => void;
  onRoomChange: (roomId: string | null) => void;
  children: ReactNode;
  ref?: Ref<CorridorHandle>;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * The scroll container for the gallery. In the horizontal layout it turns the
 * mouse wheel into a slow walk along the wall, lets visitors drag the wall with
 * the mouse, walks with the arrow keys and moves foreground benches in parallax.
 */
export function Corridor({ horizontal, reducedMotion, paused, scrollX, onMetrics, onRoomChange, children, ref }: CorridorProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const engine = useRef({ target: 0, current: 0, raf: 0, animating: false });
  const callbacks = useRef({ onMetrics, onRoomChange });
  const metricsRef = useRef<CorridorMetrics | null>(null);
  const roomRef = useRef<string | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    callbacks.current = { onMetrics, onRoomChange };
    pausedRef.current = paused;
  });

  const maxScroll = () => {
    const el = scrollerRef.current;
    return el ? el.scrollWidth - el.clientWidth : 0;
  };

  const stop = () => {
    cancelAnimationFrame(engine.current.raf);
    engine.current.animating = false;
  };

  const glideTo = (x: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const e = engine.current;
    const target = Math.max(0, Math.min(maxScroll(), x));
    if (reducedMotion) {
      stop();
      el.scrollLeft = target;
      return;
    }
    if (!e.animating) e.current = el.scrollLeft;
    e.target = target;
    if (e.animating) return;
    e.animating = true;
    const tick = () => {
      e.current += (e.target - e.current) * 0.12;
      if (Math.abs(e.target - e.current) < 0.5) {
        e.current = e.target;
        e.animating = false;
      }
      el.scrollLeft = e.current;
      if (e.animating) e.raf = requestAnimationFrame(tick);
    };
    e.raf = requestAnimationFrame(tick);
  };

  useImperativeHandle(ref, () => ({
    scrollToX(x, smooth = true) {
      const el = scrollerRef.current;
      if (!el) return;
      if (!horizontal) {
        window.scrollTo({ top: x, behavior: smooth && !reducedMotion ? "smooth" : "auto" });
        return;
      }
      if (smooth) glideTo(x);
      else {
        stop();
        el.scrollLeft = x;
      }
    },
    centre(target, smooth = true) {
      const el = scrollerRef.current;
      if (!el) return;
      if (!horizontal) {
        target.scrollIntoView({ block: "center", behavior: smooth && !reducedMotion ? "smooth" : "instant" });
        return;
      }
      const rect = target.getBoundingClientRect();
      const x = el.scrollLeft + rect.left + rect.width / 2 - el.clientWidth / 2;
      if (smooth) glideTo(x);
      else {
        stop();
        el.scrollLeft = Math.max(0, Math.min(maxScroll(), x));
      }
    },
    isVisible(target) {
      const rect = target.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0 && rect.bottom <= window.innerHeight;
    },
    element: () => scrollerRef.current,
  }));

  // Measure rooms and works for the floor plan, and benches for parallax.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect().left - el.scrollLeft;
      const pick = (selector: string, attr: string) =>
        [...el.querySelectorAll<HTMLElement>(selector)].map((node) => {
          const r = node.getBoundingClientRect();
          return { id: node.getAttribute(attr) ?? "", left: r.left - base, width: r.width };
        });
      const metrics: CorridorMetrics = {
        trackWidth: el.scrollWidth,
        viewportWidth: el.clientWidth,
        rooms: pick("[data-room]", "data-room"),
        works: pick("[data-work]", "data-work"),
      };
      metricsRef.current = metrics;
      callbacks.current.onMetrics(metrics);
      updateScrollEffects();
    };

    const updateScrollEffects = () => {
      const x = horizontal ? el.scrollLeft : window.scrollY;
      scrollX.set(x);
      const metrics = metricsRef.current;
      if (horizontal && metrics) {
        const centre = x + el.clientWidth / 2;
        const room = metrics.rooms.find((r) => centre >= r.left && centre < r.left + r.width)?.id ?? null;
        if (room !== roomRef.current) {
          roomRef.current = room;
          callbacks.current.onRoomChange(room);
        }
        if (!reducedMotion) {
          for (const bench of el.querySelectorAll<HTMLElement>("[data-parallax]")) {
            const factor = Number(bench.dataset.parallax);
            const home = Number(bench.dataset.home ?? NaN);
            if (Number.isNaN(home)) continue;
            bench.style.transform = `translate3d(${(-(centre - home) * factor).toFixed(1)}px, 0, 0)`;
          }
        }
      } else if (!horizontal) {
        const mid = window.innerHeight / 2;
        let room: string | null = null;
        for (const node of el.querySelectorAll<HTMLElement>("[data-room]")) {
          const r = node.getBoundingClientRect();
          if (r.top <= mid && r.bottom > mid) room = node.dataset.room ?? null;
        }
        if (room !== roomRef.current) {
          roomRef.current = room;
          callbacks.current.onRoomChange(room);
        }
      }
    };

    const homeBenches = () => {
      const base = el.getBoundingClientRect().left - el.scrollLeft;
      for (const bench of el.querySelectorAll<HTMLElement>("[data-parallax]")) {
        bench.style.transform = "";
        const r = bench.getBoundingClientRect();
        bench.dataset.home = String(r.left - base + r.width / 2);
      }
    };

    let frame = 0;
    const onScroll = () => {
      if (!engine.current.animating) engine.current.target = engine.current.current = el.scrollLeft;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateScrollEffects);
    };

    const remeasure = () => {
      homeBenches();
      measure();
    };
    const observer = new ResizeObserver(remeasure);
    observer.observe(el);
    const track = el.firstElementChild;
    if (track) observer.observe(track);
    const mutations = new MutationObserver(remeasure);
    mutations.observe(el, { childList: true, subtree: true });

    const scrollTarget: HTMLElement | Window = horizontal ? el : window;
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    remeasure();
    return () => {
      observer.disconnect();
      mutations.disconnect();
      scrollTarget.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [horizontal, reducedMotion, scrollX]);

  // Wheel → horizontal walk.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !horizontal) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const scale = event.deltaMode === 1 ? 36 : event.deltaMode === 2 ? el.clientWidth : 1;
      const base = engine.current.animating ? engine.current.target : el.scrollLeft;
      glideTo(base + event.deltaY * scale * 1.15);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // glideTo only closes over refs and reducedMotion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizontal, reducedMotion]);

  // Drag the wall with the mouse; flick for inertia.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !horizontal) return;
    let down = false;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let pointerId = -1;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if ((event.target as HTMLElement).closest("input, textarea, select, a, [data-no-drag]")) return;
      down = true;
      dragging = false;
      startX = lastX = event.clientX;
      startScroll = el.scrollLeft;
      lastT = performance.now();
      velocity = 0;
      pointerId = event.pointerId;
    };
    const onMove = (event: PointerEvent) => {
      if (!down || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      if (!dragging && Math.abs(dx) > 6) {
        dragging = true;
        stop();
        el.setPointerCapture(pointerId);
        el.classList.add("is-dragging");
      }
      if (!dragging) return;
      el.scrollLeft = startScroll - dx;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity = 0.8 * ((event.clientX - lastX) / dt) + 0.2 * velocity;
      lastX = event.clientX;
      lastT = now;
    };
    const onUp = (event: PointerEvent) => {
      if (!down || event.pointerId !== pointerId) return;
      down = false;
      if (!dragging) return;
      dragging = false;
      el.classList.remove("is-dragging");
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
      const swallow = (click: MouseEvent) => {
        click.stopPropagation();
        click.preventDefault();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 0);
      if (Math.abs(velocity) > 0.15) glideTo(el.scrollLeft - velocity * 340);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizontal, reducedMotion]);

  // Arrow keys / Page keys walk along the wall; focused works glide to centre.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !horizontal) return;
    const onKey = (event: KeyboardEvent) => {
      if (pausedRef.current || event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
      if (isTyping(event.target)) return;
      const step = el.clientWidth * 0.42;
      const base = engine.current.animating ? engine.current.target : el.scrollLeft;
      const moves: Record<string, number> = {
        ArrowRight: step,
        ArrowDown: step,
        ArrowLeft: -step,
        ArrowUp: -step,
        PageDown: el.clientWidth * 0.85,
        PageUp: -el.clientWidth * 0.85,
      };
      if (event.key in moves) {
        event.preventDefault();
        glideTo(base + moves[event.key]);
      } else if (event.key === "Home") {
        event.preventDefault();
        glideTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        glideTo(maxScroll());
      }
    };
    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target.matches?.(":focus-visible")) return;
      const rect = target.getBoundingClientRect();
      if (rect.left < el.clientWidth * 0.12 || rect.right > el.clientWidth * 0.88) {
        glideTo(el.scrollLeft + rect.left + rect.width / 2 - el.clientWidth / 2);
      }
    };
    window.addEventListener("keydown", onKey);
    el.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("focusin", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizontal, reducedMotion]);

  useEffect(() => () => cancelAnimationFrame(engine.current.raf), []);

  return (
    <div ref={scrollerRef} className="corridor" data-corridor>
      {children}
    </div>
  );
}
