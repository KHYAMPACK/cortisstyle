/**
 * Ops: generate platform studio model refs (Ayla / Deniz) via FASHN model-create
 * and save under public/tr/ai-models/.
 *
 * Usage:
 *   npm run tr:generate-studio-models
 *
 * Requires FASHN_API_KEY in env (or .env.local).
 */

import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateFashnModelCreate } from "../src/lib/tr/fashn/modelCreate";
import {
  STUDIO_AYLA_MODEL_CREATE_PROMPT,
  STUDIO_DENIZ_MODEL_CREATE_PROMPT,
  STUDIO_MODEL_CREATE_ASPECT_RATIO,
} from "../src/lib/tr/aiModel/prompts";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/tr/ai-models");

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
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

async function generateOne(
  label: string,
  prompt: string,
  filename: string,
): Promise<void> {
  console.log(`\n→ Generating ${label}…`);
  const result = await generateFashnModelCreate({
    prompt,
    aspectRatio: STUDIO_MODEL_CREATE_ASPECT_RATIO,
    numImages: 1,
  });

  if (result.status !== "succeeded" || !result.imageUrls[0]) {
    throw new Error(
      `${label} failed: ${result.error ?? result.status} (credits: ${result.creditsUsed})`,
    );
  }

  const dest = path.join(OUT_DIR, filename);
  const response = await fetch(result.imageUrls[0]);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status}`);
  }
  const raw = Buffer.from(await response.arrayBuffer());
  // Normalize to JPEG regardless of FASHN output format
  const { default: sharp } = await import("sharp");
  const jpeg = await sharp(raw).jpeg({ quality: 92 }).toBuffer();
  await writeFile(dest, jpeg);
  console.log(
    `  OK ${path.relative(ROOT, dest)} (prediction ${result.predictionId}, credits ${result.creditsUsed})`,
  );
}

async function main() {
  if (!process.env.FASHN_API_KEY?.trim()) {
    console.error("FASHN_API_KEY is required.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  await generateOne(
    "Ayla (woman)",
    STUDIO_AYLA_MODEL_CREATE_PROMPT,
    "studio-ayla.jpg",
  );
  await generateOne(
    "Deniz (man)",
    STUDIO_DENIZ_MODEL_CREATE_PROMPT,
    "studio-deniz.jpg",
  );

  console.log(
    "\nDone. Registry falls back to /tr/ai-models/studio-ayla.jpg and studio-deniz.jpg.",
  );
}

await main();
