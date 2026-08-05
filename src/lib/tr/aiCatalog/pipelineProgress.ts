/** Shared pipeline progress for the product create wizard. */

export type PipelineJobKind =
  | "photo-front"
  | "photo-back"
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

export function pipelineJobKindForSlot(slotIndex: number): PipelineJobKind {
  if (slotIndex === 0) return "photo-front";
  if (slotIndex === 1) return "photo-back";
  return "photo-extra";
}

export function pipelineLabelForSlot(slotIndex: number): string {
  if (slotIndex === 0) return "Ön katalog";
  if (slotIndex === 1) return "Arka katalog";
  return `Ek fotoğraf ${slotIndex + 1}`;
}
