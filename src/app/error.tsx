"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GalleryError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const detail = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : null;

  return (
    <main className="gallery-notice">
      <span className="curtain__seal" aria-hidden>
        萤
      </span>
      <p className="gallery-notice__kicker">TEMPORARILY CLOSED · 临时闭馆</p>
      <h1 className="gallery-notice__title">展品暂时没能送达</h1>
      <p className="gallery-notice__text">
        我们没能从作品数据源取回今天的展品。可能是网络开了个小差，也可能是数据源正在维护——稍后再来，灯会重新亮起。
      </p>
      {detail && <p className="gallery-notice__detail">{detail}</p>}
      <Button variant="ghost" className="gallery-btn gallery-btn--primary" onClick={retry}>
        <RotateCcw className="size-4" aria-hidden />
        再试一次
      </Button>
    </main>
  );
}
