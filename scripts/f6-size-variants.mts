/**
 * F6: a boutique's sizes and colour groups become variants (docs/foundation-no-hardcode-plan.md).
 *
 * Reads the boutique (read-only), plans the migration with the checklist answers, prints a
 * dry-run report and, when nothing blocks, writes the SQL for Mert to apply by hand:
 *
 *   npx tsx scripts/f6-size-variants.mts --env-file .env.production.local
 *
 * Options:
 *   --boutique <slug>     default lilabutik
 *   --answers <file>      default supabase/f6/<slug>-answers.json
 *   --snapshot <file>     read the products from a JSON array of tr_products rows instead
 *                         of the database (also needs --boutique-id)
 *   --boutique-id <uuid>  with --snapshot
 *
 * Writes supabase/f6/<slug>-report.md always, and supabase/patch_<slug>_variants.sql +
 * supabase/patch_<slug>_variants_rollback.sql when the plan has no blocking problem.
 * The SQL checks that nothing changed since the snapshot; re-run this right before applying.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  checkSizeMigration,
  planSizeMigration,
  sizeMigrationSql,
  type MigrationAnswers,
  type MigrationProduct,
  type SizeMigrationPlan,
} from "../src/lib/tr/variants/sizeMigration";

function arg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function loadEnvFile(path: string) {
  const raw = readFileSync(resolve(process.cwd(), path), "utf8");
  for (const line of raw.split(/\r\n|\n|\r/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    if (key.startsWith("export ")) key = key.slice(7).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    process.env[key] = value.replace(/\\n/g, "\n");
  }
}

type Row = Record<string, unknown>;

const COLUMNS =
  "id, title, description, description_html, status, created_at, product_type, stock, sizes, size_stocks, features, images, marketplace_images, lifestyle_images";

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function toProduct(row: Row): MigrationProduct {
  const stocks: Record<string, number> = {};
  if (row.size_stocks && typeof row.size_stocks === "object") {
    for (const [size, n] of Object.entries(row.size_stocks as Row)) stocks[size] = Number(n) || 0;
  }
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: typeof row.description === "string" ? row.description : null,
    descriptionHtml: typeof row.description_html === "string" ? row.description_html : null,
    status: String(row.status),
    createdAt: String(row.created_at),
    productType: String(row.product_type),
    stock: Number(row.stock) || 0,
    sizes: strings(row.sizes),
    sizeStocks: stocks,
    features: (row.features && typeof row.features === "object" ? row.features : {}) as MigrationProduct["features"],
    images: strings(row.images),
    marketplaceImages: strings(row.marketplace_images),
    lifestyleImages: strings(row.lifestyle_images),
  };
}

async function readFromDatabase(slug: string) {
  const { getServerServiceSupabase } = await import("../src/lib/supabase/supabaseServer");
  const supabase = getServerServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured (use --env-file).");
  const boutique = await supabase.from("tr_boutiques").select("id").eq("slug", slug).single();
  if (boutique.error) throw boutique.error;
  const boutiqueId = String(boutique.data.id);
  const products = await supabase.from("tr_products").select(COLUMNS).eq("boutique_id", boutiqueId);
  if (products.error) throw products.error;
  const types = await supabase.from("tr_variant_types").select("name").eq("boutique_id", boutiqueId);
  if (types.error) throw types.error;
  return {
    boutiqueId,
    rows: (products.data ?? []) as Row[],
    typeNames: (types.data ?? []).map((type) => String(type.name)),
  };
}

function report(slug: string, plan: SizeMigrationPlan, products: readonly MigrationProduct[], snapshotAt: string) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: string[] = [];
  const blocking = plan.problems.filter((problem) => problem.level === "block");
  lines.push(`# F6 dry run: ${slug}`, "", `Snapshot: ${snapshotAt}.`, "");
  lines.push(
    blocking.length > 0
      ? `**${blocking.length} blocking problem(s): no SQL written.** Fill in the answers file and run again.`
      : "**Nothing blocks.** The SQL is in `supabase/`.",
    "",
  );
  const where = (problem: SizeMigrationPlan["problems"][number]) =>
    problem.productId ? ` (${byId.get(problem.productId)?.title ?? problem.productId})` : "";
  if (plan.problems.length > 0) {
    lines.push("## Problems", "");
    for (const problem of plan.problems) {
      lines.push(`- ${problem.level === "block" ? "**BLOCK**" : "warn"}: ${problem.message}${where(problem)}`);
    }
    lines.push("");
  }
  lines.push("## Variant types", "");
  for (const type of plan.types) {
    lines.push(`- **${type.name}** (${type.role}): ${type.values.map((value) => value.label).join(", ")}`);
  }
  lines.push("");

  const merged = plan.products.filter((entry) => entry.merge);
  lines.push(`## Merged colour groups (${merged.length})`, "");
  for (const entry of merged) {
    const merge = entry.merge!;
    lines.push(`### ${merge.title}`, "");
    lines.push(`Survives: ${byId.get(entry.productId)!.title} (\`${entry.productId}\`). Photos: ${merge.images.length}. Stock: ${entry.stock}.`, "");
    for (const id of merge.memberIds) {
      const member = byId.get(id)!;
      const into = plan.merges.find((m) => m.productId === id);
      lines.push(`- ${member.title} — ${into ? `hidden, redirects with ?renk=${into.color}` : "survivor"}`);
    }
    lines.push("", `Variants: ${entry.variants.map((variant) => `${variant.label} (${variant.stock})`).join(", ")}`, "");
  }

  const single = plan.products.filter((entry) => !entry.merge);
  lines.push(`## Products moving to size variants (${single.length})`, "");
  for (const entry of single) {
    const product = byId.get(entry.productId)!;
    lines.push(
      `- ${product.title}${product.status === "hidden" ? " _(gizli)_" : ""}: ${entry.variants.map((variant) => `${variant.label}=${variant.stock}`).join(" ")}`,
    );
  }
  lines.push("");
  if (plan.untouched.length > 0) {
    lines.push(`## Left as they are (no sizes): ${plan.untouched.map((id) => byId.get(id)!.title).join(", ")}`, "");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const slug = (arg("boutique") ?? "lilabutik").trim().toLowerCase();
  const envFile = arg("env-file");
  if (envFile) loadEnvFile(envFile);
  const answersPath = arg("answers") ?? `supabase/f6/${slug}-answers.json`;
  const answers: MigrationAnswers = existsSync(answersPath)
    ? (JSON.parse(readFileSync(answersPath, "utf8")) as MigrationAnswers)
    : {};

  const snapshotPath = arg("snapshot");
  const source = snapshotPath
    ? {
        boutiqueId: arg("boutique-id") ?? "",
        rows: JSON.parse(readFileSync(snapshotPath, "utf8")) as Row[],
        typeNames: [] as string[],
      }
    : await readFromDatabase(slug);
  if (!/^[0-9a-f-]{36}$/i.test(source.boutiqueId)) throw new Error("--boutique-id is required with --snapshot.");

  const snapshotAt = new Date().toISOString();
  const products = source.rows.map(toProduct).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const plan = planSizeMigration({
    products,
    answers,
    existingTypeNames: source.typeNames,
    newId: randomUUID,
  });
  plan.problems.push(...checkSizeMigration(plan, products));

  mkdirSync("supabase/f6", { recursive: true });
  const reportPath = `supabase/f6/${slug}-report.md`;
  writeFileSync(reportPath, report(slug, plan, products, snapshotAt));
  console.log(`Report: ${reportPath}`);

  const blocking = plan.problems.filter((problem) => problem.level === "block");
  if (blocking.length > 0) {
    for (const problem of blocking) console.log(`BLOCK: ${problem.message}`);
    process.exitCode = 1;
    return;
  }
  const sql = sizeMigrationSql({ plan, products, boutiqueId: source.boutiqueId, boutiqueSlug: slug, snapshotAt });
  writeFileSync(`supabase/patch_${slug}_variants.sql`, sql.apply);
  writeFileSync(`supabase/patch_${slug}_variants_rollback.sql`, sql.rollback);
  console.log(`SQL: supabase/patch_${slug}_variants.sql (+ _rollback.sql)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
