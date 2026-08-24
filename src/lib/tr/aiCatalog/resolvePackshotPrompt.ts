import { resolveLlmProvider } from "@/lib/tr/ai/resolveLlmProvider";
import { DEFAULT_PACKSHOT_PROMPT } from "@/lib/tr/fashn/packshot";
import {
  buildPackshotPrompt,
  PACKSHOT_VIEW_PROMPT,
  type PackshotView,
} from "@/lib/tr/aiCatalog/packshotPrompt";
import {
  callGeminiJsonVision,
  fetchImageAsBase64ForVision,
  listingDraftSystemPrompt,
  sanitizeListingDraft,
  type ProductListingDraft,
} from "@/lib/tr/aiCatalog/listingDraft";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
] as const;

export interface ResolvePackshotPromptResult {
  prompt: string;
  usedGemini: boolean;
  geminiExtra: string | null;
  /** Optional listing draft from the same vision call (front preferred). */
  listingDraft: ProductListingDraft | null;
}

/**
 * Build packshot prompt: heuristic base + optional Gemini vision refinement.
 * Never throws — falls back to heuristics when Gemini is missing, slow, or fails.
 * View (front/back) is always in the base prompt even when Gemini fails.
 * When Gemini runs, also tries to draft Turkish title + description (not auto-applied).
 */
export async function resolvePackshotPrompt(input: {
  sourceImageUrl: string;
  title?: string | null;
  category?: string | null;
  view?: PackshotView | null;
  promptExtra?: string | null;
}): Promise<ResolvePackshotPromptResult> {
  const manualExtra = input.promptExtra?.trim() || null;
  let geminiExtra: string | null = null;
  let listingDraft: ProductListingDraft | null = null;
  let usedGemini = false;
  const view = input.view ?? "front";
  const wantListingDraft = view === "front";

  const llm = resolveLlmProvider();
  if (llm?.provider === "gemini") {
    try {
      const image = await Promise.race([
        fetchImageAsBase64ForVision(input.sourceImageUrl),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
      ]);
      if (image) {
        const models = Array.from(new Set([llm.model, ...GEMINI_MODELS]));
        const systemText = wantListingDraft
          ? `${listingDraftSystemPrompt({
              category: input.category,
              includePromptExtra: true,
              viewHint: "front",
            })}

Base packshot style already used: "${DEFAULT_PACKSHOT_PROMPT}"
Known view line: "${PACKSHOT_VIEW_PROMPT.front}"`
          : `You write a short FASHN Packshot staging prompt only.

Return JSON only:
{ "promptExtra": "one short English sentence about packshot staging" }

Rules:
- CRITICAL: This photo is the BACK of the garment. Reinforce rear/back view. Never convert to front.
- Staging only. Do not change product design. Under 180 characters.
- ALWAYS ghost mannequin presentation (invisible form, clothing only). Source may show a hanger or mannequin — do not copy that.
- Never write on-hanger, hanger, visible mannequin, dress form, flat-lay, or floating.
- Match the garment as photographed (cut, length, silhouette). Do not invent missing parts.
- Known view line: "${PACKSHOT_VIEW_PROMPT.back}"
- Base style: "${DEFAULT_PACKSHOT_PROMPT}"
- Category hint: ${input.category?.trim() || "unknown"}`;

        for (const model of models) {
          try {
            const parsed = await Promise.race([
              callGeminiJsonVision({
                apiKey: llm.apiKey,
                model,
                mimeType: image.mimeType,
                data: image.data,
                systemText,
              }),
              new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 25_000),
              ),
            ]);
            if (!parsed) continue;

            const extra =
              (typeof parsed.promptExtra === "string"
                ? parsed.promptExtra.trim()
                : "") ||
              (typeof parsed.prompt === "string" ? parsed.prompt.trim() : "");
            if (extra) {
              geminiExtra = extra;
              usedGemini = true;
            }

            if (wantListingDraft) {
              const draft = sanitizeListingDraft({
                title: typeof parsed.title === "string" ? parsed.title : null,
                description:
                  typeof parsed.description === "string"
                    ? parsed.description
                    : null,
                features: parsed.features,
                category: parsed.category,
              });
              if (draft) {
                listingDraft = draft;
                usedGemini = true;
              }
            }

            if (geminiExtra || listingDraft) break;
          } catch (error) {
            console.warn(
              "[packshot-prompt] Gemini refine failed:",
              error instanceof Error ? error.message : error,
            );
          }
        }
      }
    } catch (error) {
      console.warn(
        "[packshot-prompt] Gemini skipped:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const mergedExtra = [geminiExtra, manualExtra].filter(Boolean).join(" ");

  return {
    prompt: buildPackshotPrompt({
      title: input.title,
      category: input.category,
      view,
      extra: mergedExtra || null,
    }),
    usedGemini,
    geminiExtra,
    listingDraft,
  };
}
