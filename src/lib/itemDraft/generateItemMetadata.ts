import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ClothingCategory } from "@/types/item";
import type { RarityScore } from "@/types/rarity";
import { applySmartGuesses } from "@/lib/itemDraft/applySmartGuesses";
import {
  buildKnownItemContext,
  formatKnownContextForPrompt,
  inferCategoryFromName,
} from "@/lib/itemDraft/inferItemContext";
import { formatLlmError, withLlmRetries } from "@/lib/itemDraft/llmRetry";
import {
  missingLlmKeyMessage,
  resolveLlmProvider,
} from "@/lib/itemDraft/resolveLlmProvider";
import type { ProductPageHints } from "@/lib/itemDraft/types";

function fewShotExamples(cwd = process.cwd()): string {
  const samplePath = join(
    cwd,
    "src/data/dynamic-looks/outfit-01-items.json",
  );
  const raw = JSON.parse(readFileSync(samplePath, "utf8")) as {
    items?: Array<Record<string, unknown>>;
  };
  const sample = raw.items?.[0];
  if (!sample) return "";

  return JSON.stringify(sample, null, 2);
}

export interface LlmMetadataResult {
  brand: string;
  category: ClothingCategory;
  displayModel: string;
  estPriceRange: string;
  budgetAlternativeUrl: string;
  suggestedRarityScore: RarityScore;
  guessedFields: string[];
  llmNotes?: string;
}

interface LlmJsonPayload {
  brand?: string;
  category?: string;
  displayModel?: string;
  estPriceRange?: string;
  budgetAlternativeUrl?: string;
  suggestedRarityScore?: number;
  guessedFields?: string[];
  llmNotes?: string;
}

function buildSystemPrompt(cwd = process.cwd()): string {
  return `You are the Cortisstyle archive editor. You receive an exact product name, shop URL, optional scraped page hints, and a garment PNG.

Your job is to fill EVERY metadata field. Use scraped data when present. When data is missing, infer your best guess from:
- the product name (brand patterns like "Brand - Product")
- the shop URL / retailer domain
- what you see in the garment image (material, silhouette, category)

Rules:
- NEVER rename the product. The provided name is canonical.
- Write in Cortis archive voice: precise, fashion-literate, cyber-grunge editorial.
- Do NOT use generic filler.
- Every field must be specific to THIS garment.
- category must be one of: headwear, eyewear, tops, outerwear, bottoms, shoes, bags, waist, accessories.
- budgetAlternativeUrl: retailer homepage or search URL for a budget alternative.
- In guessedFields, list every JSON field you inferred without direct page data (e.g. "estPriceRange").
- llmNotes: one sentence flagging anything uncertain for human review.
- Return ONLY valid JSON.

Reference style:
${fewShotExamples(cwd)}`;
}

function buildUserPrompt(ctx: ReturnType<typeof buildKnownItemContext>): string {
  return `${formatKnownContextForPrompt(ctx)}

Return JSON:
{
  "brand": "string",
  "category": "headwear|eyewear|tops|outerwear|bottoms|shoes|bags|waist|accessories",
  "displayModel": "string",
  "estPriceRange": "string",
  "budgetAlternativeUrl": "https://www.forever21.com/",
  "suggestedRarityScore": 1,
  "guessedFields": ["field.names.you.inferred"],
  "llmNotes": "one sentence for human reviewer"
}`;
}

function parseLlmPayload(content: string): LlmJsonPayload {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as LlmJsonPayload;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as LlmJsonPayload;
    }
    throw new Error("LLM response was not valid JSON");
  }
}

function fallbackWithoutLlm(
  name: string,
  shopUrl: string,
  hints: ProductPageHints,
  brandOverride?: string,
  urlFetchFailed = false,
): LlmMetadataResult {
  const ctx = buildKnownItemContext({
    name,
    shopUrl,
    hints,
    brandOverride,
    urlFetchFailed,
  });

  const guessed = applySmartGuesses({}, ctx);
  return {
    ...guessed,
    llmNotes: `${missingLlmKeyMessage()} ${guessed.llmNotes ?? ""}`.trim(),
  };
}

async function callGeminiVision(
  apiKey: string,
  model: string,
  pngBase64: string,
  mimeType: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: userPrompt },
            {
              inlineData: {
                mimeType,
                data: pngBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${body.slice(0, 400)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const content = json.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!content) throw new Error("Gemini returned an empty response");
  return content;
}

async function callOpenAiVision(
  apiKey: string,
  model: string,
  pngBase64: string,
  mimeType: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${pngBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${body.slice(0, 400)}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response");
  return content;
}

export async function generateItemMetadataWithLlm(input: {
  name: string;
  shopUrl: string;
  pngBase64: string;
  mimeType: string;
  hints: ProductPageHints;
  brandOverride?: string;
  urlFetchFailed?: boolean;
  cwd?: string;
}): Promise<LlmMetadataResult & { llmProvider?: string }> {
  const cwd = input.cwd ?? process.cwd();
  const llm = resolveLlmProvider();

  const ctx = buildKnownItemContext({
    name: input.name,
    shopUrl: input.shopUrl,
    hints: input.hints,
    brandOverride: input.brandOverride,
    urlFetchFailed: input.urlFetchFailed,
  });

  if (!llm) {
    return fallbackWithoutLlm(
      input.name,
      input.shopUrl,
      input.hints,
      input.brandOverride,
      input.urlFetchFailed,
    );
  }

  const systemPrompt = buildSystemPrompt(cwd);
  const userPrompt = buildUserPrompt(ctx);

  let payload: LlmJsonPayload = {};
  let llmUsed = false;
  try {
    const content = await withLlmRetries("Gemini/OpenAI vision", () =>
      llm.provider === "gemini"
        ? callGeminiVision(
            llm.apiKey,
            llm.model,
            input.pngBase64,
            input.mimeType,
            systemPrompt,
            userPrompt,
          )
        : callOpenAiVision(
            llm.apiKey,
            llm.model,
            input.pngBase64,
            input.mimeType,
            systemPrompt,
            userPrompt,
          ),
    );
    payload = parseLlmPayload(content);
    llmUsed = true;
  } catch (error) {
    console.warn(
      `[item-draft] LLM unavailable after retries (${formatLlmError(error)}). Using local guesses only — re-run when network is stable for richer output.`,
    );
  }

  const guessed = applySmartGuesses(payload, ctx);

  return {
    brand: guessed.brand,
    category: guessed.category ?? inferCategoryFromName(input.name),
    displayModel: guessed.displayModel,
    estPriceRange: guessed.estPriceRange,
    budgetAlternativeUrl: guessed.budgetAlternativeUrl,
    suggestedRarityScore: guessed.suggestedRarityScore,
    guessedFields: guessed.guessedFields,
    llmNotes: guessed.llmNotes,
    llmProvider: llmUsed
      ? `${llm.provider}/${llm.model}`
      : `${llm.provider}/${llm.model} (local-only)`,
  };
}
