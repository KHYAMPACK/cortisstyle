"use client";

import {
  emptyElbiseGateChips,
} from "@/components/tr/panel/TrOwnerElbiseConstructionGate";
import { TrOwnerConstructionTriageFields } from "@/components/tr/panel/TrOwnerConstructionTriageFields";
import {
  TrOwnerCreditsCostLine,
  TrOwnerCreditsMoreInfoLink,
} from "@/components/tr/panel/TrOwnerCreditsInfo";
import {
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelStickyActionsClass,
  panelStickyActionsSpacerClass,
} from "@/components/tr/panel/panelUi";
import { TR_AI_CATALOG_CREDITS } from "@/lib/tr/aiCatalog/uploadCostHints";
import type { ProductBatchCreateRow } from "@/lib/tr/productBatchCreateDraft";
import {
  batchRowChipsReady,
  batchRowCover,
  batchRowFamily,
  batchRowPackshotReady,
} from "@/lib/tr/productBatchCreateFlow";

export function TrOwnerBatchChipsStep({
  boutiqueId,
  rows,
  packingById,
  onPatchRow,
  onBack,
  onConfirm,
}: {
  boutiqueId: string;
  rows: ProductBatchCreateRow[];
  packingById: Record<string, boolean>;
  onPatchRow: (clientId: string, patch: Partial<ProductBatchCreateRow>) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const notReady = rows.filter((row) => !batchRowChipsReady(row));
  const packing = rows.some((row) => packingById[row.clientId]);
  const credits = rows.length * TR_AI_CATALOG_CREDITS.productPackage;
  const canConfirm = notReady.length === 0 && !packing;

  return (
    <div className="space-y-5">
      <p className={panelHintClass}>
        Her ürünün özelliklerini kontrol edin. Onaylayınca packshot üretilir —
        isimleri bir sonraki adımda düzeltebilirsiniz.
      </p>
      <TrOwnerCreditsCostLine
        boutiqueId={boutiqueId}
        credits={credits}
        prefix="Tüm ürünler için packshot"
      />
      {notReady.length > 0 ? (
        <p className={panelErrorClass}>
          {notReady.length} üründe tür veya zorunlu özellik eksik.
        </p>
      ) : null}

      <div className="space-y-4">
        {rows.map((row, index) => {
          const family = batchRowFamily(row);
          const packingRow = Boolean(packingById[row.clientId]);
          const packReady = batchRowPackshotReady(row);
          const chips =
            row.gateChips ??
            emptyElbiseGateChips(row.proposedChips, {
              hasDetailPhoto: Boolean(row.images[2]?.trim()),
            });
          const cover = batchRowCover(row);
          return (
            <section
              key={row.clientId}
              className="space-y-4 rounded-xl border border-neutral-200/80 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[color:var(--panel-accent-soft)]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[13px] text-neutral-400">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {row.title.trim() || `Ürün ${index + 1}`}
                  </p>
                  {packingRow ? (
                    <p className="mt-1 text-[13px] text-neutral-500">
                      Packshot üretiliyor…
                    </p>
                  ) : packReady ? (
                    <p className="mt-1 text-[13px] text-emerald-800">
                      Packshot hazır
                    </p>
                  ) : row.packshotError ? (
                    <p className="mt-1 text-[13px] text-red-700">
                      {row.packshotError}
                    </p>
                  ) : row.frontDraftFailed ? (
                    <p className="mt-1 text-[13px] text-amber-800">
                      AI tanıyamadı — tür ve özellikleri seçin.
                    </p>
                  ) : null}
                </div>
              </div>

              <TrOwnerConstructionTriageFields
                family={family}
                shopCategory={row.category}
                chips={chips}
                disabled={packingRow}
                hasDetailPhoto={Boolean(row.images[2]?.trim())}
                onChange={({ family: nextFamily, category, chips: nextChips }) =>
                  onPatchRow(row.clientId, {
                    uploadType: nextFamily,
                    category,
                    gateChips: nextChips,
                  })
                }
              />
            </section>
          );
        })}
      </div>

      <TrOwnerCreditsMoreInfoLink boutiqueId={boutiqueId} />

      <div className={panelStickyActionsSpacerClass} aria-hidden />
      <div className={panelStickyActionsClass}>
        <button
          type="button"
          className={`${panelSecondaryBtnClass} flex-1`}
          onClick={onBack}
        >
          Geri
        </button>
        <button
          type="button"
          className={`${panelPrimaryBtnClass} flex-1`}
          disabled={!canConfirm}
          onClick={onConfirm}
        >
          {packing ? "Packshot üretiliyor…" : "Onayla — packshot üret"}
        </button>
      </div>
    </div>
  );
}
