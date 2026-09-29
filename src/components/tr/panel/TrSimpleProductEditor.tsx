"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerManualPhotoGallery } from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import {
  TrPanelEditorCard,
  TrPanelEditorSave,
  TrPanelEditorTabs,
} from "@/components/tr/panel/TrPanelEditor";
import { TrPanelCategoryPicker } from "@/components/tr/panel/TrPanelCategoryPicker";
import {
  TrPanelCreatableSelect,
  TrPanelTagsField,
} from "@/components/tr/panel/TrPanelCreatableSelect";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelSeoCard } from "@/components/tr/panel/TrPanelSeoCard";
import { TrProductVariantsCard } from "@/components/tr/panel/TrProductVariantsCard";
import { useOwnerCategories } from "@/components/tr/panel/useOwnerCategories";
import { useOwnerProductFacets } from "@/components/tr/panel/useOwnerProductFacets";
import {
  TrPanelPriceField,
  TrPanelProductDeleteCard,
  TrPanelProductStoreLink,
  TrPanelProductTitleField,
  TrPanelProductVisibilityField,
} from "@/components/tr/panel/TrPanelProductFields";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
} from "@/components/tr/panel/panelUi";
import {
  sanitizeStockInput,
} from "@/lib/tr/ownerProductConstraints";
import {
  createOwnerProductDetailed,
  deleteOwnerProduct,
  updateOwnerProduct,
  type TrOwnerBoutiqueSummary,
} from "@/lib/tr/ownerClient";
import {
  effectiveStock,
  emptySimpleProductForm,
  simpleFormFromProduct,
  simpleProductPatch,
  simpleProductPayload,
  validateSimpleProductForm,
  type SimpleProductFormState,
} from "@/lib/tr/panel/simpleProductForm";
import { trPanelSettingsPath } from "@/lib/tr/paths";
import {
  PRODUCT_DETAIL_LIMITS,
  parseDecimalInput,
  sanitizeDecimalInput,
} from "@/lib/tr/productDetails";
import { UNIT_TYPES, unitPricePerReference } from "@/lib/tr/productUnits";
import type { TrProductVariants } from "@/lib/tr/variants/types";
import type { TrProductCategories } from "@/lib/tr/categories/types";
import type { TrSeoFormValue } from "@/lib/tr/seo/seoFields";
import { toast } from "@/lib/tr/panel/toast";
import { slugify } from "@/lib/tr/seo/slug";
import { storeProductUrlPrefix } from "@/lib/tr/seo/storeAddress";
import {
  EMPTY_PRODUCT_PRIVATE,
  formatTryFromKurus,
  type TrFulfillmentType,
  type TrProduct,
  type TrProductPrivate,
  type TrUnitType,
} from "@/types/tr-marketplace";

/** "Ana adres" — the boutique's own address, from Ayarlar. */
export function boutiqueLocationAddress(
  boutique: Pick<TrOwnerBoutiqueSummary, "physicalAddress" | "shippingAddress">,
): string | null {
  return (
    boutique.physicalAddress?.trim() || boutique.shippingAddress?.trim() || null
  );
}

const TABS_BASIC = [
  { id: "editor-temel", label: "Temel bilgi" },
  { id: "editor-medya", label: "Medya" },
  { id: "editor-detay", label: "Ürün detayı" },
  { id: "editor-envanter", label: "Envanter" },
  { id: "editor-stok", label: "Stok" },
  { id: "editor-lokasyon", label: "Lokasyon" },
  { id: "editor-seo", label: "SEO" },
] as const;

/** A Gelişmiş ürün is the same plus a Varyant card after Medya. */
const TABS_ADVANCED = [
  TABS_BASIC[0],
  TABS_BASIC[1],
  { id: "editor-varyant", label: "Varyant" },
  ...TABS_BASIC.slice(2),
] as const;

// The editor is a sizeable bundle that only this page needs: load it on demand.
const TrPanelRichTextField = dynamic(
  () =>
    import("@/components/tr/panel/TrPanelRichTextField").then(
      (module) => module.TrPanelRichTextField,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[12rem] animate-pulse rounded-lg border border-neutral-200 bg-neutral-50"
        aria-hidden
      />
    ),
  },
);

const FULFILLMENT_OPTIONS: Array<{ id: TrFulfillmentType; label: string }> = [
  { id: "physical", label: "Fiziksel" },
  { id: "digital", label: "Dijital" },
];

/**
 * The Basit and Gelişmiş ürün editor. A Basit ürün has one price and one stock count; a
 * Gelişmiş ürün is the same plus a Varyant card, and sells like a Basit ürün until it has
 * variants. Creates when `product` is absent, edits otherwise. Saving is explicit (Kaydet
 * in the top bar) and leaving with unsaved edits asks first.
 */
export function TrSimpleProductEditor({
  boutiqueId,
  boutiqueSlug,
  customDomain = null,
  address,
  product,
  ownerOnly,
  categoryMode = "legacy",
  initialCategories,
  productType = "simple",
  initialVariants,
  onCreated,
  onSaved,
  onDeleted,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  /** The store's own domain, for the SEO preview. */
  customDomain?: string | null;
  /** "Ana adres" shown in the Lokasyon card. */
  address: string | null;
  product?: TrProduct;
  ownerOnly?: TrProductPrivate;
  /** `custom`: the boutique manages its own categories and the editor shows the picker. */
  categoryMode?: "legacy" | "custom";
  /** The saved product's categories (edit). */
  initialCategories?: TrProductCategories;
  /** Which editor to create; an existing product's own type wins. */
  productType?: "simple" | "advanced";
  /** A Gelişmiş product's saved option types and variants (edit). */
  initialVariants?: TrProductVariants;
  onCreated?: (product: TrProduct, warning?: string) => void;
  onSaved?: (product: TrProduct) => void;
  onDeleted?: () => void;
}) {
  const managesCategories = categoryMode === "custom";
  const { categories, loaded: categoriesLoaded } = useOwnerCategories(
    boutiqueId,
    managesCategories,
  );
  const facets = useOwnerProductFacets(boutiqueId);
  const [form, setForm] = useState<SimpleProductFormState>(() => {
    const own = managesCategories
      ? (initialCategories ?? { ids: [], primaryId: null })
      : null;
    return product
      ? simpleFormFromProduct(
          product,
          ownerOnly ?? EMPTY_PRODUCT_PRIVATE,
          own,
          initialVariants,
        )
      : emptySimpleProductForm(own, productType);
  });
  const [baseline, setBaseline] = useState(() => JSON.stringify(form));
  // The rich-text field owns its content after the first load.
  const [initialDescription] = useState(() => form.descriptionHtml);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(
    null,
  );

  const dirty = JSON.stringify(form) !== baseline;
  useUnsavedChangesGuard(
    "simple-product-editor",
    dirty || saving || uploading || deleting,
  );

  const change = (patch: Partial<SimpleProductFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const save = async () => {
    if (saving || uploading) return;
    const problem = validateSimpleProductForm(form, {
      requireSlug: Boolean(product?.slug),
    });
    if (problem) {
      toast.error(problem);
      return;
    }

    const submitted = JSON.stringify(form);
    setSaving(true);
    try {
      if (!product) {
        const { product: created, warning } = await createOwnerProductDetailed(
          simpleProductPayload(form, boutiqueId),
        );
        setBaseline(submitted);
        // The toast outlives the redirect to the new product's page.
        if (warning) toast.warning(`Ürün eklendi, ancak: ${warning}`);
        else toast.success("Ürün eklendi.");
        onCreated?.(created, warning);
      } else {
        const saved = await updateOwnerProduct(
          product.id,
          simpleProductPatch(form),
        );
        setBaseline(submitted);
        setSavedOnce(true);
        toast.success("Ürün kaydedildi.");
        onSaved?.(saved);
      }
    } catch (saveError) {
      toast.error(saveError, "Ürün kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (): Promise<boolean> => {
    if (!product) return false;
    setDeleting(true);
    try {
      const result = await deleteOwnerProduct(product.id);
      // A product with past orders is hidden instead of deleted: say so.
      if (result.message) toast.warning(result.message);
      else toast.success("Ürün silindi.");
      // Nothing left to lose: release the leave guard before navigating away.
      setBaseline(JSON.stringify(form));
      onDeleted?.();
      return true;
    } catch (deleteError) {
      toast.error(deleteError, "Ürün silinemedi.");
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const advanced = form.productType === "advanced";
  const hasVariants = form.variants.rows.length > 0;
  const totalStock = effectiveStock(form);
  const zeroStock = hasVariants
    ? totalStock === 0
    : form.stock.trim() !== "" && Number(form.stock) === 0;
  const tabs = advanced ? TABS_ADVANCED : TABS_BASIC;
  const unitPreview = useMemo(() => {
    const sellPrice =
      parseDecimalInput(form.salePriceTry) ?? parseDecimalInput(form.priceTry);
    if (!form.unitPriceEnabled || sellPrice === null || sellPrice <= 0) return null;
    const perReference = unitPricePerReference(Math.round(sellPrice * 100), {
      enabled: true,
      amount: parseDecimalInput(form.unitAmount),
      type: form.unitType,
    });
    return perReference
      ? `${formatTryFromKurus(perReference.perKurus)} / ${perReference.symbol}`
      : null;
  }, [
    form.priceTry,
    form.salePriceTry,
    form.unitAmount,
    form.unitPriceEnabled,
    form.unitType,
  ]);
  const changeSeo = (patch: Partial<TrSeoFormValue>) =>
    change({ seo: { ...form.seo, ...patch } });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-5"
    >
      {product && product.status === "available" ? (
        <TrPanelProductStoreLink boutiqueSlug={boutiqueSlug} productId={product.id} />
      ) : null}
      <TrPanelEditorSave
        dirty={dirty}
        saving={saving}
        saved={savedOnce}
        requireDirty={Boolean(product)}
        disabled={uploading || deleting}
        onSave={() => void save()}
      />

      <TrPanelEditorTabs tabs={tabs} />

      <div className="space-y-5">
        <TrPanelEditorCard
          id="editor-temel"
          title="Temel bilgi"
          hint="Mağazada görünen ad, fiyat ve satış durumu."
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <TrPanelProductTitleField
              value={form.title}
              onChange={(title) => change({ title })}
            />
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
            <TrPanelPriceField
              label="Satış fiyatı"
              required
              value={form.priceTry}
              onChange={(priceTry) => change({ priceTry })}
            />
            <TrPanelPriceField
              label="İndirimli fiyat"
              value={form.salePriceTry}
              onChange={(salePriceTry) => change({ salePriceTry })}
              hint="Doluysa müşteri bunu öder; satış fiyatı üstü çizili görünür."
            />
            <TrPanelPriceField
              label="Alış fiyatı"
              value={form.costPriceTry}
              onChange={(costPriceTry) => change({ costPriceTry })}
              hint="Yalnızca siz görürsünüz."
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 text-[14px] text-neutral-800">
              <input
                type="checkbox"
                checked={form.unitPriceEnabled}
                onChange={(event) => change({ unitPriceEnabled: event.target.checked })}
                className="h-4 w-4 accent-[color:var(--panel-accent)]"
              />
              Birim fiyat göster
            </label>
            {form.unitPriceEnabled ? (
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
                <label className="block space-y-2">
                  <span className={panelLabelClass}>Ürün miktarı</span>
                  <input
                    value={form.unitAmount}
                    onChange={(event) =>
                      change({ unitAmount: sanitizeDecimalInput(event.target.value, 3, 7) })
                    }
                    inputMode="decimal"
                    className={panelFieldClass}
                  />
                </label>
                <label className="block space-y-2">
                  <span className={panelLabelClass}>Birim</span>
                  <select
                    value={form.unitType}
                    onChange={(event) => change({ unitType: event.target.value as TrUnitType })}
                    className={panelFieldClass}
                  >
                    {UNIT_TYPES.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="space-y-2">
                  <span className={panelLabelClass}>Birim fiyat</span>
                  <p className="flex min-h-11 items-center rounded-lg bg-neutral-50 px-3 text-[14px] font-medium text-neutral-800 lg:min-h-9 lg:text-[13px]">
                    {unitPreview ?? "—"}
                  </p>
                </div>
              </div>
            ) : null}
            <p className={panelHintClass}>
              Ürünün miktarına göre kg / litre / metre başına fiyatı hesaplar.
              Şimdilik yalnızca kaydedilir; mağaza sayfası henüz göstermiyor.
            </p>
          </div>

          <TrPanelProductVisibilityField
            hidden={form.hidden}
            onChange={(hidden) => change({ hidden })}
          />
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
            onError={(message) => {
              if (message) toast.error(message);
            }}
            onLightbox={setLightbox}
            disabled={saving}
            uploading={uploading}
            onUploadingChange={setUploading}
          />
        </TrPanelEditorCard>

        {advanced ? (
          <TrPanelEditorCard
            id="editor-varyant"
            title="Varyant"
            hint="Renk, beden gibi seçeneklerin her kombinasyonu ayrı SKU, fiyat ve stokla satılabilir. Varyant eklemezseniz ürün tek fiyat ve tek stokla satılır."
          >
            <TrProductVariantsCard
              boutiqueId={boutiqueId}
              variants={form.variants}
              onChange={(variants) => change({ variants })}
              productImages={form.images}
              productPrice={form.priceTry}
              disabled={saving}
            />
          </TrPanelEditorCard>
        ) : null}

        <TrPanelEditorCard
          id="editor-detay"
          title="Ürün detayı"
          hint="Ürünü tanımlayan bilgiler. Şimdilik kaydedilir; mağaza sayfası ve Google akışı henüz bunları kullanmıyor."
          allowOverflow
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TrPanelCreatableSelect
              label="Marka"
              value={form.brand}
              onChange={(brand) => change({ brand })}
              options={facets.brands}
              maxLength={PRODUCT_DETAIL_LIMITS.brandMax}
              disabled={saving}
            />
            <TrPanelTagsField
              label="Etiket"
              values={form.tags}
              onChange={(tags) => change({ tags })}
              options={facets.tags}
              maxItems={PRODUCT_DETAIL_LIMITS.tagsMax}
              maxLength={PRODUCT_DETAIL_LIMITS.tagMax}
              disabled={saving}
            />
            <label className="block space-y-2">
              <span className={panelLabelClass}>Google ürün kategorisi</span>
              <input
                value={form.googleCategory}
                onChange={(event) => change({ googleCategory: event.target.value })}
                maxLength={PRODUCT_DETAIL_LIMITS.googleCategoryMax}
                placeholder="Giyim ve Aksesuar > Giyim"
                className={panelFieldClass}
              />
              <span className={`block ${panelHintClass}`}>
                Google Alışveriş&apos;teki kategori adı.
              </span>
            </label>
            <TrPanelCreatableSelect
              label="Tedarikçi"
              value={form.supplier}
              onChange={(supplier) => change({ supplier })}
              options={facets.suppliers}
              maxLength={PRODUCT_DETAIL_LIMITS.supplierMax}
              hint="Yalnızca siz görürsünüz."
              disabled={saving}
            />
          </div>

          {managesCategories && form.categories ? (
            <div className="space-y-2">
              <p className={panelLabelClass}>Kategori</p>
              {categoriesLoaded ? (
                <TrPanelCategoryPicker
                  categories={categories}
                  value={form.categories}
                  onChange={(next) => change({ categories: next })}
                  disabled={saving}
                />
              ) : (
                <p className={panelHintClass}>Kategoriler yükleniyor…</p>
              )}
              <p className={panelHintClass}>
                Ürünün listelendiği kategoriler; biri ana kategoridir.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <p id="simple-product-description-label" className={panelLabelClass}>
              Açıklama
            </p>
            <TrPanelRichTextField
              initialHtml={initialDescription}
              onChange={(descriptionHtml) => change({ descriptionHtml })}
              placeholder="Ürünü anlatın: malzeme, ölçüler, bakım…"
              disabled={saving}
              labelledBy="simple-product-description-label"
            />
          </div>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-envanter"
          title="Envanter"
          hint="Stok kodları ve kargo bilgisi. Şimdilik kaydedilir; kargo etiketi ve Google akışı henüz kullanmıyor."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className={panelLabelClass}>SKU</span>
              <input
                value={form.sku}
                onChange={(event) => change({ sku: event.target.value })}
                maxLength={PRODUCT_DETAIL_LIMITS.skuMax}
                disabled={hasVariants}
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Barkod</span>
              <input
                value={form.barcode}
                onChange={(event) => change({ barcode: event.target.value })}
                maxLength={PRODUCT_DETAIL_LIMITS.barcodeMax}
                disabled={hasVariants}
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Kargo: desi</span>
              <input
                value={form.desi}
                onChange={(event) =>
                  change({ desi: sanitizeDecimalInput(event.target.value, 2, 4) })
                }
                inputMode="decimal"
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>HS kodu</span>
              <input
                value={form.hsCode}
                onChange={(event) =>
                  change({ hsCode: event.target.value.replace(/[^\d. ]/g, "") })
                }
                maxLength={PRODUCT_DETAIL_LIMITS.hsCodeMax}
                inputMode="numeric"
                className={panelFieldClass}
              />
              <span className={`block ${panelHintClass}`}>
                Gümrük tarife kodu. Yalnızca siz görürsünüz.
              </span>
            </label>
          </div>
          {hasVariants ? (
            <p className={panelHintClass}>
              Ürünün varyantları var: SKU ve barkod her varyant için Varyant kartındaki
              tabloda girilir.
            </p>
          ) : null}
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-stok"
          title="Stok"
          hint="Kaç adet satabileceğiniz."
        >
          <label className="block max-w-xs space-y-2">
            <span className={panelLabelClass}>Stok adedi</span>
            <input
              value={hasVariants ? String(totalStock) : form.stock}
              onChange={(event) =>
                change({ stock: sanitizeStockInput(event.target.value) })
              }
              inputMode="numeric"
              disabled={hasVariants}
              className={panelFieldClass}
            />
          </label>
          <p className={panelHintClass}>
            {hasVariants
              ? "Toplam stok, aktif varyantların stoklarının toplamıdır; stoğu Varyant kartından düzenleyin."
              : zeroStock && !form.hidden
                ? "Stok 0 olduğu için ürün mağazada “Satıldı” görünür."
                : "Sipariş geldikçe otomatik düşer."}
          </p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-3 text-[14px] text-neutral-800">
              <input
                type="checkbox"
                checked={form.continueSelling}
                onChange={(event) => change({ continueSelling: event.target.checked })}
                className="h-4 w-4 accent-[color:var(--panel-accent)]"
              />
              Stoğu tükenince satmaya devam et
            </label>
            <p className={panelHintClass}>
              Şimdilik yalnızca kaydedilir: mağaza stoğu biten ürünü yine
              “Satıldı” gösterir.
            </p>
          </div>
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

        <TrPanelSeoCard
          id="editor-seo"
          value={form.seo}
          onChange={changeSeo}
          entityName={form.title}
          urlPrefix={storeProductUrlPrefix({ boutiqueSlug, customDomain })}
          suggestedSlug={product ? "" : slugify(form.title)}
        />

        {product ? (
          <TrPanelProductDeleteCard
            productTitle={product.title}
            disabled={saving || uploading}
            deleting={deleting}
            onDelete={remove}
          />
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
