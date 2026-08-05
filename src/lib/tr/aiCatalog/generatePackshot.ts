import { resolvePackshotPrompt } from "@/lib/tr/aiCatalog/resolvePackshotPrompt";
import type { PackshotView } from "@/lib/tr/aiCatalog/packshotPrompt";
import type { ProductListingDraft } from "@/lib/tr/aiCatalog/listingDraft";
import { generateFashnPackshot } from "@/lib/tr/fashn/packshot";
import { logTrAiUsageEvent } from "@/lib/tr/aiUsage";

export interface GenerateOwnerPackshotInput {
  userId: string;
  boutiqueId: string;
  productId?: string | null;
  /** Prefer marketplace cutout; fall back to original. */
  sourceImageUrl: string;
  title?: string | null;
  category?: string | null;
  /** front = slot 0, back = slot 1 — always applied in base prompt */
  view?: PackshotView | null;
  promptExtra?: string | null;
  /** When set (from prepare-packshot), skips a second Gemini round-trip. */
  prompt?: string | null;
  listingDraft?: ProductListingDraft | null;
  numImages?: number;
}

export async function generateOwnerPackshot(input: GenerateOwnerPackshotInput) {
  const view = input.view ?? "front";
  const providedPrompt = input.prompt?.trim() || null;

  let prompt = providedPrompt;
  let usedGemini = Boolean(providedPrompt);
  let geminiExtra: string | null = null;
  let listingDraft: ProductListingDraft | null = input.listingDraft ?? null;

  if (!prompt) {
    const resolved = await resolvePackshotPrompt({
      sourceImageUrl: input.sourceImageUrl,
      title: input.title,
      category: input.category,
      view,
      promptExtra: input.promptExtra,
    });
    prompt = resolved.prompt;
    usedGemini = resolved.usedGemini;
    geminiExtra = resolved.geminiExtra;
    listingDraft = resolved.listingDraft ?? listingDraft;
  }

  const result = await generateFashnPackshot({
    productImageUrl: input.sourceImageUrl,
    prompt,
    numImages: input.numImages ?? 1,
    userId: input.userId,
    boutiqueId: input.boutiqueId,
  });

  await logTrAiUsageEvent({
    boutiqueId: input.boutiqueId,
    productId: input.productId ?? null,
    kind: "packshot",
    provider: "fashn",
    fashnPredictionId: result.predictionId ?? null,
    creditsUsed: result.creditsUsed,
    status: result.status,
    error: result.error ?? null,
    meta: {
      title: input.title ?? null,
      category: input.category ?? null,
      view,
      usedGemini,
      geminiExtra,
      prompt,
      listingDraft,
      promptPrecomputed: Boolean(providedPrompt),
    },
  });

  return {
    ...result,
    listingDraft,
  };
}
