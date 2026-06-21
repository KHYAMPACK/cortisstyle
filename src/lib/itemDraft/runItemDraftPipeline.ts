import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { itemRarityScores } from "@/data/item-rarity";
import { extractProductFromUrl } from "@/lib/itemDraft/extractProductFromUrl";
import {
  formatItemDraftSnippets,
  revealDescription,
} from "@/lib/itemDraft/formatSnippets";
import { generateItemMetadataWithLlm } from "@/lib/itemDraft/generateItemMetadata";
import { loadProjectEnv } from "@/lib/itemDraft/loadEnv";
import { prepareImageForLlm } from "@/lib/itemDraft/prepareImageForLlm";
import { resolveLlmProvider } from "@/lib/itemDraft/resolveLlmProvider";
import { suggestItemId } from "@/lib/itemDraft/slugify";
import type {
  ItemDraftArtifacts,
  ItemDraftInput,
} from "@/lib/itemDraft/types";

function existingItemIds(): Set<string> {
  return new Set(Object.keys(itemRarityScores));
}

function detectImageMime(pngPath: string): string {
  const ext = extname(pngPath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

export async function runItemDraftPipeline(
  input: ItemDraftInput,
  cwd = process.cwd(),
): Promise<ItemDraftArtifacts> {
  loadProjectEnv(cwd);

  const llm = resolveLlmProvider();
  if (llm) {
    console.log(`[item-draft] Using LLM: ${llm.provider}/${llm.model}`);
  } else {
    console.warn(
      "[item-draft] No LLM key found. Set GEMINI_API_KEY (or GOOGLE_API_KEY) in .env.local",
    );
  }

  const pngPath = resolve(cwd, input.pngPath);
  if (!existsSync(pngPath)) {
    throw new Error(`PNG not found: ${pngPath}`);
  }

  const ids = existingItemIds();
  const id = input.id ?? suggestItemId(input.name, ids);
  if (input.id && ids.has(input.id)) {
    throw new Error(`Item id "${input.id}" already exists. Choose a different --id.`);
  }

  let productHints = {};
  let urlFetchFailed = false;
  try {
    productHints = await extractProductFromUrl(input.shopUrl);
  } catch (error) {
    urlFetchFailed = true;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[item-draft] URL scrape unavailable (${message}). LLM will infer from name, image, and URL.`,
    );
  }

  const imageBuffer = readFileSync(pngPath);
  const mimeType = detectImageMime(pngPath);
  const prepared = await prepareImageForLlm(imageBuffer, mimeType);
  if (prepared.compressed) {
    console.log(
      `[item-draft] Image compressed for LLM: ${prepared.originalBytes} → ${prepared.preparedBytes} bytes`,
    );
  }

  const llmResult = await generateItemMetadataWithLlm({
    name: input.name,
    shopUrl: input.shopUrl,
    pngBase64: prepared.base64,
    mimeType: prepared.mimeType,
    hints: productHints,
    brandOverride: input.brandOverride,
    urlFetchFailed,
    cwd,
  });

  const outfitFolder = input.outfitFolder.replace(/^\/+|\/+$/g, "");
  const canvasImage = `/images/clothes/${outfitFolder}/${id}.png`;
  let copiedImagePath: string | undefined;

  if (input.copyImage !== false) {
    const destDir = join(cwd, "public", "images", "clothes", outfitFolder);
    mkdirSync(destDir, { recursive: true });
    const destPath = join(destDir, `${id}.png`);
    copyFileSync(pngPath, destPath);
    copiedImagePath = destPath;
  }

  const blurredDescription = llmResult.blurredDescription;
  const draft = {
    id,
    name: input.name,
    shopUrl: input.shopUrl,
    brand: llmResult.brand,
    category: llmResult.category,
    blurredDescription,
    unlockedDescription: revealDescription(blurredDescription),
    fashionVectors: llmResult.fashionVectors,
    suggestedRarityScore: llmResult.suggestedRarityScore,
    canvasImage,
    productHints,
    guessedFields: llmResult.guessedFields,
    llmNotes: llmResult.llmNotes,
    llmProvider: llmResult.llmProvider,
  };

  const draftsDir = join(cwd, "drafts", "items");
  mkdirSync(draftsDir, { recursive: true });
  const draftJsonPath = join(draftsDir, `${id}.json`);
  const snippetPath = join(draftsDir, `${id}.snippet.ts`);

  writeFileSync(draftJsonPath, JSON.stringify(draft, null, 2), "utf8");
  writeFileSync(snippetPath, formatItemDraftSnippets(draft), "utf8");

  return {
    draft,
    draftJsonPath,
    snippetPath,
    copiedImagePath,
  };
}

export function parseCliArgs(argv: string[]): ItemDraftInput {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };

  const name = get("--name");
  const shopUrl = get("--url");
  const pngPath = get("--png");
  const outfitFolder = get("--outfit");

  if (!name || !shopUrl || !pngPath || !outfitFolder) {
    throw new Error(
      "Usage: npm run item:draft -- --name \"Exact Product Name\" --url \"https://...\" --png \"./path/to.png\" --outfit outfit-04 [--id custom-id-01] [--brand \"Brand\"] [--no-copy]",
    );
  }

  return {
    name,
    shopUrl,
    pngPath,
    outfitFolder,
    id: get("--id"),
    brandOverride: get("--brand"),
    copyImage: !argv.includes("--no-copy"),
  };
}

export async function runItemDraftCli(argv = process.argv.slice(2)): Promise<void> {
  const input = parseCliArgs(argv);
  const result = await runItemDraftPipeline(input);

  console.log("\n✓ Item draft generated\n");
  console.log(`  id:       ${result.draft.id}`);
  console.log(`  brand:    ${result.draft.brand}`);
  console.log(`  category: ${result.draft.category}`);
  console.log(`  rarity:   ${result.draft.suggestedRarityScore}`);
  if (result.copiedImagePath) {
    console.log(`  image:    ${result.copiedImagePath}`);
  }
  console.log(`  json:     ${result.draftJsonPath}`);
  console.log(`  snippets: ${result.snippetPath}`);
  if (result.draft.llmProvider) {
    const localOnly = result.draft.llmProvider.includes("(local-only)");
    console.log(
      `  llm:      ${result.draft.llmProvider}${localOnly ? " ← re-run for AI-enriched draft" : ""}`,
    );
  }
  if (result.draft.guessedFields?.length) {
    console.log(`  guessed:  ${result.draft.guessedFields.join(", ")}`);
  }
  if (result.draft.llmNotes) {
    console.log(`  note:     ${result.draft.llmNotes}`);
  }
  console.log("\nReview drafts/items/*.snippet.ts — check fields listed under GUESSED before pasting.\n");
}
