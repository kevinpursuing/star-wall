import { authorLine, dotDate, leadClass, pad2 } from "@/lib/format";
import type { Work } from "@/lib/types";
import { AwardSeal } from "./award-seal";

/** The wall label (展签) beside every piece. */
export function MuseumLabel({ work, no, id }: { work: Work; no: number; id: string }) {
  const klass = leadClass(work);
  const meta = [work.medium, dotDate(work.date)].filter(Boolean);
  return (
    <figcaption className="label" id={id}>
      <p className="label__no">No. {pad2(no)}</p>
      <h3 className="label__title">{work.title}</h3>
      <p className="label__who">
        {authorLine(work)}
        {klass && (
          <>
            <span className="mx-1 text-[#a89d89]">·</span>
            {klass}
          </>
        )}
      </p>
      {meta.length > 0 && (
        <p className="label__meta">
          {meta.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </p>
      )}
      {work.award && (
        <div className="label__award">
          <AwardSeal award={work.award} size={26} />
          <span>
            {work.award.event}
            <span className="whitespace-nowrap">
              {work.award.event ? " · " : ""}
              {work.award.prize}
            </span>
          </span>
        </div>
      )}
    </figcaption>
  );
}
