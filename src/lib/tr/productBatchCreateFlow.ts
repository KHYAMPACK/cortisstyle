import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import type { ProductBatchCreateRow } from "@/lib/tr/productBatchCreateDraft";

export type BatchPhotoTileKind =
  | "empty"
  | "uploading"
  | "identifying"
  | "queued"
  | "packshot"
  | "ready"
  | "identify-error";

export function batchRowHasBothPhotos(row: ProductBatchCreateRow): boolean {
  return Boolean(row.images[0]?.trim() && row.images[1]?.trim());
}

export function batchRowCover(row: ProductBatchCreateRow): string | null {
  return (
    row.marketplaceImages.find((url) => Boolean(url?.trim())) ||
    row.images.find((url) => Boolean(url?.trim())) ||
    null
  );
}

function runningJob(
  jobs: PipelineJobItem[],
  kind: PipelineJobItem["kind"],
): PipelineJobItem | undefined {
  return jobs.find((job) => job.kind === kind && job.status === "running");
}

export function batchPhotoTileStatus(
  row: ProductBatchCreateRow,
  jobs: PipelineJobItem[],
): { kind: BatchPhotoTileKind; label: string } {
  const front = runningJob(jobs, "photo-front");
  const back = runningJob(jobs, "photo-back");
  const extra = runningJob(jobs, "photo-extra");
  const detail = (job?: PipelineJobItem) => job?.detail?.trim() ?? "";

  if (front) {
    const text = detail(front);
    if (text.includes("tanınıyor")) {
      return { kind: "identifying", label: "Ürün tanınıyor" };
    }
    if (text.includes("Sırada")) {
      return { kind: "queued", label: "Katalog sırada…" };
    }
    if (text.toLocaleLowerCase("tr").includes("katalog")) {
      return { kind: "packshot", label: "Katalog görseli hazırlanıyor…" };
    }
    return { kind: "uploading", label: "Ön fotoğraf yükleniyor" };
  }

  if (row.images[0]?.trim() && !row.frontAnalysisDone) {
    return { kind: "identifying", label: "Ürün tanınıyor" };
  }

  if (row.frontAnalysisDone && row.frontDraftFailed) {
    return { kind: "identify-error", label: "Tanıma başarısız" };
  }

  if (back) {
    const text = detail(back);
    if (text.includes("Sırada")) {
      return { kind: "queued", label: "Arka katalog sırada…" };
    }
    if (text.toLocaleLowerCase("tr").includes("katalog")) {
      return { kind: "packshot", label: "Arka katalog hazırlanıyor…" };
    }
    return { kind: "uploading", label: "Arka fotoğraf yükleniyor" };
  }

  if (extra) {
    return { kind: "uploading", label: "Ek fotoğraf yükleniyor" };
  }

  if (batchRowHasBothPhotos(row)) {
    const packing = jobs.some((job) => job.status === "running");
    if (packing) {
      return { kind: "packshot", label: "Katalog görseli hazırlanıyor…" };
    }
    return { kind: "ready", label: "Hazır" };
  }

  if (row.images[0]?.trim() && !row.images[1]?.trim()) {
    return { kind: "uploading", label: "Arka fotoğraf bekleniyor" };
  }

  return { kind: "empty", label: "Fotoğraf bekleniyor" };
}

export function capturedBatchRows(
  rows: ProductBatchCreateRow[],
): ProductBatchCreateRow[] {
  return rows.filter(
    (row) =>
      row.images.some((url) => Boolean(url?.trim())) ||
      row.marketplaceImages.some((url) => Boolean(url?.trim())),
  );
}

export function batchIdentifyCounts(
  rows: ProductBatchCreateRow[],
  jobsById: Record<string, PipelineJobItem[]>,
): {
  captured: ProductBatchCreateRow[];
  identifying: ProductBatchCreateRow[];
  failed: ProductBatchCreateRow[];
  incomplete: ProductBatchCreateRow[];
} {
  const captured = capturedBatchRows(rows);
  return {
    captured,
    identifying: captured.filter((row) => {
      if (row.frontAnalysisDone) return false;
      const jobs = jobsById[row.clientId] ?? [];
      return Boolean(row.images[0]?.trim()) || Boolean(runningJob(jobs, "photo-front"));
    }),
    failed: captured.filter(
      (row) => row.frontAnalysisDone && row.frontDraftFailed,
    ),
    incomplete: captured.filter((row) => !batchRowHasBothPhotos(row)),
  };
}
