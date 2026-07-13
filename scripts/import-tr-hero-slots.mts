/**
 * Local import for /tr hero outfit slots (waist-anchored frames).
 *
 * Usage:
 *   1. Drop transparent OR raw photos into tmp/tr-hero-raw/{top,bottom}/
 *      (CLI always assumes ready cutouts — use /tr/dev/hero-import for Photoroom.)
 *   2. npm run tr:import-hero
 *
 * Prefer the local panel at /tr/dev/hero-import for drag-drop + Photoroom.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { normalizeOutfitCutout } from "../src/lib/tr/outfitFrame/normalizeOutfitCutout";
import {
  rewriteHeroSlotPiecesFromDisk,
  writeNormalizedHeroSlot,
} from "../src/lib/tr/outfitFrame/heroSlotFs";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_ROOT = path.join(ROOT, "tmp/tr-hero-raw");

const IMAGE_EXT = new Set([".png", ".webp", ".jpg", ".jpeg"]);

async function listImages(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter(
        (e) => e.isFile() && IMAGE_EXT.has(path.extname(e.name).toLowerCase()),
      )
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function importRole(role: "top" | "bottom"): Promise<number> {
  const rawDir = path.join(RAW_ROOT, role);
  await fs.mkdir(rawDir, { recursive: true });
  const files = await listImages(rawDir);
  let count = 0;

  for (const file of files) {
    const buffer = await fs.readFile(path.join(rawDir, file));
    const normalized = await normalizeOutfitCutout(buffer, role);
    const { filename } = await writeNormalizedHeroSlot({
      role,
      filenameHint: file,
      png: normalized,
    });
    console.log(`  [${role}] ${file} → ${filename}`);
    count += 1;
  }

  return count;
}

async function main() {
  console.log("Importing TR hero outfit slots…");
  console.log(`  raw: tmp/tr-hero-raw/{top,bottom}`);
  console.log(`  panel: /tr/dev/hero-import (Photoroom + drag-drop)`);

  const topCount = await importRole("top");
  const bottomCount = await importRole("bottom");
  const lists = await rewriteHeroSlotPiecesFromDisk();

  console.log(
    `Wrote ${topCount} tops, ${bottomCount} bottoms (disk totals: ${lists.tops.length} / ${lists.bottoms.length}).`,
  );
  if (topCount === 0 && bottomCount === 0) {
    console.log(
      "No raw PNGs found. Use /tr/dev/hero-import or add files under tmp/tr-hero-raw/.",
    );
  }
}

await main();
