/**
 * Resize Cadde intro stack frames to ~800×1067 JPEG (q82, mozjpeg).
 * Sources stay as lookbook PNGs; outputs go to public/images/tr/intro/.
 *
 *   node scripts/optimize-cadde-intro-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "images", "tr", "intro");

const FRAMES = [
  { src: "public/images/clothes/outfit-07/ootd281.png", out: "stack-01.jpg" },
  { src: "public/images/clothes/outfit-05/ootd279.png", out: "stack-02.jpg" },
  { src: "public/images/clothes/outfit-03/ootd237.png", out: "stack-03.jpg" },
  { src: "public/images/clothes/outfit-06/ootd266.png", out: "stack-04.jpg" },
  { src: "public/images/clothes/outfit-02/ootd236.png", out: "stack-05.jpg" },
  { src: "public/images/clothes/outfit-04/ootd278.png", out: "stack-06.jpg" },
];

fs.mkdirSync(outDir, { recursive: true });

for (const frame of FRAMES) {
  const input = path.join(root, frame.src);
  const output = path.join(outDir, frame.out);
  const before = fs.statSync(input).size;
  await sharp(input)
    .rotate()
    .resize(800, 1067, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true, chromaSubsampling: "4:2:0" })
    .toFile(output);
  const after = fs.statSync(output).size;
  console.log(
    `${frame.out}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`,
  );
}
