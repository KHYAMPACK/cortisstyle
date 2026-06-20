import type { FitGuidance } from "@/types/item";

export function formatFitGuidanceLine(fitGuidance: FitGuidance): string {
  const segments = [fitGuidance.type, fitGuidance.fabricWeight];
  if (fitGuidance.modelSpecs) segments.push(fitGuidance.modelSpecs);
  return segments.join(" | ");
}
