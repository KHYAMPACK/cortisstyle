/**
 * One-time migration: move lilabutik's iyzico credentials from env vars into
 * the encrypted tr_boutique_integrations row (Phase 1 §3 dual-read cleanup,
 * P1-T6 in docs/platform-roadmap.md).
 *
 * Run locally — never in CI or committed anywhere. Reads real production
 * secrets and never prints them; only logs success/failure and non-secret
 * metadata (row id, boutique slug).
 *
 * 1. Pull real production secrets into a gitignored local file:
 *      vercel env pull .env.production.local --environment=production
 * 2. Dry run first (validates everything, writes nothing):
 *      npx tsx scripts/migrate-lilabutik-iyzico-credentials.mts --env-file .env.production.local --dry-run
 * 3. Then actually write:
 *      npx tsx scripts/migrate-lilabutik-iyzico-credentials.mts --env-file .env.production.local
 * 4. Verify a real or sandbox lilabutik checkout still starts correctly.
 * 5. Only then tell the agent to remove the legacy fallback in
 *    src/lib/tr/payments/registry.ts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { encryptIntegrationCredentials, decryptIntegrationCredentials } from "../src/lib/tr/payments/credentialEncryption";
import { getServerServiceSupabase } from "../src/lib/supabase/supabaseServer";

const BOUTIQUE_SLUG = "lilabutik";
const DEFAULT_LIVE_BASE = "https://api.iyzipay.com";

/** Same shape as IYZICO_BUYER_PROTECTION_BY_SLUG.lilabutik in payments/registry.ts — not a secret, already committed. */
const LILABUTIK_BUYER_PROTECTION = {
  token: "649afd5a-7bd3-4529-8d26-3c6f6247c984",
  position: "bottomLeft",
  mobilePosition: "header",
  ideaSoft: false,
  pwi: true,
};

function loadEnvFile(path: string) {
  const raw = readFileSync(resolve(process.cwd(), path), "utf8");
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
    process.env[key] = value;
  }
}

function arg(name: string): string | null {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1]?.trim() || null;
}

function mask(value: string): string {
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}${"*".repeat(value.length - 8)}${value.slice(-4)}`;
}

async function main() {
  const envFile = arg("env-file") ?? ".env.local";
  const dryRun = process.argv.includes("--dry-run");

  console.log(`Loading env from ${envFile}${dryRun ? " (dry run)" : ""}...`);
  loadEnvFile(envFile);

  const apiKey = process.env.TR_LILABUTIK_IYZICO_API_KEY?.trim() ?? "";
  const secretKey = process.env.TR_LILABUTIK_IYZICO_SECURITY_KEY?.trim() ?? "";
  const baseUrl =
    process.env.TR_LILABUTIK_IYZICO_BASE_URL?.trim().replace(/\/$/, "") ||
    DEFAULT_LIVE_BASE;
  const encryptionKey = process.env.TR_INTEGRATION_ENCRYPTION_KEY?.trim() ?? "";

  const missing: string[] = [];
  if (!apiKey) missing.push("TR_LILABUTIK_IYZICO_API_KEY");
  if (!secretKey) missing.push("TR_LILABUTIK_IYZICO_SECURITY_KEY");
  if (!encryptionKey) missing.push("TR_INTEGRATION_ENCRYPTION_KEY");
  if (missing.length > 0) {
    console.error(`Missing required env vars in ${envFile}: ${missing.join(", ")}`);
    console.error(
      "Pull real production values first: vercel env pull .env.production.local --environment=production",
    );
    process.exit(1);
  }

  console.log("Found credentials (masked for confirmation only):");
  console.log(`  apiKey:    ${mask(apiKey)}`);
  console.log(`  secretKey: ${mask(secretKey)}`);
  console.log(`  baseUrl:   ${baseUrl}`);

  const supabase = getServerServiceSupabase();
  if (!supabase) {
    console.error(
      "Supabase service role is not configured (need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the same env file).",
    );
    process.exit(1);
  }

  const { data: boutique, error: boutiqueError } = await supabase
    .from("tr_boutiques")
    .select("id, slug")
    .eq("slug", BOUTIQUE_SLUG)
    .maybeSingle();
  if (boutiqueError) throw boutiqueError;
  if (!boutique) {
    console.error(`No boutique row found for slug "${BOUTIQUE_SLUG}".`);
    process.exit(1);
  }

  const { data: existing } = await supabase
    .from("tr_boutique_integrations")
    .select("id")
    .eq("boutique_id", boutique.id)
    .eq("provider", "iyzico")
    .maybeSingle();
  if (existing) {
    console.log(
      `A tr_boutique_integrations row already exists for ${BOUTIQUE_SLUG}/iyzico (id ${existing.id}). Not overwriting — delete it first if you intend to replace it.`,
    );
    process.exit(1);
  }

  const credentialsEncrypted = encryptIntegrationCredentials({
    apiKey,
    secretKey,
    baseUrl,
  });

  // Round-trip check before writing anything, so a bad encryption key fails loudly here, not silently at checkout time.
  const roundTrip = decryptIntegrationCredentials<{
    apiKey: string;
    secretKey: string;
    baseUrl?: string;
  }>(credentialsEncrypted);
  if (roundTrip.apiKey !== apiKey || roundTrip.secretKey !== secretKey) {
    console.error("Round-trip encryption check failed — aborting without writing.");
    process.exit(1);
  }
  console.log("Round-trip encryption check passed.");

  if (dryRun) {
    console.log("Dry run — would insert a tr_boutique_integrations row now. Re-run without --dry-run to write it.");
    return;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tr_boutique_integrations")
    .insert({
      boutique_id: boutique.id,
      provider: "iyzico",
      mode: "live",
      enabled: true,
      credentials_encrypted: credentialsEncrypted,
      metadata: LILABUTIK_BUYER_PROTECTION,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  console.log(`Wrote tr_boutique_integrations row ${inserted.id} for ${BOUTIQUE_SLUG}/iyzico.`);
  console.log(
    "Next: verify a real or sandbox lilabutik checkout still starts correctly, then tell the agent to remove the legacy env-var fallback in src/lib/tr/payments/registry.ts.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
