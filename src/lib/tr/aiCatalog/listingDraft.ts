import { resolveLlmProvider } from "@/lib/tr/ai/resolveLlmProvider";
import {
  sanitizeProductFeatures,
  type TrProductFeatures,
} from "@/lib/tr/catalog/productFeatures";
import {
  listAssignableTrCategories,
  parseAiCategoryId,
} from "@/lib/tr/catalog/categories";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
] as const;

export interface ProductListingDraft {
  title: string;
  description: string;
  features: TrProductFeatures;
  category?: string | null;
}

function geminiGenerateUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function extractJsonText(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return raw.slice(start, end + 1).trim();
  }
  return raw.trim();
}

export async function fetchImageAsBase64ForVision(
  imageUrl: string,
): Promise<{ mimeType: string; data: string } | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const mimeType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ||
      "image/jpeg";
    if (!mimeType.startsWith("image/")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > 4 * 1024 * 1024) return null;
    return { mimeType, data: buffer.toString("base64") };
  } catch {
    return null;
  }
}

/** Strip marketing fluff and clamp to product limits. */
export function sanitizeListingDraft(raw: {
  title?: string | null;
  description?: string | null;
  features?: unknown;
  category?: unknown;
}): ProductListingDraft | null {
  let title = (raw.title ?? "")
    .replace(/\s+/g, " ")
    .replace(/^["“”']+|["“”']+$/g, "")
    .trim();
  let description = (raw.description ?? "")
    .replace(/\s+/g, " ")
    .replace(/^["“”']+|["“”']+$/g, "")
    .trim();

  // Drop empty / placeholder junk
  if (!title || title.length < 2) return null;

  title = title.slice(0, TR_OWNER_PRODUCT_LIMITS.titleMax);
  description = description.slice(0, TR_OWNER_PRODUCT_LIMITS.descriptionMax);

  // Prefer keeping a short description; allow empty if model returned only a title
  return {
    title,
    description,
    features: sanitizeProductFeatures(raw.features),
    category: parseAiCategoryId(raw.category),
  };
}

const ASSIGNABLE_CATEGORY_HINT = listAssignableTrCategories()
  .map((entry) => `${entry.id} (${entry.label})`)
  .join(", ");

const LISTING_VOICE_RULES = `Turkish product listing copy for a small boutique owner panel.

title:
- Short product name a shop would use (e.g. "Siyah İncili Crop", "Beyaz Keten Gömlek").
- Color + garment type + one concrete detail if visible. Max ~40 chars.
- No brand invented. No ALL CAPS. No emoji.

description:
- Exactly 2 sentences in Turkish. One paragraph, no bullets.
- Boutique lookbook voice: physical details (fabric look, cut, neckline, length) woven with silhouette and how it wears — elegant, not a WhatsApp note.
- Tone like: "Saten dokulu fularıyla klasik tişört formunu zarafetle güncelleyen tasarım, V yaka hattıyla estetik bir silüet çiziyor." Then a second sentence on movement / occasion, still concrete.
- Use the garment as photographed. Do not invent scarves, prints, or materials you cannot see.
- No emoji. No ALL CAPS. No exclamation spam. No "keşfedin", "benzersiz", "mükemmel", "vazgeçilmez", "gardırobunuzun", "her tarza uyum".
- Do not invent care instructions, sizes, or fiber percentages.

features (Turkish values, omit a key if you cannot see it):
- gender: Kadın, Erkek, or Unisex.
- fit: short cut/fit if visible (Regular, Relaxed, Slim, Oversize, Straight…).
- color: Turkish color name from the photo.
- neckHem: collar and/or hem/paça detail if visible.
- fabric: visible fabric look (e.g. "Hafif keten dokulu dokuma").
- composition: ONLY if a care label with fiber % is readable. Never invent percentages.
- NEVER include üretim yeri, etiket, kapama, cep, or manken ölçüsü.

category:
- One shop leaf id from: ${ASSIGNABLE_CATEGORY_HINT}
- You may return the Turkish label instead (e.g. "Bluz"). Never return a parent group (üst giyim, alt giyim) except Elbise.`;

export function listingDraftSystemPrompt(input: {
  category?: string | null;
  includePromptExtra?: boolean;
  viewHint?: "front" | "back" | null;
}): string {
  const category = input.category?.trim() || "unknown";
  const view =
    input.viewHint === "back"
      ? "Source is the BACK of the garment."
      : input.viewHint === "front"
        ? "Source is the FRONT of the garment."
        : "Prefer the main visible face of the garment.";

  if (input.includePromptExtra) {
    return `You help a fashion ecommerce packshot + listing pipeline.

Return JSON only:
{
  "promptExtra": "one short English sentence about packshot staging only",
  "title": "Turkish product name",
  "description": "Turkish elegant two-sentence product detail",
  "features": {
    "gender": "",
    "fit": "",
    "color": "",
    "neckHem": "",
    "fabric": "",
    "composition": ""
  },
  "category": "bluz"
}

${LISTING_VOICE_RULES}

promptExtra rules:
- English, under 180 characters.
- Staging only. ALWAYS ghost mannequin (invisible form, clothing only). Do not change the product design.
- Source photos may show a hanger or mannequin — do not copy that. Never write on-hanger, hanger, visible mannequin, dress form, flat-lay, or floating.
- Match the garment as photographed (cut, length, silhouette). Do not invent missing parts.
- Respect garment view: ${view}

Category hint: ${category}`;
  }

  return `You write Turkish product listing fields from a garment photo.

Return JSON only:
{
  "title": "Turkish product name",
  "description": "Turkish elegant two-sentence product detail",
  "features": {
    "gender": "",
    "fit": "",
    "color": "",
    "neckHem": "",
    "fabric": "",
    "composition": ""
  },
  "category": "bluz"
}

${LISTING_VOICE_RULES}

${view}
Category hint: ${category}`;
}

export async function callGeminiJsonVision(params: {
  apiKey: string;
  model: string;
  mimeType: string;
  data: string;
  systemText: string;
}): Promise<Record<string, unknown> | null> {
  const response = await fetch(geminiGenerateUrl(params.model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": params.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: params.systemText },
            {
              inlineData: {
                mimeType: params.mimeType,
                data: params.data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        // 2.5 Flash defaults to thinking; without disabling it, small
        // maxOutputTokens budgets can be spent on thoughts → empty JSON.
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini (${params.model}): ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
  };

  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    console.warn(
      `[listing-draft] Gemini (${params.model}) empty text:`,
      candidate?.finishReason ?? "no_candidate",
    );
    return null;
  }

  try {
    return JSON.parse(extractJsonText(text)) as Record<string, unknown>;
  } catch {
    console.warn(
      `[listing-draft] Gemini (${params.model}) JSON parse failed:`,
      text.slice(0, 120),
    );
    return null;
  }
}

/**
 * On-demand product title/description from a catalog image.
 * Returns null when Gemini is missing or fails.
 */
export async function draftProductListingFromImage(input: {
  sourceImageUrl: string;
  category?: string | null;
}): Promise<ProductListingDraft | null> {
  const llm = resolveLlmProvider();
  if (llm?.provider !== "gemini") return null;

  const image = await Promise.race([
    fetchImageAsBase64ForVision(input.sourceImageUrl),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
  ]);
  if (!image) return null;

  const models = Array.from(new Set([llm.model, ...GEMINI_MODELS]));
  const systemText = listingDraftSystemPrompt({
    category: input.category,
    includePromptExtra: false,
    viewHint: "front",
  });

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
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 25_000)),
      ]);
      if (!parsed) continue;
      const draft = sanitizeListingDraft({
        title: typeof parsed.title === "string" ? parsed.title : null,
        description:
          typeof parsed.description === "string" ? parsed.description : null,
        features: parsed.features,
        category: parsed.category,
      });
      if (draft) return draft;
    } catch (error) {
      console.warn(
        "[listing-draft] Gemini failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return null;
}
