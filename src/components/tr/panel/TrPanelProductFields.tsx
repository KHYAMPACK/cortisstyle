"use client";

import { useState } from "react";
import { TrPanelEditorActions, TrPanelEditorCard } from "@/components/tr/panel/TrPanelEditor";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";
import {
  panelChipClass,
  panelDangerBtnClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  clampTitle,
  sanitizeTryPriceInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import { trBoutiqueProductPath } from "@/lib/tr/paths";

/**
 * Fields every product editor shares (Basit / Gelişmiş and the fashion editor): the
 * name, the prices, Durum, "Mağazada gör" and the delete card. Garment-specific
 * pieces live under `components/tr/fashion/panel/`.
 */

/** "Ürün adı" with its character counter. */
export function TrPanelProductTitleField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className={panelLabelClass}>
        Ürün adı
        <span className="text-[color:var(--panel-accent)]"> *</span>
      </span>
      <input
        value={value}
        onChange={(event) => onChange(clampTitle(event.target.value))}
        maxLength={TR_OWNER_PRODUCT_LIMITS.titleMax}
        className={panelFieldClass}
      />
      <span className={`block ${panelHintClass}`}>
        {value.length}/{TR_OWNER_PRODUCT_LIMITS.titleMax}
      </span>
    </label>
  );
}

/** A TL amount with the ₺ prefix. */
export function TrPanelPriceField({
  label,
  required,
  value,
  onChange,
  hint,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className={panelLabelClass}>
        {label}
        {required ? (
          <span className="text-[color:var(--panel-accent)]"> *</span>
        ) : null}
      </span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[14px] text-neutral-400">
          ₺
        </span>
        <input
          value={value}
          onChange={(event) => onChange(sanitizeTryPriceInput(event.target.value))}
          inputMode="decimal"
          className={`${panelFieldClass} pl-8`}
        />
      </span>
      {hint ? <span className={`block ${panelHintClass}`}>{hint}</span> : null}
    </label>
  );
}

/** Durum: the owner picks Satışta or Gizli; "Satıldı" follows from stock. */
export function TrPanelProductVisibilityField({
  hidden,
  onChange,
  hint,
}: {
  hidden: boolean;
  onChange: (hidden: boolean) => void;
  /** Shown under the chips instead of the default sentence. */
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <p className={panelLabelClass}>Durum</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={panelChipClass(!hidden)}
          onClick={() => onChange(false)}
        >
          Satışta
        </button>
        <button
          type="button"
          className={panelChipClass(hidden)}
          onClick={() => onChange(true)}
        >
          Gizli
        </button>
      </div>
      <p className={panelHintClass}>
        {hint ?? "Satışta görünür, gizlide mağazada çıkmaz."}
      </p>
    </div>
  );
}

/** "Mağazada gör" in the editor's top bar, for a product the shop shows. */
export function TrPanelProductStoreLink({
  boutiqueSlug,
  productId,
}: {
  boutiqueSlug: string;
  productId: string;
}) {
  return (
    <TrPanelEditorActions>
      <a
        href={trBoutiqueProductPath(boutiqueSlug, productId)}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden h-9 items-center rounded-lg border border-white/15 px-3 text-[13px] font-medium text-white/85 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 motion-reduce:transition-none md:inline-flex"
      >
        Mağazada gör
      </a>
    </TrPanelEditorActions>
  );
}

/** The "Ürünü sil" card with its inline confirmation. */
export function TrPanelProductDeleteCard({
  productTitle,
  disabled,
  deleting,
  onDelete,
}: {
  productTitle: string;
  /** Blocks starting a delete (saving, uploading…). */
  disabled?: boolean;
  deleting: boolean;
  /** Runs the delete; resolve `false` when it failed so the confirmation closes. */
  onDelete: () => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <TrPanelEditorCard id="editor-sil" title="Ürünü sil" tone="danger">
      <p className={panelHintClass}>
        Bu işlem ürünü mağazadan kaldırır. Emin değilseniz dokunmayın.
      </p>
      {!confirming ? (
        <button
          type="button"
          disabled={disabled || deleting}
          onClick={() => setConfirming(true)}
          className={`${panelSecondaryBtnClass} w-full border-red-300 text-red-800 sm:w-auto`}
        >
          Ürünü sil
        </button>
      ) : (
        <div
          className="space-y-4 rounded-xl border border-red-300 bg-red-50 p-5"
          role="alertdialog"
          aria-labelledby="delete-product-title"
        >
          <p
            id="delete-product-title"
            className="text-[16px] font-semibold text-neutral-900"
          >
            Ürünü silmek istediğinize emin misiniz?
          </p>
          <p className="text-[14px] leading-relaxed text-neutral-700">
            <span className="font-semibold">{productTitle}</span> kalıcı olarak
            silinir. Bu işlem geri alınamaz.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={deleting}
              className={panelDangerBtnClass}
              onClick={() => {
                void onDelete().then((ok) => {
                  if (!ok) setConfirming(false);
                });
              }}
            >
              {deleting ? (
                <>
                  <TrPanelBusySpinner />
                  Siliniyor…
                </>
              ) : (
                "Evet, sil"
              )}
            </button>
            <button
              type="button"
              disabled={deleting}
              className={panelSecondaryBtnClass}
              onClick={() => setConfirming(false)}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </TrPanelEditorCard>
  );
}
