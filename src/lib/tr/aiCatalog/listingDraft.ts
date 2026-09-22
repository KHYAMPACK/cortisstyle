import { resolveLlmProvider } from "@/lib/tr/ai/resolveLlmProvider";
import {
  sanitizeProductFeatures,
  type TrProductFeatures,
} from "@/lib/tr/catalog/productFeatures";
import {
  getTrCategoryLabel,
  getTrCategoryNavChildren,
  listAssignableTrCategories,
  parseAiCategoryId,
} from "@/lib/tr/fashion/categories";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import {
  dressFeatureOptionId,
  dressGeminiEnumHint,
  decolleteNoneLabel,
  resolveDressFeatureValue,
} from "@/lib/tr/catalog/dressFeatures";
import { hasElbiseLockedConstruction } from "@/lib/tr/aiCatalog/elbiseConstructionLock";
import {
  constructionCatalogFamily,
  isAltGiyimSkirtLeaf,
  parseConstructionShopCategory,
  type ConstructionCatalogFamily,
} from "@/lib/tr/catalog/garmentUploadTypes";
import { constructionPackshotBasePrompt } from "@/lib/tr/fashn/packshot";

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
export function sanitizeListingDraft(
  raw: {
    title?: string | null;
    description?: string | null;
    features?: unknown;
    category?: unknown;
    promptFront?: string | null;
  },
  options?: { family?: ConstructionCatalogFamily | null },
): ProductListingDraft | null {
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

  const draft: ProductListingDraft = {
    title,
    description,
    features: sanitizeProductFeatures(raw.features),
    category: options?.family
      ? parseConstructionShopCategory(raw.category, options.family)
      : parseAiCategoryId(raw.category),
    promptFront: promptFront || null,
  };
  return applyConstructionListingTitle(draft, options?.family);
}

/** Elbise / tops / bottoms title formulas. */
export function formatConstructionProductTitle(input: {
  family: ConstructionCatalogFamily;
  color?: string | null;
  length?: string | null;
  neckline?: string | null;
  fit?: string | null;
  hem?: string | null;
  ornament?: string | null;
  category?: string | null;
}): string | null {
  const color = input.color?.replace(/\s+/g, " ").trim();
  if (!color) return null;

  const length = resolveDressFeatureValue("length", input.length);
  const lengthId = dressFeatureOptionId("length", input.length);
  const neckline = resolveDressFeatureValue("neckline", input.neckline);
  const fit = resolveDressFeatureValue("fit", input.fit);
  const fitId = dressFeatureOptionId("fit", input.fit);
  const hem = resolveDressFeatureValue("hem", input.hem);
  const hemId = dressFeatureOptionId("hem", input.hem);
  const ornament = (input.ornament ?? "").replace(/\s+/g, " ").trim();

  if (input.family === "elbise") {
    const title = [color, length, neckline, "Elbise"]
      .filter(Boolean)
      .join(" ");
    return title.length >= 2 ? title : null;
  }

  const includeFit = Boolean(fit && fitId && fitId !== "regular");
  const includeLength = Boolean(length && lengthId && lengthId !== "normal");
  const parentId = input.family === "alt-giyim" ? "alt-giyim" : "ust-giyim";
  const category =
    getTrCategoryLabel(input.category)?.trim() ||
    (input.category && input.category !== parentId
      ? input.category.trim()
      : "");

  if (input.family === "alt-giyim") {
    const includeHem = Boolean(hem && hemId && hemId !== "duz");
    const skirt = isAltGiyimSkirtLeaf(input.category);
    const title = [
      color,
      ornament,
      includeFit ? fit : "",
      skirt ? (includeLength ? length : "") : includeHem ? hem : "",
      category,
    ]
      .filter(Boolean)
      .join(" ");
    return title.length >= 2 ? title : null;
  }

  const title = [
    color,
    neckline,
    includeFit ? fit : "",
    includeLength ? length : "",
    category,
  ]
    .filter(Boolean)
    .join(" ");
  return title.length >= 2 ? title : null;
}

export function applyConstructionListingTitle<
  T extends {
    title: string;
    features?: TrProductFeatures | null;
    category?: string | null;
  },
>(draft: T, family?: ConstructionCatalogFamily | null): T {
  if (!family) return draft;
  const formatted = formatConstructionProductTitle({
    family,
    color: draft.features?.color,
    length: draft.features?.length,
    neckline: draft.features?.neckline,
    fit: draft.features?.fit,
    hem: draft.features?.neckHem,
    ornament: draft.features?.ornament,
    category: family === "elbise" ? "elbise" : draft.category,
  });
  if (!formatted) return draft;
  return {
    ...draft,
    title: formatted.slice(0, TR_OWNER_PRODUCT_LIMITS.titleMax),
  };
}

const UST_GIYIM_LEAF_HINT = getTrCategoryNavChildren("ust-giyim")
  .map((entry) => `${entry.id} (${entry.label})`)
  .join(", ");

const ALT_GIYIM_LEAF_HINT = getTrCategoryNavChildren("alt-giyim")
  .map((entry) => `${entry.id} (${entry.label})`)
  .join(", ");

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
    fit?: string | null;
    length?: string | null;
    decollete?: string | null;
    rise?: string | null;
    hem?: string | null;
  } | null;
  /** Batch capture: Gemini picks elbise / üst / alt from the photo. */
  inferConstructionFamily?: boolean;
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
  const knownFamily = constructionCatalogFamily(
    input.uploadType,
    input.category,
  );
  const family =
    knownFamily ??
    (input.inferConstructionFamily
      ? null
      : extraImages.length > 0
        ? "elbise"
        : null);
  const rewrite = hasElbiseLockedConstruction(locked, family, input.category);
  const construction = family != null;
  const models = Array.from(new Set([llm.model, ...GEMINI_MODELS]));
  const systemText = rewrite && family
    ? constructionPackshotRewritePrompt(family, {
        neckline: locked!.neckline?.trim() || "",
        sleeves: locked!.sleeves?.trim() || "",
        fit: locked?.fit?.trim() || "",
        length: locked!.length!.trim(),
        decollete: locked?.decollete?.trim() || "",
        rise: locked?.rise?.trim() || "",
        hem: locked?.hem?.trim() || "",
      })
    : construction && family
      ? constructionListingSystemPrompt(family)
      : input.inferConstructionFamily
        ? constructionListingSystemPromptInferFamily()
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
      const draft = sanitizeListingDraft(
        {
          title:
            (typeof parsed.title === "string" ? parsed.title : null) ||
            input.existingTitle ||
            null,
          description:
            (typeof parsed.description === "string"
              ? parsed.description
              : null) ||
            input.existingDescription ||
            null,
          features: parsed.features,
          category: parsed.category ?? (family === "elbise" ? "elbise" : null),
          promptFront:
            typeof parsed.promptFront === "string" ? parsed.promptFront : null,
        },
        {
          family:
            family ??
            constructionCatalogFamily(
              undefined,
              typeof parsed.category === "string" ? parsed.category : null,
            ),
        },
      );
      if (!draft) continue;
      if (rewrite && locked) {
        const neckline = resolveDressFeatureValue("neckline", locked.neckline);
        const sleeves = resolveDressFeatureValue("sleeves", locked.sleeves);
        const fit = resolveDressFeatureValue("fit", locked.fit);
        const length = resolveDressFeatureValue("length", locked.length);
        const decollete = resolveDressFeatureValue(
          "decollete",
          locked.decollete,
        );
        const rise = resolveDressFeatureValue("rise", locked.rise);
        const hem = resolveDressFeatureValue("hem", locked.hem);
        if (neckline) draft.features.neckline = neckline;
        if (sleeves) draft.features.sleeves = sleeves;
        if (fit) draft.features.fit = fit;
        if (length) draft.features.length = length;
        if (rise) draft.features.rise = rise;
        if (hem) draft.features.neckHem = hem;
        if (decollete) draft.features.decollete = decollete;
        else delete draft.features.decollete;
        if (family === "alt-giyim") {
          delete draft.features.neckline;
          delete draft.features.sleeves;
          delete draft.features.decollete;
        }
      }
      const inferredFamily =
        family ?? constructionCatalogFamily(undefined, draft.category);
      if (
        !input.detailImageUrl?.trim() &&
        inferredFamily !== "alt-giyim" &&
        draft.features
      ) {
        draft.features.decollete = decolleteNoneLabel();
      }
      return applyConstructionListingTitle(draft, inferredFamily);
    } catch (error) {
      console.warn(
        "[listing-draft] Gemini failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return null;
}

function constructionListingSystemPromptInferFamily(): string {
  return `You help a Turkish boutique list a garment from on-model photos. The piece may be a DRESS (elbise), a TOP (üst giyim), or a BOTTOM (alt giyim). Detect which from the photos.

Return JSON only:
{
  "title": "Turkish product name",
  "description": "Turkish elegant two-sentence product detail",
  "features": {
    "gender": "Kadın",
    "color": "",
    "neckline": "",
    "sleeves": "",
    "fit": "",
    "length": "",
    "decollete": "",
    "rise": "",
    "hem": "",
    "ornament": "",
    "fabric": "",
    "zipper": "",
    "stretch": "",
    "silhouette": "",
    "composition": ""
  },
  "category": "elbise",
  "promptFront": "English FASHN packshot lock, under 400 characters"
}

category:
- If a one-piece dress: always "elbise".
- If a top: a shop leaf under üst giyim: ${UST_GIYIM_LEAF_HINT}. Never parent "ust-giyim". Never elbise.
- If a bottom: a shop leaf under alt giyim: ${ALT_GIYIM_LEAF_HINT}. Never parent "alt-giyim". Never elbise.
- Never aksesuar or ev.

title:
- Dress: [Renk] [Boy] [Yaka] Elbise. Example: "Siyah Midi Straplez Elbise".
- Top: [Renk] [Yaka] [Kalıp if not Regular] [Boy if not Normal] [Kategori]. Example: "Kahverengi Polo yaka Oversize Crop Bluz".
- Bottom pants: [Renk] [Detay if photographed] [Kalıp if not Regular] [Paça if not Düz] [Kategori]; etek: [Renk] [Detay if photographed] [Kalıp if not Regular] [Boy if not Normal] [Kategori].
- Omit Regular kalıp, Düz paça, Normal boy. Do not put Bel in the title.

description:
- Exactly 2 Turkish sentences. Use only what is photographed. Do not invent zipper, stretch %, or fiber unless visible.

features — use these enum ids (omit key if not visible / not that garment):
Dress or top:
${dressGeminiEnumHint("elbise")}
Top kalıp:
${dressGeminiEnumHint("ust-giyim")}
Bottom:
${dressGeminiEnumHint("alt-giyim")}
- color: Turkish color name from the photo.
- gender: almost always Kadın.
- composition: ONLY if a care label with fiber % is readable. Never invent percentages.
- hem is paça (leg opening) for pants only. Omit hem for etek and for dresses/tops.
- ornament: short Turkish phrase only if a distinctive trim is clearly photographed. Omit if none.
- Omit neckline/sleeves/decollete on bottoms. Omit rise/hem on dresses and tops.

promptFront:
- Dress: staging + construction lock for ONE front ghost-mannequin packshot. Base look: "${constructionPackshotBasePrompt("elbise")}"
- Top or bottom: staging + construction lock for ONE top-down flat-lay packshot (not ghost mannequin). Base look: "${constructionPackshotBasePrompt("ust-giyim")}" for tops, "${constructionPackshotBasePrompt("alt-giyim")}" for bottoms.
- Name the exact construction from ALL photos. Do not invent missing parts. Do not describe a person.
`;
}

function constructionListingSystemPrompt(
  family: ConstructionCatalogFamily,
): string {
  const bottom = family === "alt-giyim";
  const top = family === "ust-giyim";
  const garment = bottom
    ? "BOTTOM (alt giyim — etek, pantolon, eşofman)"
    : top
      ? "TOP (üst giyim — bluz, gömlek, tişört, ceket…)"
      : "DRESS (elbise)";
  const nameHint = bottom
    ? `Exact formula: pants [Renk] [Detay if photographed] [Kalıp if not Regular] [Paça if not Düz] [Kategori]; etek [Renk] [Detay if photographed] [Kalıp if not Regular] [Boy if not Normal] [Kategori]. Examples: "Siyah İnci işlemeli Wide İspanyol Pantolon", "Mavi Slim Pantolon", "Siyah İnci işlemeli Slim Midi Etek", "Siyah Midi Etek". Detay is a short visible ornament only (inci işlemeli, dantel, pile) — omit when none. Omit Regular kalıp, Düz paça, Normal boy. Do not put Bel in the title. Use the shop-leaf label (Etek, Pantolon, Eşofman), not "alt giyim". Eşofman is joggers only — not a tracksuit set. No extra adjectives, brand, or fabric unless it is the color.`
    : top
      ? `Exact formula: [Renk] [Yaka] [Kalıp if not Regular] [Boy if not Normal] [Kategori]. Examples: "Kahverengi Polo yaka Oversize Crop Bluz", "Beyaz Yuvarlak yaka Gömlek" (omit Regular kalıp and Normal boy). Use the shop-leaf label (Bluz, Gömlek, Tişört…), not "üst giyim". No extra adjectives, brand, or fabric unless it is the color.`
      : `Exact formula: [Renk] [Boy] [Yaka] Elbise. Example: "Siyah Midi Straplez Elbise". Use chip labels (Midi, Maxi, Polo yaka…). No extra adjectives, brand, or fabric unless it is the color.`;
  const categoryRule = bottom
    ? `- Must be a shop leaf under alt giyim: ${ALT_GIYIM_LEAF_HINT}
- Never return parent "alt-giyim". Never return elbise or üst giyim.`
    : top
      ? `- Must be a shop leaf under üst giyim: ${UST_GIYIM_LEAF_HINT}
- Never return parent "ust-giyim". Never return elbise.`
      : '- Always "elbise".';
  const noSkirt = bottom
    ? "Do not invent missing parts. Do not turn pants into a dress or a skirt into pants. Do not invent a matching top. Do not describe a person."
    : top
      ? "Do not invent missing parts. Do not turn the top into a dress or a skirt. Do not describe a back packshot or a person."
      : "Do not invent missing parts. Do not turn the dress into a skirt. Do not describe a back packshot or a person.";
  const featuresBlock = bottom
    ? `"gender": "Kadın",
    "color": "",
    "rise": "",
    "fit": "",
    "length": "",
    "hem": "",
    "ornament": "",
    "fabric": "",
    "zipper": "",
    "stretch": "",
    "composition": ""`
    : `"gender": "Kadın",
    "color": "",
    "neckline": "",
    "sleeves": "",
    "fit": "",
    "length": "",
    "decollete": "",
    "fabric": "",
    "zipper": "",
    "stretch": "",
    "silhouette": "",
    "composition": ""`;
  const promptRules = bottom
    ? `- English. Staging + construction lock for ONE top-down flat-lay packshot (not ghost mannequin).
- Base look: "${constructionPackshotBasePrompt(family)}"
- Name the exact rise (bel), fit, paça, and hem length from ALL photos.
- Do not describe a ghost mannequin, worn volume, or a person.`
    : top
      ? `- English. Staging + construction lock for ONE top-down flat-lay packshot (not ghost mannequin).
- Base look: "${constructionPackshotBasePrompt(family)}"
- Name the exact neckline, sleeve length, and hem length from ALL photos.
- sleeves is independent of yaka: polo/shirt pieces often have short or long sleeves; straplez is usually kolsuz. Do not assume sleeveless from yaka.
- If sleeveless, say so via sleeves=kolsuz. If short/three-quarter/long sleeves are visible, lock that. Do not invent or remove sleeves, off-shoulder drape, or arm flaps.
- Do not describe a ghost mannequin, worn volume, or a person.`
    : `- English. Staging + construction lock for ONE front ghost-mannequin packshot.
- Base look: "${constructionPackshotBasePrompt(family)}"
- Name the exact neckline, sleeve length, and hem length from ALL photos.
- sleeves is independent of yaka: polo/shirt pieces often have short or long sleeves; straplez is usually kolsuz. Do not assume sleeveless from yaka.
- If sleeveless, say so via sleeves=kolsuz. If short/three-quarter/long sleeves are visible, lock that. Do not invent or remove sleeves, off-shoulder drape, or arm flaps.`;
  return `You help a Turkish boutique list a ${garment} from on-model photos.

Return JSON only:
{
  "title": "Turkish product name",
  "description": "Turkish elegant two-sentence product detail",
  "features": {
    ${featuresBlock}
  },
  "category": ${bottom ? '"pantolon"' : top ? '"bluz"' : '"elbise"'},
  "promptFront": "English FASHN packshot lock, under 400 characters"
}

title:
- ${nameHint}

description:
- Exactly 2 Turkish sentences. Use only what is photographed (${bottom ? "rise, length, paça, fabric look" : "neckline, sleeves, length, hem/lace, straps, fabric look"}).
- Do not invent zipper, stretch %, or fiber unless visible.

features — use these enum ids (omit key if not visible):
${dressGeminiEnumHint(family)}
- color: Turkish color name from the photo.
- gender: almost always Kadın.
- composition: ONLY if a care label with fiber % is readable. Never invent percentages.
- Fermuar/kapama IS allowed as zipper. Omit if you cannot see a zipper.
${bottom ? "- hem is paça (leg opening). Omit hem when the garment is an etek.\n- ornament: short Turkish phrase only if a distinctive trim is clearly photographed (inci işlemeli, dantel, taşlı, pile). Omit if none. Not fabric, not kalıp, not paça." : ""}

category:
${categoryRule}

promptFront:
${promptRules}
- ${noSkirt}
`;
}

function constructionPackshotRewritePrompt(
  family: ConstructionCatalogFamily,
  locked: {
    neckline: string;
    sleeves: string;
    fit: string;
    length: string;
    decollete: string;
    rise: string;
    hem: string;
  },
): string {
  const bottom = family === "alt-giyim";
  const top = family === "ust-giyim";
  const garment = bottom ? "bottom" : top ? "top" : "dress";
  const categoryExample = bottom ? '"pantolon"' : top ? '"bluz"' : '"elbise"';
  const categoryRule = bottom
    ? `- Must be a shop leaf under alt giyim: ${ALT_GIYIM_LEAF_HINT}. Never parent alt-giyim.`
    : top
      ? `- Must be a shop leaf under üst giyim: ${UST_GIYIM_LEAF_HINT}. Never parent ust-giyim.`
      : '- Always "elbise".';
  const titleHint = bottom
    ? `Formula: pants [Renk] [Detay if photographed] [Kalıp if not Regular] [Paça if not Düz] [Kategori]; etek [Renk] [Detay if photographed] [Kalıp if not Regular] [Boy if not Normal] [Kategori]. Example: "Siyah İnci işlemeli Wide İspanyol Pantolon". Omit Regular kalıp, Düz paça, Normal boy. Do not put Bel in the title. Keep existing ornament if still visible.`
    : top
      ? `Formula: [Renk] [Yaka] [Kalıp if not Regular] [Boy if not Normal] [Kategori]. Example: "Kahverengi Polo yaka Oversize Crop Bluz". Omit Regular kalıp and Normal boy.`
      : `Formula: [Renk] [Boy] [Yaka] Elbise. Example: "Siyah Midi Straplez Elbise".`;
  const lockedLines = bottom
    ? `- Length (boy): ${locked.length}
- Rise (bel): ${locked.rise || "not set"}
- Fit (kalıp): ${locked.fit || "not set"}
- Hem / paça: ${locked.hem || "not set (etek)"}`
    : `- Neckline (yaka): ${locked.neckline}
- Sleeves (kol): ${locked.sleeves}
- Length (boy): ${locked.length}
${top ? `- Fit (kalıp): ${locked.fit || "not set"}` : ""}
${locked.decollete ? `- Decollete/detail: ${locked.decollete}` : "- Decollete: none specified — do not invent cleavage or extra cutouts."}`;
  const featuresJson = bottom
    ? `"rise": "",
    "fit": "",
    "length": "",
    "hem": "",
    "ornament": ""`
    : `"neckline": "",
    "sleeves": "",
    "fit": "",
    "length": "",
    "decollete": ""`;
  const promptRules = bottom
    ? `- Base look: "${constructionPackshotBasePrompt(family)}"
- Must match the LOCKED boy, bel, kalıp, and paça exactly.
- Top-down flat lay only — no ghost mannequin, no person.
- Do not turn pants into a dress or a skirt into pants.`
    : top
      ? `- Base look: "${constructionPackshotBasePrompt(family)}"
- Must match the LOCKED yaka, kol, and boy exactly.
- Sleeves come only from the locked kol chip — do not infer sleeveless from yaka (polo can have sleeves).
- Top-down flat lay only — no ghost mannequin, no person.
- Do not invent off-shoulder drape or arm flaps.`
    : `- Base look: "${constructionPackshotBasePrompt(family)}"
- Must match the LOCKED yaka, kol, and boy exactly.
- Sleeves come only from the locked kol chip — do not infer sleeveless from yaka (polo can have sleeves).
- Do not invent off-shoulder drape or arm flaps.`;
  return `You rewrite ONLY the English FASHN packshot prompt for this exact ${garment}.

LOCKED construction — do not contradict, do not invent a different construction:
${lockedLines}

Return JSON only:
{
  "title": "short Turkish product name",
  "description": "two Turkish sentences",
  "promptFront": "English FASHN packshot lock, under 400 characters",
  "category": ${categoryExample},
  "features": {
    ${featuresJson}
  }
}

title:
- ${titleHint}
- Use the LOCKED labels. Color from the photo. No extra adjectives.

category:
${categoryRule}

promptFront:
${promptRules}
- Do not describe a person or a back packshot.
`;
}

/**
 * Color name only — used for extra color variants so construction chips
 * and the packshot base prompt stay locked to the primary.
 */
export async function draftGarmentColorFromImage(input: {
  sourceImageUrl: string;
  backImageUrl?: string | null;
}): Promise<string | null> {
  const llm = resolveLlmProvider();
  if (llm?.provider !== "gemini") return null;

  const image = await Promise.race([
    fetchImageAsBase64ForVision(input.sourceImageUrl),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
  ]);
  if (!image) return null;

  const extraImages: Array<{ mimeType: string; data: string; label: string }> =
    [];
  if (input.backImageUrl?.trim()) {
    const fetched = await Promise.race([
      fetchImageAsBase64ForVision(input.backImageUrl),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 15_000)),
    ]);
    if (fetched) {
      extraImages.push({ ...fetched, label: "Image 2 BACK ON MODEL" });
    }
  }

  const models = Array.from(new Set([llm.model, ...GEMINI_MODELS]));
  const systemText = `You name the garment color from on-model photos for a Turkish boutique.

Return JSON only:
{ "color": "Turkish color name" }

Rules:
- color is a short Turkish name (Siyah, Beyaz, Lacivert, Vizon, Bej, Mavi…).
- Name the fabric color, not the model's skin or the studio background.
- One or two words. No adjectives like "şık" or "yazlık".`;

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
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 20_000)),
      ]);
      if (!parsed) continue;
      const color =
        typeof parsed.color === "string"
          ? parsed.color.replace(/\s+/g, " ").trim().slice(0, 40)
          : "";
      if (color) return color;
    } catch (error) {
      console.warn(
        "[listing-draft] color-only Gemini failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }
  return null;
}
