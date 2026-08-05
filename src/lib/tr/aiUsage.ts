import { getServiceSupabase } from "@/lib/supabaseAdmin";

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
      meta: input.meta ?? {},
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
