import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="gallery-notice">
      <span className="curtain__seal" aria-hidden>
        萤
      </span>
      <p className="gallery-notice__kicker">404 · 此处无门</p>
      <h1 className="gallery-notice__title">这间展厅不存在</h1>
      <p className="gallery-notice__text">你推开的这扇门后面只有一面空墙。回到长廊，所有的作品都在那里。</p>
      <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "gallery-btn gallery-btn--primary")}>
        <ArrowLeft className="size-4" aria-hidden />
        回到展厅
      </Link>
    </main>
  );
}
