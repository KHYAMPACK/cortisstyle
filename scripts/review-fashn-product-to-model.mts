/**
 * Review-only: FASHN product-to-model with a photo-style image_prompt.
 * Not wired into the catalog. No face_reference.
 *
 *   npx tsx scripts/review-fashn-product-to-model.mts
 */
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fashnRunAndWait } from "../src/lib/tr/fashn/client";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp/fashn-product-to-model-review");
const PRODUCT_PATH = path.join(
  ROOT,
  "tmp/nano-packshot-review/navy-dress-packshot.jpg",
);
const STYLE_PATH = path.join(OUT_DIR, "photo-style.png");

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

async function main() {
  loadEnvLocal();
  if (!process.env.FASHN_API_KEY?.trim()) {
    console.error("FASHN_API_KEY is required.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  console.log("→ product-to-model (navy dress + flash studio style, no face)…");
  const run = await fashnRunAndWait({
    modelName: "product-to-model",
    timeoutMs: 180_000,
    inputs: {
      product_image: fileToDataUri(PRODUCT_PATH),
      image_prompt: fileToDataUri(STYLE_PATH),
      prompt:
        "Hard on-camera flash fashion photo, sharp dark drop shadow on a plain light gray studio wall, three-quarter crop from head to mid-thigh, model facing camera, relaxed editorial pose. Photoreal catalog photo. Keep the exact navy polo dress from the product image. No watermark, no text overlay, no logos, no crown icon.",
      aspect_ratio: "3:4",
      resolution: "1k",
      generation_mode: "fast",
      num_images: 1,
      output_format: "png",
    },
  });

  if (run.status !== "completed" || !run.outputUrls[0]) {
    throw new Error(
      `Failed: ${run.error ?? run.status} (credits: ${run.creditsUsed})`,
    );
  }

  const response = await fetch(run.outputUrls[0]);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status}`);
  }
  const raw = Buffer.from(await response.arrayBuffer());
  const dest = path.join(OUT_DIR, "navy-dress-flash-studio.png");
  await writeFile(dest, raw);
  console.log(
    `OK ${path.relative(ROOT, dest)} (prediction ${run.predictionId}, credits ${run.creditsUsed})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
