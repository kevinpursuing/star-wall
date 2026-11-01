#!/usr/bin/env node
// Convert source artwork (jpg/png/webp) into gallery-ready WebP files.
// Usage: node scripts/optimize-images.mjs <sourceDir> [outDir=public/works] [maxEdge=1400]
// Prints width/height/dominant color for each file so you can paste them into the seed data.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [, , srcDir, outDir = "public/works", maxEdgeArg = "1400"] = process.argv;
if (!srcDir) {
  console.error("Usage: node scripts/optimize-images.mjs <sourceDir> [outDir] [maxEdge]");
  process.exit(1);
}
const maxEdge = Number(maxEdgeArg);
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
const report = {};
for (const file of files) {
  const name = path.parse(file).name;
  const input = sharp(path.join(srcDir, file)).rotate();
  const out = path.join(outDir, `${name}.webp`);
  const info = await input
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(out);
  const { data } = await sharp(out).resize(1, 1, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const hex = `#${[...data.subarray(0, 3)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  report[name] = { src: `/${path.relative("public", out)}`, width: info.width, height: info.height, tone: hex, kb: Math.round(info.size / 1024) };
}
console.log(JSON.stringify(report, null, 2));
