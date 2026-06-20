import path from "node:path";
import type { ResolvedStyleGuideDirectoryItem } from "@/types/style-guide";

export function resolveGuidePdfImagePath(
  item: Pick<ResolvedStyleGuideDirectoryItem, "canvasImage">,
): string | undefined {
  if (!item.canvasImage) return undefined;

  return path.join(process.cwd(), "public", item.canvasImage.replace(/^\//, ""));
}
