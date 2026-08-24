/** Shared pipeline progress for the product create wizard. */

export type PipelineJobKind =
  | "photo-front"
  | "photo-back"
  | "photo-detail"
  | "photo-extra"
  | "model";

export type PipelineJobStatus = "running" | "done" | "error";

export interface PipelineJobItem {
  id: string;
  kind: PipelineJobKind;
  label: string;
  status: PipelineJobStatus;
  /** 0–100 while running */
  progressPct: number;
  detail?: string;
}

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
