"use client";

import { toast } from "sonner";

/** Copies the current address; filters and the open piece live in the query string, so they travel along. */
export async function copyCurrentLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("链接已复制", { description: "当前的筛选条件和正在近观的作品会一起分享出去。" });
  } catch {
    toast.error("没能复制链接", { description: "请直接复制浏览器地址栏中的网址。" });
  }
}
