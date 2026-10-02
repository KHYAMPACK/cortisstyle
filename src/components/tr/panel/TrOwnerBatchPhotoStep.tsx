"use client";

import { useState } from "react";
import {
  hasManualGalleryPhoto,
  TrOwnerManualPhotoGallery,
} from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import {
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStickyActionsClass,
  panelStickyActionsSpacerClass,
} from "@/components/tr/panel/panelUi";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import {
  batchRowCover,
  capturedBatchRows,
  type ProductBatchCreateRow,
} from "@/lib/tr/productBatchCreateDraft";

/** Toplu ekle, step 1: photos for each product, one product at a time. */
export function TrOwnerBatchPhotoStep({
  boutiqueId,
  rows,
  activeId,
  onActiveIdChange,
  onPatchRow,
  onAddRow,
  onRemoveRow,
  onContinue,
  uploading,
  onUploadingChange,
}: {
  boutiqueId: string;
  rows: ProductBatchCreateRow[];
  activeId: string | null;
  onActiveIdChange: (id: string) => void;
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
  onAddRow: () => void;
  onRemoveRow: (clientId: string) => void;
  onContinue: () => void;
  uploading: boolean;
  onUploadingChange: (value: boolean) => void;
}) {
  const [lightbox, setLightbox] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captured = capturedBatchRows(rows);
  const atCap = rows.length >= TR_OWNER_PRODUCT_LIMITS.maxBatchCreateRows;
  const active = rows.find((row) => row.clientId === activeId) ?? rows[0];
  const activeHasPhoto = active ? hasManualGalleryPhoto(active.images) : false;
  const canAdd = activeHasPhoto && !atCap && !uploading;
  const photosIncomplete = captured.some((row) => !hasManualGalleryPhoto(row.images));
  const canContinue = captured.length > 0 && !photosIncomplete && !uploading;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {rows.map((row, index) => {
          const cover = batchRowCover(row);
          const selected = row.clientId === active?.clientId;
          return (
            <button
              key={row.clientId}
              type="button"
              onClick={() => onActiveIdChange(row.clientId)}
              disabled={uploading}
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
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-neutral-400">
                    {index + 1}
                  </span>
                )}
              </span>
              <span className="block truncate px-1 py-1 text-[11px] text-neutral-600">
                {cover ? "Hazır" : "Fotoğraf bekleniyor"}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {active ? (
        <div key={active.clientId} className="space-y-4">
          <TrOwnerManualPhotoGallery
            boutiqueId={boutiqueId}
            images={active.images}
            onImagesChange={(images) => onPatchRow(active.clientId, { images })}
            onError={setError}
            onLightbox={setLightbox}
            uploading={uploading}
            onUploadingChange={onUploadingChange}
          />
          {rows.length > 1 ? (
            <button
              type="button"
              className={panelSecondaryBtnClass}
              disabled={uploading}
              onClick={() => onRemoveRow(active.clientId)}
            >
              Bu ürünü sil
            </button>
          ) : null}
        </div>
      ) : null}

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
          onClick={onContinue}
        >
          Devam
        </button>
      </div>
      {!canContinue ? (
        <p className={panelHintClass}>
          {uploading
            ? "Fotoğraflar yükleniyor…"
            : photosIncomplete
              ? "Her üründe en az bir fotoğraf gerekli."
              : captured.length === 0
                ? "En az bir ürünün fotoğrafını ekleyin."
                : atCap
                  ? `En fazla ${TR_OWNER_PRODUCT_LIMITS.maxBatchCreateRows} ürün.`
                  : "Fotoğraf ekledikten sonra sonraki ürünü ekleyebilirsiniz."}
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
