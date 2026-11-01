import "server-only";

import { cacheLife } from "next/cache";
import { extractList, isObj, normalizeCollection, rawArt } from "./normalize";
import { SEED_WORKS } from "./seed";
import type { Work } from "./types";

/**
 * Where the wall's content comes from.
 *
 *   WORKS_SOURCE_URL    JSON endpoint returning the works (see README → 数据源)
 *   WORKS_SOURCE_TOKEN  optional, sent as `Authorization: Bearer …`
 *
 * Without WORKS_SOURCE_URL the gallery shows the demo collection in `seed.ts`.
 * Results are cached and refreshed in the background about once a minute; if a
 * refresh fails, visitors keep seeing the last good collection.
 */

export interface Exhibition {
  works: Work[];
  source: "demo" | "remote";
}

export async function getExhibition(): Promise<Exhibition> {
  "use cache";
  cacheLife("minutes");

  const url = process.env.WORKS_SOURCE_URL?.trim();
  if (!url) return { works: SEED_WORKS, source: "demo" };

  const token = process.env.WORKS_SOURCE_TOKEN?.trim();
  const response = await fetch(url, {
    headers: { accept: "application/json", ...(token ? { authorization: `Bearer ${token}` } : null) },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`作品数据源返回了 ${response.status}：${url}`);

  const list = extractList(await response.json());
  if (!list) throw new Error("作品数据源格式不对：需要一个数组，或包含 works / data / items 数组的对象。");

  const items = list.map((item) => {
    if (!isObj(item)) return item;
    const art = rawArt(item);
    if (art && typeof art.src === "string") art.src = new URL(art.src, url).toString();
    return { ...item, art };
  });
  await measureImages(items);
  return { works: normalizeCollection(items), source: "remote" };
}

/** Fills in width / height / tone for images the source didn't measure. */
async function measureImages(items: unknown[]) {
  const pending = items
    .map((item) => (isObj(item) && isObj(item.art) ? item.art : null))
    .filter((art): art is Record<string, unknown> => {
      if (!art || typeof art.src !== "string" || (art.kind !== undefined && art.kind !== "image")) return false;
      return !(Number(art.width) > 0 && Number(art.height) > 0);
    });
  if (pending.length === 0) return;

  let measure: (typeof import("sharp"))["default"];
  try {
    measure = (await import("sharp")).default;
  } catch {
    return;
  }

  const queue = [...pending];
  const worker = async () => {
    for (let art = queue.shift(); art; art = queue.shift()) {
      try {
        const res = await fetch(String(art.src), { signal: AbortSignal.timeout(8_000) });
        if (!res.ok) continue;
        const buffer = Buffer.from(await res.arrayBuffer());
        const meta = await measure(buffer).metadata();
        const rotated = (meta.orientation ?? 1) >= 5;
        art.width = rotated ? meta.height : meta.width;
        art.height = rotated ? meta.width : meta.height;
        const { data } = await measure(buffer).resize(1, 1, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        art.tone ??= `#${[...data.subarray(0, 3)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      } catch {
        // Unreachable or unreadable images simply hang in a 4:3 frame.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, queue.length) }, worker));
}
