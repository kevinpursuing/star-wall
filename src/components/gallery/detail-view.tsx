"use client";

import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { animate, AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { FramedArt } from "@/components/art/framed-art";
import { Button } from "@/components/ui/button";
import { classLabel, longDate, pad2, paragraphs } from "@/lib/format";
import { ROOM_BY_ID } from "@/lib/rooms";
import type { Work } from "@/lib/types";
import { AwardSeal } from "./award-seal";

export interface DetailHandle {
  close: () => void;
}

/** The element's box without any of the transforms currently animating it or its slot. */
function measureLayout(el: HTMLElement) {
  const touched: [HTMLElement, string][] = [];
  for (let node: HTMLElement | null = el; node && !node.classList.contains("detail"); node = node.parentElement) {
    if (node.style.transform && node.style.transform !== "none") {
      touched.push([node, node.style.transform]);
      node.style.transform = "none";
    }
  }
  const rect = el.getBoundingClientRect();
  for (const [node, transform] of touched) node.style.transform = transform;
  return rect;
}

interface StageArtProps {
  work: Work;
  origin: DOMRect | null;
  reducedMotion: boolean;
  onReady: (el: HTMLDivElement) => void;
}

/** The piece on the viewing stage. On first mount it flies in from its place on the wall. */
function StageArt({ work, origin, reducedMotion, onReady }: StageArtProps) {
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.transform = "";
    onReady(el);
    const to = measureLayout(el);
    if (!origin || reducedMotion || to.width === 0) return;
    const dx = origin.left - to.left;
    const dy = origin.top - to.top;
    const scale = origin.width / to.width;
    el.style.transformOrigin = "0 0";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    const controls = animate(
      el,
      { x: [dx, 0], y: [dy, 0], scale: [scale, 1] },
      { type: "spring", stiffness: 150, damping: 23, mass: 0.95, restDelta: 0.0005 },
    );
    return () => controls.stop();
    // Runs once per mounted piece; origin is only meaningful at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={innerRef} className="detail__art">
      <FramedArt work={work} variant="stage" eager />
    </div>
  );
}

function Catalogue({ work, no, total, onTag }: { work: Work; no: number; total: number; onTag: (tag: string) => void }) {
  const room = ROOM_BY_ID[work.room];
  return (
    <div className="catalogue">
      <p className="catalogue__kicker">
        <span>
          展品 No. {pad2(no)}
          <span className="text-[#9a8f7b]"> / {pad2(total)}</span>
        </span>
        <span>
          ROOM {room.numeral} · {room.name}厅
        </span>
      </p>
      <Dialog.Title className="catalogue__title">{work.title}</Dialog.Title>
      {work.subtitle && <p className="catalogue__subtitle">{work.subtitle}</p>}

      <div className="catalogue__authors">
        {work.team && <p className="catalogue__team">{work.team}</p>}
        <ul>
          {work.authors.map((author) => (
            <li key={author.name}>
              <span className="catalogue__name">{author.name}</span>
              <span className="catalogue__class">{classLabel(author)}</span>
            </li>
          ))}
        </ul>
      </div>

      {work.award && (
        <div className="catalogue__award">
          <AwardSeal award={work.award} size={52} />
          <div>
            <p className="catalogue__award-level">
              {work.award.level} · {work.award.prize}
            </p>
            <p className="catalogue__award-event">{work.award.event}</p>
          </div>
        </div>
      )}

      <dl className="catalogue__facts">
        {work.medium && (
          <div>
            <dt>形式 / 材质</dt>
            <dd>{work.medium}</dd>
          </div>
        )}
        {work.date && (
          <div>
            <dt>完成时间</dt>
            <dd>{longDate(work.date)}</dd>
          </div>
        )}
        {work.mentor && (
          <div>
            <dt>指导教师</dt>
            <dd>{work.mentor}</dd>
          </div>
        )}
        <div>
          <dt>所在展厅</dt>
          <dd>
            {room.name}厅 · {room.theme}
          </dd>
        </div>
      </dl>

      {work.description && (
        <section className="catalogue__section" aria-labelledby="catalogue-note">
          <h3 id="catalogue-note">策展手记</h3>
          <Dialog.Description render={<div />}>
            {paragraphs(work.description).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Dialog.Description>
        </section>
      )}

      {work.quote && (
        <figure className="catalogue__quote">
          <blockquote>{work.quote}</blockquote>
          <figcaption>
            —— {work.authors[0].name}
            {work.authors.length > 1 ? " 等" : ""}
          </figcaption>
        </figure>
      )}

      {work.tags.length > 0 && (
        <div className="catalogue__tags">
          <h3>关键词</h3>
          <div>
            {work.tags.map((tag) => (
              <button key={tag} type="button" onClick={() => onTag(tag)} aria-label={`查看所有带“${tag}”标签的作品`}>
                # {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {work.link && (
        <a className="catalogue__link" href={work.link.url} target="_blank" rel="noreferrer">
          {work.link.label}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}

      <p className="catalogue__hint" aria-hidden>
        ← → 切换展品 · Esc 返回展厅
      </p>
    </div>
  );
}

interface DetailViewProps {
  work: Work | null;
  no: number;
  total: number;
  position: number;
  count: number;
  origin: DOMRect | null;
  reducedMotion: boolean;
  getWallRect: (id: string) => DOMRect | null;
  onClosed: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onTag: (tag: string) => void;
  ref?: Ref<DetailHandle>;
}

export function DetailView({
  work,
  no,
  total,
  position,
  count,
  origin,
  reducedMotion,
  getWallRect,
  onClosed,
  onNavigate,
  onTag,
  ref,
}: DetailViewProps) {
  const [closing, setClosing] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const closingRef = useRef(false);
  const stage = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    if (!work || closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const finish = () => {
      closingRef.current = false;
      setClosing(false);
      onClosed();
    };
    const wall = getWallRect(work.id);
    const el = stage.current;
    if (!reducedMotion && wall && el && wall.width > 0) {
      const rect = measureLayout(el);
      el.style.transformOrigin = "0 0";
      animate(
        el,
        { x: wall.left - rect.left, y: wall.top - rect.top, scale: wall.width / rect.width },
        { type: "spring", stiffness: 190, damping: 28, restDelta: 0.0005 },
      ).then(finish);
    } else {
      window.setTimeout(finish, reducedMotion ? 0 : 280);
    }
  }, [work, getWallRect, reducedMotion, onClosed]);

  useImperativeHandle(ref, () => ({ close }), [close]);

  const navigate = (dir: -1 | 1) => {
    if (closingRef.current) return;
    setDirection(dir);
    onNavigate(dir);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1);
    }
  };

  const open = work !== null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      modal="trap-focus"
      disablePointerDismissal
    >
      <Dialog.Portal>
        <Dialog.Popup className="detail" initialFocus={closeButtonRef} finalFocus={false} onKeyDown={onKeyDown}>
          <motion.div
            className="detail__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: closing ? 0 : 1 }}
            transition={{ duration: closing ? 0.5 : 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            aria-hidden
          />
          {work && (
            <>
              <div
                className="detail__stage"
                onClick={(event) => {
                  if (event.target === event.currentTarget) close();
                }}
              >
                <motion.div
                  className="detail__spot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: closing ? 0 : 1 }}
                  transition={{ duration: 0.8, delay: closing ? 0 : 0.15 }}
                  aria-hidden
                />
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={work.id}
                    className="detail__art-slot"
                    custom={direction}
                    variants={{
                      enter: (d: number) => ({ opacity: 0, x: reducedMotion ? 0 : d * 70 }),
                      centre: { opacity: 1, x: 0 },
                      leave: (d: number) => ({ opacity: 0, x: reducedMotion ? 0 : d * -70 }),
                    }}
                    initial="enter"
                    animate="centre"
                    exit="leave"
                    transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                  >
                    <StageArt
                      work={work}
                      origin={origin}
                      reducedMotion={reducedMotion}
                      onReady={(el) => {
                        stage.current = el;
                      }}
                    />
                  </motion.div>
                </AnimatePresence>

                <motion.div
                  className="detail__nav"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: closing ? 0 : 1, y: 0 }}
                  transition={{ duration: 0.4, delay: closing ? 0 : 0.35 }}
                >
                  <Button variant="ghost" className="detail__nav-btn" onClick={() => navigate(-1)} disabled={count < 2} aria-label="上一件展品">
                    <ChevronLeft className="size-5" aria-hidden />
                  </Button>
                  <span className="detail__counter" aria-live="polite">
                    {pad2(position + 1)}
                    <span className="opacity-50"> / {pad2(count)}</span>
                  </span>
                  <Button variant="ghost" className="detail__nav-btn" onClick={() => navigate(1)} disabled={count < 2} aria-label="下一件展品">
                    <ChevronRight className="size-5" aria-hidden />
                  </Button>
                </motion.div>
              </div>

              <motion.aside
                className="detail__sheet tex-paper"
                initial={{ opacity: 0, x: reducedMotion ? 0 : 48 }}
                animate={closing ? { opacity: 0, x: reducedMotion ? 0 : 36 } : { opacity: 1, x: 0 }}
                transition={{ duration: closing ? 0.32 : 0.6, delay: closing ? 0 : 0.12, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.28 }}
                  >
                    <Catalogue work={work} no={no} total={total} onTag={onTag} />
                  </motion.div>
                </AnimatePresence>
              </motion.aside>

              <Dialog.Close
                ref={closeButtonRef}
                render={<Button variant="ghost" className="detail__close" />}
                aria-label="返回展厅"
              >
                <ArrowLeft className="size-4 max-md:hidden" aria-hidden />
                <X className="size-5 md:hidden" aria-hidden />
                <span className="max-md:sr-only">返回展厅</span>
              </Dialog.Close>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
