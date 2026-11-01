"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { isFiltering, matches, tagCounts, type Filters } from "@/lib/filters";
import { AWARD_LEVELS, GRADES, ROOMS } from "@/lib/rooms";
import type { Work } from "@/lib/types";
import { cn } from "@/lib/utils";

type ListKey = "rooms" | "grades" | "levels" | "tags";

interface Option {
  value: string;
  label: string;
  swatch?: string;
}

interface GuidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "right" | "bottom";
  works: Work[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function GuidePanel({ open, onOpenChange, side, works, filters, onChange }: GuidePanelProps) {
  const filtering = isFiltering(filters);
  const resultCount = works.filter((w) => matches(w, filters)).length;

  /** How many works would be lit if this option were the only choice in its group. */
  const facet = (key: ListKey, value: string) =>
    works.filter((w) => matches(w, { ...filters, [key]: [value] } as Filters)).length;

  const toggle = (key: ListKey, value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next } as Filters);
  };

  const groups: { key: ListKey; title: string; options: Option[] }[] = [
    {
      key: "rooms",
      title: "展厅",
      options: ROOMS.map((r) => ({ value: r.id, label: `${r.name} · ${r.theme}`, swatch: r.wall })),
    },
    { key: "grades", title: "年级", options: GRADES.map((g) => ({ value: g, label: g })) },
    { key: "levels", title: "荣誉级别", options: AWARD_LEVELS.map((l) => ({ value: l, label: l })) },
    {
      key: "tags",
      title: "关键词",
      options: tagCounts(works)
        .slice(0, 20)
        .map(([tag]) => ({ value: tag, label: `# ${tag}` })),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "guide tex-paper gap-0 border-0 p-0 text-[#26211a] shadow-[0_0_60px_rgb(0_0_0/0.55)]",
          side === "right" ? "w-[min(440px,100vw)] sm:max-w-[440px]" : "max-h-[86svh] rounded-t-2xl",
        )}
      >
        <SheetHeader className="guide__header">
          <p className="guide__kicker">VISITOR GUIDE · 导览</p>
          <SheetTitle className="guide__title">寻找作品</SheetTitle>
          <SheetDescription className="guide__desc">
            按展厅、年级、荣誉或关键词筛选。符合条件的作品会留在墙上，其余的暂时熄灯。
          </SheetDescription>
        </SheetHeader>

        <div className="guide__body">
          <label className="guide__search">
            <Search className="size-4 shrink-0 opacity-60" aria-hidden />
            <span className="sr-only">搜索</span>
            <Input
              autoFocus={side === "right"}
              type="search"
              value={filters.q}
              onChange={(event) => onChange({ ...filters, q: event.target.value })}
              placeholder="作品名、学生、班级、关键词…"
              className="guide__input"
            />
            {filters.q && (
              <button type="button" className="guide__clear-q" onClick={() => onChange({ ...filters, q: "" })} aria-label="清空搜索">
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </label>

          {groups.map((group) => (
            <fieldset key={group.key} className="guide__group">
              <legend className="guide__legend">{group.title}</legend>
              <div className="guide__chips">
                {group.options.map((option) => {
                  const selected = (filters[group.key] as string[]).includes(option.value);
                  const count = facet(group.key, option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className="guide__chip"
                      aria-pressed={selected}
                      disabled={!selected && count === 0}
                      onClick={() => toggle(group.key, option.value)}
                    >
                      {option.swatch && <span className="guide__swatch" style={{ background: option.swatch }} aria-hidden />}
                      {option.label}
                      <span className="guide__count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <SheetFooter className="guide__footer">
          <p className="guide__result" aria-live="polite">
            {filtering ? (
              <>
                为你点亮 <strong>{resultCount}</strong> 件作品
              </>
            ) : (
              <>常设展 · 共 {works.length} 件作品</>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="guide__btn"
              disabled={!filtering}
              onClick={() => onChange({ q: "", rooms: [], grades: [], levels: [], tags: [] })}
            >
              清除
            </Button>
            <Button className="guide__btn guide__btn--primary" onClick={() => onOpenChange(false)}>
              去墙上看看
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
