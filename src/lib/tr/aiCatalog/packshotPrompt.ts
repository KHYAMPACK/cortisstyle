import {
  DEFAULT_PACKSHOT_PROMPT,
  constructionPackshotBasePrompt,
  finalizePackshotPrompt,
  isFlatLayPackshotFamily,
  stripConflictingFlatLayPresentation,
  stripConflictingPackshotPresentation,
} from "@/lib/tr/fashn/packshot";
import {
  buildElbiseConstructionLock,
  type ElbiseConstructionChips,
} from "@/lib/tr/aiCatalog/elbiseConstructionLock";
import type { ConstructionCatalogFamily } from "@/lib/tr/catalog/garmentUploadTypes";
import type { TrProductPhotoRole } from "@/lib/tr/ownerProductConstraints";

export type PackshotView = TrProductPhotoRole;

export const PACKSHOT_VIEW_PROMPT: Record<"front" | "back", string> = {
  front:
    "Front view of the garment. Show the front face, front neckline, and front construction.",
  back: "Back view of the garment. This source photo is the BACK / REAR side. Keep rear orientation: show the back of the garment, back neckline, and back seams. Do not convert or invent a front view.",
};

const OTHER_PACKSHOT_STYLE =
  /(?<!\bno\s)\b(on[- ]?hanger|on a hanger|clothes hangers?|askı|dress form|visible mannequin|flat[- ]lay|floating garment|on mannequin)\b/i;

/** Drop Gemini extras that would switch FASHN off the locked presentation. */
export function sanitizePackshotPromptExtra(
  extra: string | null | undefined,
  family: ConstructionCatalogFamily = "elbise",
): string | null {
  const trimmed = extra?.trim();
  if (!trimmed) return null;
  if (isFlatLayPackshotFamily(family)) {
    return stripConflictingFlatLayPresentation(trimmed) || null;
  }
  const withoutGhost = trimmed.replace(/\bghost mannequin\b/gi, "");
  if (OTHER_PACKSHOT_STYLE.test(withoutGhost)) return null;
  return stripConflictingPackshotPresentation(trimmed) || null;
}

/**
 * Build packshot prompt from title/category/view heuristics.
 * Prefer `resolvePackshotPrompt` in the generate path (adds Gemini when configured).
 * View orientation is always applied in the base prompt — independent of Gemini.
 */
export function buildPackshotPrompt(input?: {
  title?: string | null;
  category?: string | null;
  view?: PackshotView | null;
  extra?: string | null;
}): string {
  const parts: string[] = [DEFAULT_PACKSHOT_PROMPT];

  const view = input?.view ?? "front";
  if (view === "back") {
    parts.push(PACKSHOT_VIEW_PROMPT.back);
  } else if (view === "front") {
    parts.push(PACKSHOT_VIEW_PROMPT.front);
  }

  const title = input?.title?.trim();
  if (title) {
    parts.push(`Product: ${title}.`);
  }

  const extra = sanitizePackshotPromptExtra(input?.extra);
  if (extra) {
    parts.push(extra);
  }

  return finalizePackshotPrompt(parts.join(" "));
}

export function buildElbisePackshotPrompt(
  extra?: string | null,
  construction?: ElbiseConstructionChips | null,
  family: ConstructionCatalogFamily = "elbise",
): string {
  const parts = [constructionPackshotBasePrompt(family)];
  const cleaned = sanitizePackshotPromptExtra(extra, family);
  if (cleaned) parts.push(cleaned);
  const lock = buildElbiseConstructionLock(construction, family);
  if (lock) parts.push(lock);
  return finalizePackshotPrompt(parts.join(" "));
}
