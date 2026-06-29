const GEMINI_VISION_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

const VALID_CATEGORIES = [
  "tops",
  "bottoms",
  "waist",
  "outerwear",
  "shoes",
  "bags",
  "eyewear",
  "headwear",
  "accessories",
] as const;

type ClothingCategory = (typeof VALID_CATEGORIES)[number];

export interface GarmentVisionResult {
  productName: string;
  category: ClothingCategory;
  brand: string;
  itemId: string;
}

const VISION_PROMPT = `Analyze this garment image for a luxury fashion lookbook CMS.
Return JSON only with these keys:
- "productName": concise editorial product title (e.g. "Grey Zip Hoodie", "Slim Straight Denim")
- "brand": visible brand if readable on the garment or tags, otherwise empty string
- "category": exactly one of: ${VALID_CATEGORIES.join(", ")}
- "itemId": URL slug, lowercase kebab-case from brand + product (e.g. "gap-grey-zip-hoodie"), no spaces

Pick the single best category for collage layering. Shoes, bags, eyewear, and headwear should only be used when clearly that type.`;

const VISION_JSON_SCHEMA = {
  type: "object",
  properties: {
    productName: { type: "string" },
    brand: { type: "string" },
    category: { type: "string", enum: [...VALID_CATEGORIES] },
    itemId: { type: "string" },
  },
  required: ["productName", "brand", "category", "itemId"],
} as const;

function getGeminiApiKey(): string {
  const apiKey =
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  return apiKey;
}

function slugifyItemId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `item-${Date.now()}`;
}

function isCategory(value: string): value is ClothingCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(value);
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

function readJsonStringField(text: string, ...keys: string[]): string {
  for (const key of keys) {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "i"));
    if (match?.[1]) {
      return match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
    }
  }
  return "";
}

function readString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeVisionPayload(raw: unknown): GarmentVisionResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Vision model returned invalid JSON");
  }

  const record = raw as Record<string, unknown>;
  const productName = readString(record, "productName", "product_name", "name");
  const brand = readString(record, "brand");
  const categoryRaw =
    readString(record, "category", "garmentCategory", "garment_category").toLowerCase() ||
    "tops";
  const category = isCategory(categoryRaw) ? categoryRaw : "tops";

  if (!productName) {
    throw new Error("Vision model did not return a product name");
  }

  const itemIdRaw = readString(record, "itemId", "item_id", "slug");
  const itemIdSource = itemIdRaw || (brand ? `${brand}-${productName}` : productName);

  return {
    productName,
    category,
    brand,
    itemId: slugifyItemId(itemIdSource),
  };
}

function parseVisionResponseText(text: string): GarmentVisionResult {
  const cleaned = extractJsonText(text);

  try {
    return normalizeVisionPayload(JSON.parse(cleaned));
  } catch {
    const productName = readJsonStringField(cleaned, "productName", "product_name", "name");
    const brand = readJsonStringField(cleaned, "brand");
    const categoryRaw =
      readJsonStringField(cleaned, "category", "garmentCategory", "garment_category") || "tops";
    const itemIdRaw = readJsonStringField(cleaned, "itemId", "item_id", "slug");

    if (productName) {
      const category = isCategory(categoryRaw.toLowerCase())
        ? (categoryRaw.toLowerCase() as ClothingCategory)
        : "tops";
      const itemIdSource = itemIdRaw || (brand ? `${brand}-${productName}` : productName);
      return {
        productName,
        category,
        brand,
        itemId: slugifyItemId(itemIdSource),
      };
    }
  }

  throw new Error(`Could not parse Gemini JSON response: ${cleaned.slice(0, 120)}`);
}

async function readApiError(response: Response): Promise<string> {
  const body = await response.text().catch(() => response.statusText);
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // plain-text error body
  }
  return body || `HTTP ${response.status}`;
}

function geminiGenerateUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function callGeminiVisionModel(
  model: string,
  apiKey: string,
  bytes: Buffer,
  mimeType: string,
  useJsonSchema: boolean,
): Promise<GarmentVisionResult> {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.1,
    maxOutputTokens: 1024,
  };

  if (useJsonSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = VISION_JSON_SCHEMA;
  }

  const response = await fetch(geminiGenerateUrl(model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: VISION_PROMPT },
            {
              inlineData: {
                mimeType,
                data: bytes.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig,
    }),
  });

  if (!response.ok) {
    const detail = await readApiError(response);
    throw new Error(`Gemini (${model}): ${detail}`);
  }

  const payload = (await response.json()) as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  if (payload.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the image: ${payload.promptFeedback.blockReason}`);
  }

  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const reason = candidate?.finishReason ?? "unknown";
    throw new Error(`Gemini returned no text (finishReason: ${reason})`);
  }

  return parseVisionResponseText(text);
}

export async function analyzeGarmentImage(
  bytes: Buffer,
  mimeType: string,
): Promise<GarmentVisionResult> {
  const apiKey = getGeminiApiKey();
  let lastError: Error | null = null;

  for (const model of GEMINI_VISION_MODELS) {
    for (const useJsonSchema of [true, false] as const) {
      try {
        return await callGeminiVisionModel(model, apiKey, bytes, mimeType, useJsonSchema);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const retryable =
          lastError.message.includes("NOT_FOUND") ||
          lastError.message.includes("404") ||
          lastError.message.includes("is not supported") ||
          lastError.message.includes("Could not parse Gemini JSON") ||
          lastError.message.includes("Unterminated string") ||
          lastError.message.includes("JSON");

        if (!retryable && !useJsonSchema) break;
      }
    }
  }

  throw lastError ?? new Error("Gemini vision request failed");
}
