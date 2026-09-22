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
