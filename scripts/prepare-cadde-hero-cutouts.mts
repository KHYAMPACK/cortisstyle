/**
 * Crop Cadde campaign try-ons to waist-up and PhotoRoom the background.
 *
 *   npx tsx scripts/prepare-cadde-hero-cutouts.mts
 *
 * Reads pose-01-ayla.jpg / pose-02-lila.jpg, writes PNG cutouts.
 * Requires PHOTOROOM_API_KEY in .env.local.
 */

import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { removeGarmentBackground } from "../src/lib/tr/ai/photoroomRemoveBg";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "public/images/tr/hero/campaign");

/** Keep the top of the 3:4 try-on (head → just below waist). */
const WAIST_CROP_RATIO = 0.52;

const JOBS = [
  { src: "pose-01-ayla.jpg", out: "pose-01-ayla.png", label: "Ayla" },
  { src: "pose-02-lila.jpg", out: "pose-02-lila.png", label: "Lila" },
] as const;

function loadEnvLocal() {
  try {
    const raw = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

async function prepareOne(job: (typeof JOBS)[number]): Promise<void> {
  const inputPath = path.join(DIR, job.src);
  const { default: sharp } = await import("sharp");
  const meta = await sharp(inputPath).metadata();
  const width = meta.width ?? 1600;
  const height = meta.height ?? 2133;
  const cropHeight = Math.max(1, Math.round(height * WAIST_CROP_RATIO));

  const waistUp = await sharp(inputPath)
    .extract({ left: 0, top: 0, width, height: cropHeight })
    .jpeg({ quality: 95 })
    .toBuffer();

  console.log(`→ PhotoRoom ${job.label} (${width}×${cropHeight})…`);
  const cutout = await removeGarmentBackground({
    bytes: waistUp,
    filename: job.src.replace(/\.jpg$/i, "-waist.jpg"),
    mimeType: "image/jpeg",
  });

  const padded = await sharp(cutout)
    .ensureAlpha()
    .extend({
      top: 48,
      bottom: 24,
      left: 64,
      right: 64,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const dest = path.join(DIR, job.out);
  await writeFile(dest, padded);
  console.log(`  OK ${path.relative(ROOT, dest)} (${padded.length} bytes)`);
}

async function main() {
  loadEnvLocal();
  if (
    !process.env.PHOTOROOM_API_KEY?.trim() &&
    !process.env.VITE_PHOTOROOM_API_KEY?.trim()
  ) {
    console.error("PHOTOROOM_API_KEY is required.");
    process.exit(1);
  }

  for (const job of JOBS) {
    await prepareOne(job);
  }

  console.log("\nDone. Hero cutouts are PNG waist-up with alpha.");
}

await main();
