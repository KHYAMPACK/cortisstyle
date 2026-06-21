export type ItemDraftLlmProvider = "gemini" | "openai";

export interface ResolvedLlmProvider {
  provider: ItemDraftLlmProvider;
  apiKey: string;
  model: string;
}

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function looksLikeGeminiKey(value: string): boolean {
  return value.startsWith("AIza");
}

/** Picks Gemini or OpenAI based on env keys. Gemini is preferred when both are set. */
export function resolveLlmProvider(): ResolvedLlmProvider | null {
  const forced = process.env.ITEM_DRAFT_LLM?.trim().toLowerCase();

  const geminiKey = firstEnv(
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
  );
  const openaiKey = firstEnv("OPENAI_API_KEY");

  // Common mistake: Gemini key pasted into OPENAI_API_KEY.
  if (!geminiKey && openaiKey && looksLikeGeminiKey(openaiKey)) {
    return {
      provider: "gemini",
      apiKey: openaiKey,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    };
  }

  if (forced === "gemini" && geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    };
  }

  if (forced === "openai" && openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
    };
  }

  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    };
  }

  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
    };
  }

  return null;
}

export function missingLlmKeyMessage(): string {
  return (
    "Generated without LLM (set GEMINI_API_KEY or OPENAI_API_KEY in .env.local). " +
    "Review and refine manually."
  );
}
