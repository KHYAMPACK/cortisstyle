import { getServiceSupabase } from "@/lib/supabaseAdmin";
import {
  boutiqueCreditsForUsageKind,
  creditsToTry,
  creditsToUsd,
} from "@/lib/tr/fashion/aiCatalog/uploadCostHints";

export type TrAiUsageKind = "packshot" | "tryon" | "bg_removal";
export type TrAiUsageProvider = "fashn" | "photoroom";
export type TrAiUsageStatus = "succeeded" | "failed" | "not_configured";

export interface TrAiUsageEventInput {
  boutiqueId?: string | null;
  productId?: string | null;
  kind: TrAiUsageKind;
  provider: TrAiUsageProvider;
  fashnPredictionId?: string | null;
  creditsUsed?: number | null;
  status: TrAiUsageStatus;
  error?: string | null;
  meta?: Record<string, unknown>;
}

export interface TrBoutiqueAiCreditSummary {
  period: "month";
  periodLabel: string;
  /** Owner-facing Cortisstyle credits (not raw FASHN). */
  creditsUsed: number;
  creditsUsd: number;
  creditsTry: number;
  packshotCredits: number;
  modelCredits: number;
  eventCount: number;
}

/**
 * Best-effort insert — never throws into the generate path.
 * Requires supabase/patch_tr_ai_usage.sql applied.
 */
export async function logTrAiUsageEvent(
  input: TrAiUsageEventInput,
): Promise<void> {
  try {
    const admin = getServiceSupabase();
    if (!admin) return;

    const boutiqueCredits = boutiqueCreditsForUsageKind(input.kind);

    const { error } = await admin.from("tr_ai_usage_events").insert({
      boutique_id: input.boutiqueId?.trim() || null,
      product_id: input.productId?.trim() || null,
      kind: input.kind,
      provider: input.provider,
      fashn_prediction_id: input.fashnPredictionId?.trim() || null,
      credits_used:
        typeof input.creditsUsed === "number" && Number.isFinite(input.creditsUsed)
          ? input.creditsUsed
          : null,
      status: input.status,
      error: input.error?.trim() || null,
      meta: {
        ...(input.meta ?? {}),
        boutiqueCredits,
      },
    });

    if (error) {
      console.warn("[tr-ai-usage] insert failed:", error.message);
    }
  } catch (error) {
    console.warn(
      "[tr-ai-usage] insert error:",
      error instanceof Error ? error.message : error,
    );
  }
}

function startOfMonthIstanbulIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  // Approximate month start as UTC midnight of Istanbul calendar date.
  return `${year}-${month}-01T00:00:00.000Z`;
}

function monthPeriodLabel(): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

/**
 * Light boutique credit usage for the current Istanbul calendar month.
 */
export async function getBoutiqueAiCreditSummary(
  boutiqueId: string,
): Promise<TrBoutiqueAiCreditSummary> {
  const empty: TrBoutiqueAiCreditSummary = {
    period: "month",
    periodLabel: monthPeriodLabel(),
    creditsUsed: 0,
    creditsUsd: 0,
    creditsTry: 0,
    packshotCredits: 0,
    modelCredits: 0,
    eventCount: 0,
  };

  const admin = getServiceSupabase();
  if (!admin) return empty;

  const { data, error } = await admin
    .from("tr_ai_usage_events")
    .select("kind, status, meta")
    .eq("boutique_id", boutiqueId)
    .eq("status", "succeeded")
    .gte("created_at", startOfMonthIstanbulIso())
    .limit(2000);

  if (error) {
    console.warn("[tr-ai-usage] summary failed:", error.message);
    return empty;
  }

  let packshotCredits = 0;
  let modelCredits = 0;
  let eventCount = 0;

  for (const row of data ?? []) {
    const kind = row.kind as TrAiUsageKind;
    if (kind !== "packshot" && kind !== "tryon" && kind !== "bg_removal") {
      continue;
    }
    eventCount += 1;
    const meta =
      row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
        ? (row.meta as Record<string, unknown>)
        : {};
    const fromMeta =
      typeof meta.boutiqueCredits === "number" &&
      Number.isFinite(meta.boutiqueCredits)
        ? meta.boutiqueCredits
        : boutiqueCreditsForUsageKind(kind);

    if (kind === "packshot") packshotCredits += fromMeta;
    else if (kind === "tryon") modelCredits += fromMeta;
  }

  const creditsUsed = Math.round((packshotCredits + modelCredits) * 100) / 100;

  return {
    period: "month",
    periodLabel: monthPeriodLabel(),
    creditsUsed,
    creditsUsd: creditsToUsd(creditsUsed),
    creditsTry: creditsToTry(creditsUsed),
    packshotCredits: Math.round(packshotCredits * 100) / 100,
    modelCredits: Math.round(modelCredits * 100) / 100,
    eventCount,
  };
}
