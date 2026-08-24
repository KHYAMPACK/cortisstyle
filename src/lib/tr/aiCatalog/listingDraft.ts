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
import { dressGeminiEnumHint, resolveDressFeatureValue } from "@/lib/tr/catalog/dressFeatures";
import { hasElbiseLockedConstruction } from "@/lib/tr/aiCatalog/elbiseConstructionLock";
import { ELBISE_PACKSHOT_PROMPT } from "@/lib/tr/fashn/packshot";

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
  /** Elbise: English FASHN lock for the front packshot only. */
  promptFront?: string | null;
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
  promptFront?: string | null;
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

  const promptFront = (raw.promptFront ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);

  return {
    title,
    description,
    features: sanitizeProductFeatures(raw.features),
    category: parseAiCategoryId(raw.category),
    promptFront: promptFront || null,
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
  extraImages?: Array<{ mimeType: string; data: string; label?: string }>;
}): Promise<Record<string, unknown> | null> {
  const imageParts: Array<Record<string, unknown>> = [];
  imageParts.push({
    text: params.extraImages?.length ? "Image 1 FRONT ON MODEL" : "",
  });
  imageParts.push({
    inlineData: {
      mimeType: params.mimeType,
      data: params.data,
    },
  });
  (params.extraImages ?? []).forEach((image, index) => {
    const label = image.label?.trim() || `Image ${index + 2}`;
    imageParts.push({ text: label });
    imageParts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  });

  const parts = [{ text: params.systemText }, ...imageParts.filter((part) => {
    if ("text" in part && typeof part.text === "string" && !part.text.trim()) {
      return false;
    }
    return true;
  })];

  const response = await fetch(geminiGenerateUrl(params.model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": params.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts,
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
  backImageUrl?: string | null;
  detailImageUrl?: string | null;
  uploadType?: string | null;
  existingTitle?: string | null;
  existingDescription?: string | null;
  lockedConstruction?: {
    neckline?: string | null;
    sleeves?: string | null;
    length?: string | null;
    decollete?: string | null;
  } | null;
}): Promise<ProductListingDraft | null> {
  const llm = resolveLlmProvider();
  if (llm?.provider !== "gemini") return null;

  const image = await Promise.race([
    fetchImageAsBase64ForVision(input.sourceImageUrl),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
  ]);
  if (!image) return null;

  const extraImages: Array<{ mimeType: string; data: string; label: string }> =
    [];
  for (const extra of [
    { url: input.backImageUrl, label: "Image 2 BACK ON MODEL" },
    { url: input.detailImageUrl, label: "Image 3 DECOLLETE DETAIL ON MODEL" },
  ]) {
    if (!extra.url?.trim()) continue;
    const fetched = await Promise.race([
      fetchImageAsBase64ForVision(extra.url),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
    ]);
    if (fetched) extraImages.push({ ...fetched, label: extra.label });
  }

  const locked = input.lockedConstruction;
  const rewrite = hasElbiseLockedConstruction(locked);
  const elbise = extraImages.length > 0 || input.uploadType === "elbise";
  const models = Array.from(new Set([llm.model, ...GEMINI_MODELS]));
  const systemText = rewrite
    ? dressPackshotRewritePrompt({
        neckline: locked!.neckline!.trim(),
        sleeves: locked!.sleeves!.trim(),
        length: locked!.length!.trim(),
        decollete: locked?.decollete?.trim() || "",
      })
    : elbise
      ? dressListingSystemPrompt()
      : listingDraftSystemPrompt({
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
          extraImages,
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 25_000)),
      ]);
      if (!parsed) continue;
      const draft = sanitizeListingDraft({
        title:
          (typeof parsed.title === "string" ? parsed.title : null) ||
          input.existingTitle ||
          null,
        description:
          (typeof parsed.description === "string" ? parsed.description : null) ||
          input.existingDescription ||
          null,
        features: parsed.features,
        category: parsed.category ?? (elbise || rewrite ? "elbise" : null),
        promptFront:
          typeof parsed.promptFront === "string" ? parsed.promptFront : null,
      });
      if (!draft) continue;
      if (rewrite && locked) {
        const neckline = resolveDressFeatureValue("neckline", locked.neckline);
        const sleeves = resolveDressFeatureValue("sleeves", locked.sleeves);
        const length = resolveDressFeatureValue("length", locked.length);
        const decollete = resolveDressFeatureValue(
          "decollete",
          locked.decollete,
        );
        if (neckline) draft.features.neckline = neckline;
        if (sleeves) draft.features.sleeves = sleeves;
        if (length) draft.features.length = length;
        if (decollete) draft.features.decollete = decollete;
        else delete draft.features.decollete;
      }
      return draft;
    } catch (error) {
      console.warn(
        "[listing-draft] Gemini failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return null;
}

function dressListingSystemPrompt(): string {
  return `You help a Turkish boutique list a DRESS (elbise) from on-model photos.

Return JSON only:
{
  "title": "Turkish product name",
  "description": "Turkish elegant two-sentence product detail",
  "features": {
    "gender": "Kadın",
    "color": "",
    "neckline": "",
    "sleeves": "",
    "length": "",
    "decollete": "",
    "fabric": "",
    "zipper": "",
    "stretch": "",
    "silhouette": "",
    "composition": ""
  },
  "category": "elbise",
  "promptFront": "English FASHN packshot lock, under 400 characters"
}

title:
- Color + elbise + one concrete visible detail. Max ~40 chars. No invented brand.

description:
- Exactly 2 Turkish sentences. Use only what is photographed (neckline, sleeves, length, hem/lace, straps, fabric look).
- Do not invent zipper, stretch %, or fiber unless visible.

features — use these enum ids (omit key if not visible):
${dressGeminiEnumHint()}
- color: Turkish color name from the photo.
- gender: almost always Kadın.
- composition: ONLY if a care label with fiber % is readable. Never invent percentages.
- Fermuar/kapama IS allowed as zipper. Omit if you cannot see a zipper.

promptFront:
- English. Staging + construction lock for ONE front ghost-mannequin packshot.
- Base look: "${ELBISE_PACKSHOT_PROMPT}"
- Name the exact neckline, sleeve length, and hem length from ALL photos.
- sleeves is independent of yaka: polo/shirt dresses often have short or long sleeves; straplez is usually kolsuz. Do not assume sleeveless from yaka.
- If sleeveless, say so via sleeves=kolsuz. If short/three-quarter/long sleeves are visible, lock that. Do not invent or remove sleeves, off-shoulder drape, or arm flaps.
- Do not invent missing parts. Do not turn the dress into a skirt. Do not describe a back packshot or a person.
`;
}

function dressPackshotRewritePrompt(locked: {
  neckline: string;
  sleeves: string;
  length: string;
  decollete: string;
}): string {
  const detay = locked.decollete
    ? `- Decollete/detail: ${locked.decollete}`
    : "- Decollete: none specified — do not invent cleavage or extra cutouts.";
  return `You rewrite ONLY the English FASHN packshot prompt for this exact dress.

LOCKED construction — do not contradict, do not invent a different neckline, sleeves, or length:
- Neckline (yaka): ${locked.neckline}
- Sleeves (kol): ${locked.sleeves}
- Length (boy): ${locked.length}
${detay}

Return JSON only:
{
  "title": "short Turkish product name",
  "description": "two Turkish sentences",
  "promptFront": "English FASHN packshot lock, under 400 characters",
  "category": "elbise",
  "features": {
    "neckline": "",
    "sleeves": "",
    "length": "",
    "decollete": ""
  }
}

promptFront:
- Base look: "${ELBISE_PACKSHOT_PROMPT}"
- Must match the LOCKED yaka, kol, and boy exactly.
- Sleeves come only from the locked kol chip — do not infer sleeveless from yaka (polo can have sleeves).
- Do not invent off-shoulder drape or arm flaps.
- Do not describe a person or a back packshot.
`;
}
