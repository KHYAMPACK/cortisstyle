"use client";

import { useState } from "react";
import {
  TrOwnerGuidedPhotoUpload,
} from "@/components/tr/panel/TrOwnerGuidedPhotoUpload";
import {
  hasManualGalleryPhoto,
  TrOwnerManualPhotoGallery,
} from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { TrOwnerWizardPipelineStatus } from "@/components/tr/panel/TrOwnerWizardPipelineStatus";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import {
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStickyActionsClass,
  panelStickyActionsSpacerClass,
} from "@/components/tr/panel/panelUi";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";
import { proposedConstructionChipsFromDraft } from "@/lib/tr/fashion/aiCatalog/runConstructionPackshot";
import { emptyElbiseGateChips } from "@/components/tr/fashion/panel/TrOwnerElbiseConstructionGate";
import { getCatalogBackground } from "@/lib/tr/catalogBackgrounds/registry";
import { constructionCatalogFamily } from "@/lib/tr/fashion/garmentUploadTypes";
import { requestOwnerListingDraft } from "@/lib/tr/ownerClient";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import {
  applyBatchListingDraft,
  type ProductBatchCreateRow,
} from "@/lib/tr/productBatchCreateDraft";
import {
  batchIdentifyCounts,
  batchPhotoTileStatus,
  batchRowCover,
  batchRowHasBothPhotos,
} from "@/lib/tr/productBatchCreateFlow";

function ignoreUploadingChange(_value: boolean) {
  // Batch session tracks jobs via onPhotoJobsChange, not this flag.
}

export function TrOwnerBatchPhotoStep({
  boutiqueId,
  rows,
  activeId,
  photoJobsById,
  onActiveIdChange,
  onPatchRow,
  onPhotoJobsChange,
  onAddRow,
  onRemoveRow,
  onContinue,
  manualMode = false,
}: {
  boutiqueId: string;
  rows: ProductBatchCreateRow[];
  activeId: string | null;
  photoJobsById: Record<string, PipelineJobItem[]>;
  onActiveIdChange: (id: string) => void;
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
  onPhotoJobsChange: (clientId: string, jobs: PipelineJobItem[]) => void;
  onAddRow: () => void;
  onRemoveRow: (clientId: string) => void;
  onContinue: (options?: { skipFailedIdentify?: boolean }) => void;
  manualMode?: boolean;
}) {
  const [lightbox, setLightbox] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const catalogCss = getCatalogBackground(
    rows[0]?.catalogBackgroundId,
  ).css;

  const counts = batchIdentifyCounts(rows, photoJobsById);
  const identifyingTotal = counts.captured.length;
  const identifiedCount = identifyingTotal - counts.identifying.length;
  const atCap = rows.length >= TR_OWNER_PRODUCT_LIMITS.maxBatchCreateRows;
  const active = rows.find((row) => row.clientId === activeId) ?? rows[0];
  const activeHasBoth = active
    ? manualMode
      ? hasManualGalleryPhoto(active.images)
      : batchRowHasBothPhotos(active)
    : false;
  const canAdd = activeHasBoth && !atCap;
  const identifyBusy = !manualMode && counts.identifying.length > 0;
  const photosIncomplete = manualMode
    ? counts.captured.some((row) => !hasManualGalleryPhoto(row.images))
    : counts.incomplete.length > 0;
  const canContinue =
    counts.captured.length > 0 &&
    !photosIncomplete &&
    !identifyBusy &&
    (manualMode || counts.failed.length === 0);

  async function retryIdentify(row: ProductBatchCreateRow) {
    const source =
      row.marketplaceImages[0]?.trim() || row.images[0]?.trim() || "";
    if (!source) {
      setError("Ön fotoğraf yok — tanımayı tekrar denemek için önce ön çekin.");
      return;
    }
    setRetryingId(row.clientId);
    setError(null);
    try {
      const draft = await requestOwnerListingDraft({
        boutiqueId,
        sourceImageUrl: source,
        backImageUrl: row.images[1]?.trim() || undefined,
        detailImageUrl: row.images[2]?.trim() || undefined,
        category: row.category,
        uploadType: row.uploadType,
        inferConstructionFamily: !row.uploadType,
      });
      onPatchRow(row.clientId, {
        ...applyBatchListingDraft(row, draft),
        frontAnalysisDone: true,
        frontDraftFailed: false,
        uploadType: constructionCatalogFamily(undefined, draft.category),
        gateChips: emptyElbiseGateChips(
          proposedConstructionChipsFromDraft(
            draft,
            undefined,
            constructionCatalogFamily(undefined, draft.category),
            row.images[2]?.trim() || "",
          ),
          { hasDetailPhoto: Boolean(row.images[2]?.trim()) },
        ),
        proposedChips: emptyElbiseGateChips(
          proposedConstructionChipsFromDraft(
            draft,
            undefined,
            constructionCatalogFamily(undefined, draft.category),
            row.images[2]?.trim() || "",
          ),
          { hasDetailPhoto: Boolean(row.images[2]?.trim()) },
        ),
        packshotError: null,
      });
    } catch (retryError) {
      onPatchRow(row.clientId, {
        frontAnalysisDone: true,
        frontDraftFailed: true,
      });
      setError(
        retryError instanceof Error
          ? retryError.message
          : "Tanıma tekrar başarısız.",
      );
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {manualMode || !identifyBusy ? null : (
        <div className="rounded-xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] px-4 py-4">
          <p className="text-[16px] font-semibold text-neutral-900">
            Ürün tanınıyor… {identifiedCount} / {identifyingTotal}
          </p>
          <p className={`mt-1 ${panelHintClass}`}>
            İsim ve kategori için her ürünün ön ve arka fotoğrafı analiz
            ediliyor. Packshot sonraki adımda, özellik onayından sonra.
          </p>
        </div>
      )}

      {manualMode || counts.failed.length === 0 || identifyBusy ? null : (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-[16px] font-semibold text-amber-950">
            {counts.failed.length} ürün tanınamadı
          </p>
          <ul className="space-y-2">
            {counts.failed.map((row) => (
              <li
                key={row.clientId}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-[14px] text-amber-950">
                  Ürün {rows.findIndex((item) => item.clientId === row.clientId) + 1}
                  {row.title.trim() ? ` · ${row.title}` : ""}
                </span>
                <button
                  type="button"
                  className={panelSecondaryBtnClass}
                  disabled={retryingId === row.clientId}
                  onClick={() => void retryIdentify(row)}
                >
                  {retryingId === row.clientId ? "Deneniyor…" : "Tekrar dene"}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={panelSecondaryBtnClass}
            onClick={() => onContinue({ skipFailedIdentify: true })}
          >
            Yine de devam — elle yazacağım
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {rows.map((row, index) => {
          const status = batchPhotoTileStatus(
            row,
            photoJobsById[row.clientId] ?? [],
          );
          const cover = batchRowCover(row);
          const selected = row.clientId === active?.clientId;
          return (
            <button
              key={row.clientId}
              type="button"
              onClick={() => onActiveIdChange(row.clientId)}
              className={`w-20 shrink-0 overflow-hidden rounded-xl border-2 text-left ${
                selected
                  ? "border-[color:var(--panel-accent)]"
                  : "border-neutral-200"
              }`}
            >
              <span className="relative block aspect-[3/4] bg-[color:var(--panel-accent-soft)]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-neutral-400">
                    {index + 1}
                  </span>
                )}
                {status.kind !== "ready" && status.kind !== "empty" ? (
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-1 text-center text-[10px] font-semibold text-white">
                    {status.label}
                  </span>
                ) : null}
              </span>
              <span className="block truncate px-1 py-1 text-[11px] text-neutral-600">
                {status.kind === "ready" ? "Hazır" : status.label}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {manualMode ? null : active ? (
        <TrOwnerWizardPipelineStatus
          jobs={photoJobsById[active.clientId] ?? []}
        />
      ) : null}

      {rows.map((row) => (
        <div
          key={row.clientId}
          className={row.clientId === active?.clientId ? "space-y-4" : "hidden"}
        >
          {manualMode ? (
            <TrOwnerManualPhotoGallery
              boutiqueId={boutiqueId}
              images={row.images}
              onImagesChange={(images) => onPatchRow(row.clientId, { images })}
              onError={setError}
              onLightbox={setLightbox}
            />
          ) : (
          <TrOwnerGuidedPhotoUpload
            boutiqueId={boutiqueId}
            images={row.images}
            marketplaceImages={row.marketplaceImages}
            catalogBackgroundCss={catalogCss}
            title={row.title}
            category={row.category}
            uploadType={row.uploadType}
            deferConstructionPackshot
            onUploadingChange={ignoreUploadingChange}
            onImagesChange={(images) => onPatchRow(row.clientId, { images })}
            onMarketplaceImagesChange={(marketplaceImages) =>
              onPatchRow(row.clientId, { marketplaceImages })
            }
            onError={setError}
            onLightbox={setLightbox}
            onListingDraft={(draft) => {
              if (draft.title.trim()) {
                onPatchRow(row.clientId, applyBatchListingDraft(row, draft));
              }
            }}
            onConstructionPrepared={({ draft, proposed, preparedPrompt }) => {
              const family = constructionCatalogFamily(
                undefined,
                draft?.category,
              );
              onPatchRow(row.clientId, {
                ...(draft?.title?.trim()
                  ? applyBatchListingDraft(row, draft)
                  : {}),
                uploadType: family,
                gateChips: proposed,
                proposedChips: proposed,
                preparedPrompt,
                packshotError: null,
              });
            }}
            onFrontAnalysisComplete={({ draft }) => {
              if (draft?.title?.trim()) {
                onPatchRow(row.clientId, {
                  ...applyBatchListingDraft(row, draft),
                  frontAnalysisDone: true,
                  frontDraftFailed: false,
                });
              } else {
                onPatchRow(row.clientId, {
                  frontAnalysisDone: true,
                  frontDraftFailed: true,
                });
              }
            }}
            onFrontSlotReset={() =>
              onPatchRow(row.clientId, {
                listingDraft: null,
                frontAnalysisDone: false,
                frontDraftFailed: false,
              })
            }
            onPhotoJobsChange={(jobs) =>
              onPhotoJobsChange(row.clientId, jobs)
            }
          />
          )}
          {rows.length > 1 ? (
            <button
              type="button"
              className={panelSecondaryBtnClass}
              onClick={() => onRemoveRow(row.clientId)}
            >
              Bu ürünü sil
            </button>
          ) : null}
        </div>
      ))}

      <div className={panelStickyActionsSpacerClass} aria-hidden />
      <div className={panelStickyActionsClass}>
        <button
          type="button"
          className={`${panelSecondaryBtnClass} flex-1`}
          disabled={!canAdd}
          onClick={onAddRow}
        >
          Sonraki ürün
        </button>
        <button
          type="button"
          className={`${panelPrimaryBtnClass} flex-1`}
          disabled={!canContinue}
          onClick={() => onContinue()}
        >
          Devam
        </button>
      </div>
      {!canContinue ? (
        <p className={panelHintClass}>
            {photosIncomplete
            ? manualMode
              ? "Her üründe en az bir fotoğraf gerekli."
              : "Her üründe ön ve arka fotoğraf gerekli. Detay isteğe bağlı."
            : identifyBusy
              ? "Tanıma bitince devam edebilirsiniz — packshot sonraki adımda."
              : counts.captured.length === 0
                ? manualMode
                  ? "En az bir ürünün fotoğrafını ekleyin."
                  : "En az bir ürünün ön ve arka fotoğrafını ekleyin."
                : counts.failed.length > 0
                  ? "Tanıma hatalarını tekrar deneyin veya elle devam edin."
                  : atCap
                    ? `En fazla ${TR_OWNER_PRODUCT_LIMITS.maxBatchCreateRows} ürün.`
                    : manualMode
                      ? "Fotoğraf ekledikten sonra sonraki ürünü ekleyebilirsiniz."
                      : "Ön ve arka çekildikten sonra sonraki ürünü ekleyebilirsiniz."}
        </p>
      ) : null}

      <TrProductImageLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
