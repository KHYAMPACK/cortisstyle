/**
 * Ops: Cadde campaign hero — try-on a black dress onto two house models
 * (Ayla + Lila) and save JPEGs under public/images/tr/hero/campaign/.
 *
 *   npx tsx scripts/generate-cadde-hero-tryons.mts
 *
 * Requires FASHN_API_KEY in .env.local.
 */

import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fashnRunAndWait } from "../src/lib/tr/fashn/client";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public/images/tr/hero/campaign");
const DRESS_PATH = path.join(OUT_DIR, "black-dress-packshot.png");

const ROOM =
  "Zara e-commerce lookbook in a very simple room: plain light off-white wall and a clean matte floor meeting at a clear baseboard line, soft natural side light, gentle realistic shadow. Keep the exact black dress from the product image — true color, fabric, cut, and length. Photoreal skin and cloth, sharp product detail. No beauty retouching, no plastic skin, no heavy makeup, no busy background, no infinite empty void.";

const JOBS = [
  {
    label: "Ayla",
    modelPath: path.join(ROOT, "public/tr/ai-models/studio-ayla.jpg"),
    outName: "pose-01-ayla.jpg",
    prompt: `${ROOM} Medium-long fashion campaign shot, mid-thigh up. Confident editorial pose: weight on one hip, arms slightly away from the body so the dress silhouette reads, looking into the camera with a calm serious expression.`,
  },
  {
    label: "Lila",
    modelPath: path.join(ROOT, "public/tr/ai-models/lilabutik-lila.jpg"),
    outName: "pose-02-lila.jpg",
    prompt: `${ROOM} Medium-long fashion campaign shot, mid-thigh up. Elegant editorial pose: chin slightly turned, arms relaxed slightly away from the torso, garment-forward, looking toward camera, poised and still.`,
  },
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

function fileToDataUri(filePath: string): string {
  const bytes = readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function tryOnOne(
  dressDataUri: string,
  job: (typeof JOBS)[number],
): Promise<void> {
  console.log(`\n→ Try-on ${job.label}…`);
  const run = await fashnRunAndWait({
    modelName: "tryon-max",
    timeoutMs: 180_000,
    inputs: {
      product_image: dressDataUri,
      model_image: fileToDataUri(job.modelPath),
      prompt: job.prompt,
      num_images: 1,
      resolution: "2k",
      generation_mode: "quality",
      output_format: "png",
    },
  });

  if (run.status !== "completed" || !run.outputUrls[0]) {
    throw new Error(
      `${job.label} failed: ${run.error ?? run.status} (credits: ${run.creditsUsed})`,
    );
  }

  const response = await fetch(run.outputUrls[0]);
  if (!response.ok) {
    throw new Error(`${job.label} download failed ${response.status}`);
  }
  const raw = Buffer.from(await response.arrayBuffer());
  const { default: sharp } = await import("sharp");
  const jpeg = await sharp(raw)
    .rotate()
    .resize(1600, 2133, { fit: "cover", position: "top" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
  const dest = path.join(OUT_DIR, job.outName);
  await writeFile(dest, jpeg);
  console.log(
    `  OK ${path.relative(ROOT, dest)} (prediction ${run.predictionId}, credits ${run.creditsUsed})`,
  );
}

async function main() {
  loadEnvLocal();
  if (!process.env.FASHN_API_KEY?.trim()) {
    console.error("FASHN_API_KEY is required.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const dressDataUri = fileToDataUri(DRESS_PATH);

  for (const job of JOBS) {
    await tryOnOne(dressDataUri, job);
  }

  console.log("\nDone. Cadde hero campaign poses are in public/images/tr/hero/campaign/.");
}

await main();
