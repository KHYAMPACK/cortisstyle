/**
 * Rename minamore → minimora tenant (slug + domain typo fix).
 * Usage: npx tsx scripts/fix-minimora-domain.mts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getServerServiceSupabase } from "../src/lib/supabase/supabaseServer";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

async function main() {
  loadEnvLocal();
  const supabase = getServerServiceSupabase();
  if (!supabase) throw new Error("Supabase service role is not configured.");

  const { data: existing, error: findError } = await supabase
    .from("tr_boutiques")
    .select("id, slug, custom_domain")
    .in("slug", ["minamore", "minimora"]);

  if (findError) throw findError;

  const minamore = existing?.find((row) => row.slug === "minamore");
  const minimora = existing?.find((row) => row.slug === "minimora");

  if (minimora) {
    const { error } = await supabase
      .from("tr_boutiques")
      .update({
        custom_domain: "minimora.shop",
        name: "Minimora",
        legal_name: "Minimora",
        logo_url: "/tr/boutiques/minimora/logo.png",
      })
      .eq("id", minimora.id);
    if (error) throw error;
    console.log(`Updated minimora (${minimora.id}) → minimora.shop`);
    return;
  }

  if (!minamore) {
    console.error("No minamore or minimora boutique found. Run seed-minimora.mts first.");
    process.exit(1);
  }

  const { error } = await supabase
    .from("tr_boutiques")
    .update({
      slug: "minimora",
      name: "Minimora",
      legal_name: "Minimora",
      custom_domain: "minimora.shop",
      logo_url: "/tr/boutiques/minimora/logo.png",
      instagram_handle: "minimora",
    })
    .eq("id", minamore.id);

  if (error) throw error;
  console.log(`Renamed minamore → minimora (${minamore.id}), domain minimora.shop`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
