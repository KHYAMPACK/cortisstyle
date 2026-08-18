/**
 * Review-only: 1-credit tryon-max (fast + 1k) of one Lila packshot
 * onto the three photography-style Lila plates. Not wired.
 *
 *   npx tsx scripts/review-lila-style-tryons.mts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fashnRunAndWait } from "../src/lib/tr/fashn/client";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "tmp/lila-photo-styles-review");

const STYLE_PLATES = [
  { slug: "blinds", file: "lila-style-blinds.jpg" },
  { slug: "flash", file: "lila-style-flash.jpg" },
  { slug: "window", file: "lila-style-window.jpg" },
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

type ProductRow = {
  id: string;
  title: string;
  category: string | null;
  marketplace_images: string[] | null;
  images: string[] | null;
};

function firstUrl(values: string[] | null | undefined): string | null {
  const url = values?.find((item) => item?.trim());
  return url?.trim() || null;
}

function pickPackshotProduct(rows: ProductRow[]): ProductRow | null {
  const withPackshot = rows.filter((row) => firstUrl(row.marketplace_images));
  if (withPackshot.length === 0) return null;
  const dresses = withPackshot.filter((row) =>
    (row.category ?? "").toLowerCase().includes("dress"),
  );
  return dresses[0] ?? withPackshot[0] ?? null;
}

async function main() {
  loadEnvLocal();
  if (!process.env.FASHN_API_KEY?.trim()) {
    console.error("FASHN_API_KEY is required.");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: boutique, error: boutiqueError } = await supabase
    .from("tr_boutiques")
    .select("id, slug, name")
    .eq("slug", "lilabutik")
    .maybeSingle();

  if (boutiqueError) throw boutiqueError;
  if (!boutique?.id) {
    throw new Error("lilabutik boutique not found.");
  }

  const { data: products, error: productError } = await supabase
    .from("tr_products")
    .select("id, title, category, marketplace_images, images, status")
    .eq("boutique_id", boutique.id)
    .eq("status", "available")
    .order("sort_order", { ascending: true });

  if (productError) throw productError;

  const product = pickPackshotProduct((products ?? []) as ProductRow[]);
  const packshotUrl = firstUrl(product?.marketplace_images);
  if (!product || !packshotUrl) {
    throw new Error("No lilabutik product with a marketplace packshot.");
  }

  console.log(
    `Using ${product.title} (${product.category ?? "uncategorized"}) ${product.id}`,
  );
  console.log(`Packshot ${packshotUrl}`);

  await mkdir(OUT_DIR, { recursive: true });

  const packshotResponse = await fetch(packshotUrl);
  if (!packshotResponse.ok) {
    throw new Error(`Packshot download failed ${packshotResponse.status}`);
  }
  const packshotBytes = Buffer.from(await packshotResponse.arrayBuffer());
  const packshotExt = packshotUrl.toLowerCase().includes(".jpg") ? "jpg" : "png";
  await writeFile(path.join(OUT_DIR, `source-packshot.${packshotExt}`), packshotBytes);
  const packshotDataUri = `data:image/${packshotExt === "jpg" ? "jpeg" : "png"};base64,${packshotBytes.toString("base64")}`;

  for (const plate of STYLE_PLATES) {
    const modelPath = path.join(OUT_DIR, plate.file);
    console.log(`\n→ tryon-max fast/1k on ${plate.slug}…`);
    const run = await fashnRunAndWait({
      modelName: "tryon-max",
      timeoutMs: 180_000,
      inputs: {
        product_image: packshotDataUri,
        model_image: fileToDataUri(modelPath),
        num_images: 1,
        resolution: "1k",
        generation_mode: "fast",
        output_format: "png",
      },
    });

    if (run.status !== "completed" || !run.outputUrls[0]) {
      throw new Error(
        `${plate.slug} failed: ${run.error ?? run.status} (credits: ${run.creditsUsed})`,
      );
    }

    const response = await fetch(run.outputUrls[0]);
    if (!response.ok) {
      throw new Error(`${plate.slug} download failed ${response.status}`);
    }
    const dest = path.join(OUT_DIR, `tryon-${plate.slug}.png`);
    await writeFile(dest, Buffer.from(await response.arrayBuffer()));
    console.log(
      `  OK ${path.relative(ROOT, dest)} (prediction ${run.predictionId}, credits ${run.creditsUsed})`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
