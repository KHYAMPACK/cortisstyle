import type { StyleGuideDefinition } from "@/types/style-guide";
import { look02StyleGuide } from "@/data/style-guides/look-02";

const styleGuidesByLookId: Record<string, StyleGuideDefinition> = {
  "look-02": look02StyleGuide,
};

export function getStyleGuideDefinition(
  lookId: string,
): StyleGuideDefinition | undefined {
  return styleGuidesByLookId[lookId];
}
