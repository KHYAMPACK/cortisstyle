import { DEFAULT_PACKSHOT_PROMPT } from "@/lib/tr/fashn/packshot";
import type { TrProductPhotoRole } from "@/lib/tr/ownerProductConstraints";

export type PackshotView = TrProductPhotoRole;

export const PACKSHOT_VIEW_PROMPT: Record<
  Exclude<PackshotView, "extra">,
  string
> = {
  front:
    "Front view of the garment. Show the front face, front neckline, and front construction.",
  back: "Back view of the garment. This source photo is the BACK / REAR side. Keep rear orientation: show the back of the garment, back neckline, and back seams. Do not convert or invent a front view.",
};

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

  const extra = input?.extra?.trim();
  if (extra) {
    parts.push(extra);
  }

  return parts.join(" ");
}
