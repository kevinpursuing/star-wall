"use client";

import type { CSSProperties } from "react";
import { ArrowLeft, DoorOpen, Link2, MoveRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cnNumber } from "@/lib/format";
import { copyCurrentLink } from "@/lib/share";
import { site } from "@/site.config";
import { Fireflies } from "./ambience";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

function HallShell({
  id,
  className,
  labelledBy,
  children,
  fireflies = 5,
}: {
  id: string;
  className?: string;
  labelledBy: string;
  children: React.ReactNode;
  fireflies?: number;
}) {
  return (
    <section className={`hall ${className ?? ""}`} id={id} aria-labelledby={labelledBy}>
      <div className="room__ceiling" aria-hidden />
      <div className="room__wall">{children}</div>
      <div className="room__floor" aria-hidden />
      <Fireflies seed={id} count={fireflies} />
    </section>
  );
}

interface EntranceProps {
  workCount: number;
  roomCount: number;
  studentCount: number;
  onBegin: () => void;
}

export function EntranceHall({ workCount, roomCount, studentCount, onBegin }: EntranceProps) {
  return (
    <HallShell id="hall-entrance" className="hall--entrance" labelledBy="exhibition-title" fireflies={7}>
      <div className="hall__content entrance">
        <span className="entrance__wash lamp" style={{ "--delay": "120ms" } as Vars} aria-hidden />
        <p className="entrance__motto" aria-hidden>
          {site.tagline}
        </p>
        <div className="entrance__main">
          <p className="entrance__kicker">
            {site.school} · {site.kind}
            <span className="entrance__latin">{site.latin}</span>
          </p>
          <h1 id="exhibition-title" className="entrance__title">
            少年<span className="entrance__light">有光</span>
          </h1>
          <p className="entrance__season">{site.season}</p>
          <p className="entrance__preface">{site.preface}</p>
          {workCount > 0 && (
            <dl className="entrance__stats">
              <div>
                <dt>展品</dt>
                <dd>{cnNumber(workCount)}</dd>
              </div>
              <div>
                <dt>展厅</dt>
                <dd>{cnNumber(roomCount)}</dd>
              </div>
              <div>
                <dt>参展同学</dt>
                <dd>{cnNumber(studentCount)}</dd>
              </div>
            </dl>
          )}
          <div className="entrance__cta">
            <Button variant="ghost" className="gallery-btn gallery-btn--primary" onClick={onBegin}>
              开始观展
              <MoveRight className="walk-hint__arrow size-4" aria-hidden />
            </Button>
            <span className="entrance__hint">
              <span className="corridor-only">滚动、拖拽或按 ← → 键漫步</span>
              <span className="phone-only">向下滑动，走进展厅</span>
            </span>
          </div>
        </div>
      </div>
    </HallShell>
  );
}

interface SpecialProps {
  count: number;
  conditions: string;
  onClear: () => void;
  onAdjust: () => void;
}

export function SpecialHall({ count, conditions, onClear, onAdjust }: SpecialProps) {
  return (
    <HallShell id="hall-special" className="hall--entrance hall--special" labelledBy="special-title" fireflies={5}>
      <div className="hall__content entrance">
        <span className="entrance__wash lamp" style={{ "--delay": "80ms" } as Vars} aria-hidden />
        <div className="entrance__main">
          <p className="entrance__kicker">
            特展 · 临时为你布置
            <span className="entrance__latin">SPECIAL DISPLAY</span>
          </p>
          <h1 id="special-title" className="special__title">
            为你点亮的
            <span className="special__count">{count}</span>
            件作品
          </h1>
          <p className="special__conditions">筛选条件：{conditions}</p>
          <p className="entrance__preface">
            其余展品暂时熄了灯。它们还在原来的展厅里，随时可以回去看看。
          </p>
          <div className="entrance__cta">
            <Button variant="ghost" className="gallery-btn gallery-btn--primary" onClick={onAdjust}>
              <SlidersHorizontal className="size-4" aria-hidden />
              调整条件
            </Button>
            <Button variant="ghost" className="gallery-btn" onClick={onClear}>
              回到常设展
            </Button>
          </div>
        </div>
      </div>
    </HallShell>
  );
}

interface EmptyWallProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/** A single lit, empty spot on the wall where a piece would hang. */
export function EmptyWall({ title, message, actionLabel, onAction, secondaryLabel, onSecondary }: EmptyWallProps) {
  return (
    <HallShell id="hall-empty" className="hall--empty" labelledBy="empty-title" fireflies={3}>
      <div className="hall__content empty">
        <div className="empty__frame lamp" aria-hidden>
          <span className="empty__nail" />
        </div>
        <div className="empty__text">
          <h2 id="empty-title" className="empty__title">
            {title}
          </h2>
          <p className="entrance__preface">{message}</p>
          {actionLabel && onAction && (
            <div className="entrance__cta">
              <Button variant="ghost" className="gallery-btn gallery-btn--primary" onClick={onAction}>
                {actionLabel}
              </Button>
              {secondaryLabel && onSecondary && (
                <Button variant="ghost" className="gallery-btn" onClick={onSecondary}>
                  <SlidersHorizontal className="size-4" aria-hidden />
                  {secondaryLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </HallShell>
  );
}

interface ExitProps {
  workCount: number;
  roomCount: number;
  filtering: boolean;
  onRestart: () => void;
  onClear: () => void;
}

export function ExitHall({ workCount, roomCount, filtering, onRestart, onClear }: ExitProps) {
  return (
    <HallShell id="hall-exit" className="hall--exit" labelledBy="exit-title" fireflies={8}>
      <div className="hall__content exit">
        <div className="exit-sign" aria-hidden>
          <DoorOpen className="size-[18px]" strokeWidth={2.2} />
          <span>出口</span>
          <span className="exit-sign__en">EXIT</span>
        </div>
        <h2 id="exit-title" className="exit__title">
          {filtering ? "特展到此结束" : "感谢观展"}
        </h2>
        <p className="entrance__preface">
          {filtering
            ? `你看完了为你点亮的 ${workCount} 件作品。常设展里还有更多的光。`
            : `你走过了${cnNumber(roomCount)}个展厅，见过${cnNumber(workCount)}件作品背后的日日夜夜。${site.farewell}`}
        </p>
        <div className="entrance__cta">
          {filtering ? (
            <Button variant="ghost" className="gallery-btn gallery-btn--primary" onClick={onClear}>
              回到常设展
            </Button>
          ) : (
            <Button variant="ghost" className="gallery-btn gallery-btn--primary" onClick={onRestart}>
              <ArrowLeft className="size-4" aria-hidden />
              回到入口
            </Button>
          )}
          <Button variant="ghost" className="gallery-btn" onClick={copyCurrentLink}>
            <Link2 className="size-4" aria-hidden />
            分享这场展览
          </Button>
        </div>
      </div>
    </HallShell>
  );
}
