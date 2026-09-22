/** Garment photo-slot labeling for the guided-upload pipeline UI. */

import type { PipelineJobKind } from "@/lib/tr/aiCatalog/pipelineProgress";

export function pipelineJobKindForSlot(
  slotIndex: number,
  requiredSlots = 2,
): PipelineJobKind {
  if (slotIndex === 0) return "photo-front";
  if (slotIndex === 1) return "photo-back";
  if (requiredSlots >= 3 && slotIndex === 2) return "photo-detail";
  return "photo-extra";
}

export function pipelineLabelForSlot(
  slotIndex: number,
  requiredSlots = 2,
): string {
  if (slotIndex === 0) return requiredSlots >= 3 ? "Ön manken" : "Ön katalog";
  if (slotIndex === 1) return requiredSlots >= 3 ? "Arka manken" : "Arka katalog";
  if (requiredSlots >= 3 && slotIndex === 2) return "Dekolte / detay";
  return `Ek fotoğraf ${slotIndex + 1}`;
}
