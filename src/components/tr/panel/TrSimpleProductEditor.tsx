"use client";

import { useEffect, useState } from "react";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerManualPhotoGallery } from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import {
  TrPanelEditorActions,
  TrPanelEditorCard,
  TrPanelEditorSave,
  TrPanelEditorTabs,
} from "@/components/tr/panel/TrPanelEditor";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import {
  panelChipClass,
  panelDangerBtnClass,
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  clampTitle,
  sanitizeStockInput,
  sanitizeTryPriceInput,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import {
  createOwnerProductDetailed,
  deleteOwnerProduct,
  updateOwnerProduct,
  type TrOwnerBoutiqueSummary,
} from "@/lib/tr/ownerClient";
import {
  emptySimpleProductForm,
  simpleFormFromProduct,
  simpleProductPatch,
  simpleProductPayload,
  validateSimpleProductForm,
  type SimpleProductFormState,
} from "@/lib/tr/panel/simpleProductForm";
import { trBoutiqueProductPath, trPanelSettingsPath } from "@/lib/tr/paths";
import type {
  TrFulfillmentType,
  TrProduct,
  TrProductPrivate,
} from "@/types/tr-marketplace";

/** One-shot message handed from the create page to the edit page it redirects to. */
export const SIMPLE_PRODUCT_NOTICE_KEY = "tr-panel-simple-product-notice";

/** "Ana adres" — the boutique's own address, from Ayarlar. */
export function boutiqueLocationAddress(
  boutique: Pick<TrOwnerBoutiqueSummary, "physicalAddress" | "shippingAddress">,
): string | null {
  return (
    boutique.physicalAddress?.trim() || boutique.shippingAddress?.trim() || null
  );
}

const TABS = [
  { id: "editor-temel", label: "Temel bilgi" },
  { id: "editor-medya", label: "Medya" },
  { id: "editor-stok", label: "Stok" },
  { id: "editor-lokasyon", label: "Lokasyon" },
] as const;

const FULFILLMENT_OPTIONS: Array<{ id: TrFulfillmentType; label: string }> = [
  { id: "physical", label: "Fiziksel" },
  { id: "digital", label: "Dijital" },
];

function PriceField({
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

/**
 * The Basit ürün editor: one price, one stock count. Creates when `product` is
 * absent, edits otherwise. Saving is explicit (Kaydet in the top bar) and leaving
 * with unsaved edits asks first.
 */
export function TrSimpleProductEditor({
  boutiqueId,
  boutiqueSlug,
  address,
  product,
  ownerOnly,
  onCreated,
  onSaved,
  onDeleted,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  /** "Ana adres" shown in the Lokasyon card. */
  address: string | null;
  product?: TrProduct;
  ownerOnly?: TrProductPrivate;
  onCreated?: (product: TrProduct, warning?: string) => void;
  onSaved?: (product: TrProduct) => void;
  onDeleted?: () => void;
}) {
  const [form, setForm] = useState<SimpleProductFormState>(() =>
    product
      ? simpleFormFromProduct(product, ownerOnly ?? { costPriceKurus: null })
      : emptySimpleProductForm(),
  );
  const [baseline, setBaseline] = useState(() => JSON.stringify(form));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(
    null,
  );
  const [notice] = useState<string | null>(() => {
    if (!product || typeof window === "undefined") return null;
    try {
      return window.sessionStorage.getItem(SIMPLE_PRODUCT_NOTICE_KEY);
    } catch {
      return null;
    }
  });

  // Show the hand-over message once: clear it after it has been read.
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(SIMPLE_PRODUCT_NOTICE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const dirty = JSON.stringify(form) !== baseline;
  useUnsavedChangesGuard(
    "simple-product-editor",
    dirty || saving || uploading || deleting,
  );

  const change = (patch: Partial<SimpleProductFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const save = async () => {
    if (saving || uploading) return;
    const problem = validateSimpleProductForm(form);
    if (problem) {
      setError(problem);
      return;
    }

    const submitted = JSON.stringify(form);
    setSaving(true);
    setError(null);
    try {
      if (!product) {
        const { product: created, warning } = await createOwnerProductDetailed(
          simpleProductPayload(form, boutiqueId),
        );
        setBaseline(submitted);
        onCreated?.(created, warning);
      } else {
        const saved = await updateOwnerProduct(
          product.id,
          simpleProductPatch(form),
        );
        setBaseline(submitted);
        setSavedOnce(true);
        onSaved?.(saved);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!product) return;
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteOwnerProduct(product.id);
      if (result.message) {
        try {
          window.sessionStorage.setItem(
            "tr-panel-product-delete-notice",
            result.message,
          );
        } catch {
          /* ignore */
        }
      }
      // Nothing left to lose: release the leave guard before navigating away.
      setBaseline(JSON.stringify(form));
      onDeleted?.();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Ürün silinemedi.",
      );
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const zeroStock = form.stock.trim() !== "" && Number(form.stock) === 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-5"
    >
      {product && product.status === "available" ? (
        <TrPanelEditorActions>
          <a
            href={trBoutiqueProductPath(boutiqueSlug, product.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 items-center rounded-lg border border-white/15 px-3 text-[13px] font-medium text-white/85 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 motion-reduce:transition-none md:inline-flex"
          >
            Mağazada gör
          </a>
        </TrPanelEditorActions>
      ) : null}
      <TrPanelEditorSave
        dirty={dirty}
        saving={saving}
        saved={savedOnce}
        requireDirty={Boolean(product)}
        disabled={uploading || deleting}
        onSave={() => void save()}
      />

      <TrPanelEditorTabs tabs={TABS} />

      {notice ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
          {notice}
        </p>
      ) : null}
      {error ? <p className={panelErrorClass}>{error}</p> : null}

      <div className="space-y-5">
        <TrPanelEditorCard
          id="editor-temel"
          title="Temel bilgi"
          hint="Mağazada görünen ad, fiyat ve satış durumu."
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <label className="block space-y-2">
              <span className={panelLabelClass}>
                Ürün adı
                <span className="text-[color:var(--panel-accent)]"> *</span>
              </span>
              <input
                value={form.title}
                onChange={(event) =>
                  change({ title: clampTitle(event.target.value) })
                }
                maxLength={TR_OWNER_PRODUCT_LIMITS.titleMax}
                className={panelFieldClass}
              />
              <span className={`block ${panelHintClass}`}>
                {form.title.length}/{TR_OWNER_PRODUCT_LIMITS.titleMax}
              </span>
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>
                Ürün türü
                <span className="text-[color:var(--panel-accent)]"> *</span>
              </span>
              <select
                value={form.fulfillmentType}
                onChange={(event) =>
                  change({
                    fulfillmentType: event.target.value as TrFulfillmentType,
                  })
                }
                className={panelFieldClass}
              >
                {FULFILLMENT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {form.fulfillmentType === "digital" ? (
            <p className={panelHintClass}>
              Şimdilik yalnızca kayıt amaçlıdır: dijital ürünler de normal ödeme
              ve kargo akışından geçer.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <PriceField
              label="Satış fiyatı"
              required
              value={form.priceTry}
              onChange={(priceTry) => change({ priceTry })}
            />
            <PriceField
              label="İndirimli fiyat"
              value={form.salePriceTry}
              onChange={(salePriceTry) => change({ salePriceTry })}
              hint="Doluysa müşteri bunu öder; satış fiyatı üstü çizili görünür."
            />
            <PriceField
              label="Alış fiyatı"
              value={form.costPriceTry}
              onChange={(costPriceTry) => change({ costPriceTry })}
              hint="Yalnızca siz görürsünüz."
            />
          </div>

          <div className="space-y-2">
            <p className={panelLabelClass}>Durum</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={panelChipClass(!form.hidden)}
                onClick={() => change({ hidden: false })}
              >
                Satışta
              </button>
              <button
                type="button"
                className={panelChipClass(form.hidden)}
                onClick={() => change({ hidden: true })}
              >
                Gizli
              </button>
            </div>
            <p className={panelHintClass}>
              Satışta görünür, gizlide mağazada çıkmaz.
            </p>
          </div>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-medya"
          title="Medya"
          hint="Fotoğraflar mağazada bu sırayla görünür; ilk fotoğraf kapak olur."
        >
          <TrOwnerManualPhotoGallery
            boutiqueId={boutiqueId}
            images={form.images}
            onImagesChange={(images) => change({ images })}
            onError={setError}
            onLightbox={setLightbox}
            disabled={saving}
            uploading={uploading}
            onUploadingChange={setUploading}
          />
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-stok"
          title="Stok"
          hint="Kaç adet satabileceğiniz."
        >
          <label className="block max-w-xs space-y-2">
            <span className={panelLabelClass}>Stok adedi</span>
            <input
              value={form.stock}
              onChange={(event) =>
                change({ stock: sanitizeStockInput(event.target.value) })
              }
              inputMode="numeric"
              className={panelFieldClass}
            />
          </label>
          <p className={panelHintClass}>
            {zeroStock && !form.hidden
              ? "Stok 0 olduğu için ürün mağazada “Satıldı” görünür."
              : "Sipariş geldikçe otomatik düşer."}
          </p>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-lokasyon"
          title="Lokasyon"
          hint="Ürünün bulunduğu adres."
        >
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-[13px] font-medium text-neutral-500">Ana adres</p>
            <p className="mt-1 text-[14px] whitespace-pre-line text-neutral-900">
              {address ?? "Henüz adres girilmedi."}
            </p>
          </div>
          <p className={panelHintClass}>
            Adres, Ayarlar sayfasındaki “Adres” alanından gelir ve şimdilik
            yalnızca bilgi amaçlıdır.{" "}
            <Link
              href={trPanelSettingsPath()}
              className="font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
            >
              {address ? "Adresi düzenle" : "Adres ekle"}
            </Link>
          </p>
        </TrPanelEditorCard>

        {product ? (
          <TrPanelEditorCard id="editor-sil" title="Ürünü sil" tone="danger">
            <p className={panelHintClass}>
              Bu işlem ürünü mağazadan kaldırır. Emin değilseniz dokunmayın.
            </p>
            {!confirmDelete ? (
              <button
                type="button"
                disabled={saving || uploading || deleting}
                onClick={() => setConfirmDelete(true)}
                className={`${panelSecondaryBtnClass} w-full border-red-300 text-red-800 sm:w-auto`}
              >
                Ürünü sil
              </button>
            ) : (
              <div
                className="space-y-4 rounded-xl border border-red-300 bg-red-50 p-5"
                role="alertdialog"
                aria-labelledby="delete-simple-product-title"
              >
                <p
                  id="delete-simple-product-title"
                  className="text-[16px] font-semibold text-neutral-900"
                >
                  Ürünü silmek istediğinize emin misiniz?
                </p>
                <p className="text-[14px] leading-relaxed text-neutral-700">
                  <span className="font-semibold">{product.title}</span> kalıcı
                  olarak silinir. Bu işlem geri alınamaz.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={deleting}
                    className={panelDangerBtnClass}
                    onClick={() => void remove()}
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
                    onClick={() => setConfirmDelete(false)}
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}
          </TrPanelEditorCard>
        ) : null}
      </div>

      <TrProductImageLightbox
        open={Boolean(lightbox)}
        src={lightbox?.src ?? null}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </form>
  );
}
