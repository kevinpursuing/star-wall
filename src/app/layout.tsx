import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Long_Cang, Noto_Serif_SC } from "next/font/google";
import { SvgDefs } from "@/components/brand/seal-mark";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/site.config";
import "./globals.css";

const serifSC = Noto_Serif_SC({
  variable: "--font-serif-sc",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const longCang = Long_Cang({
  variable: "--font-long-cang",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} · ${site.exhibition} — ${site.school}${site.kind}`,
    template: `%s · ${site.name}`,
  },
  description: `${site.tagline}${site.school}${site.kind}「${site.exhibition}」${site.season}：科创、美术、文学、实践与体育五个展厅的学生成果。`,
};

export const viewport: Viewport = {
  themeColor: "#0e0d0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${serifSC.variable} ${cormorant.variable} ${longCang.variable} antialiased`}>
      <body>
        <SvgDefs />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
