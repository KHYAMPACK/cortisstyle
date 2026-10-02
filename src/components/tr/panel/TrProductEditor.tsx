"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerColorGroupLinker } from "@/components/tr/panel/TrOwnerColorGroupLinker";
import { TrOwnerManualPhotoGallery } from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import { TrOwnerSizeChartStock } from "@/components/tr/panel/TrOwnerSizeChartStock";
import { TrProductAttributesFields } from "@/components/tr/panel/TrProductAttributesFields";
import {
  TrPanelEditorCard,
  TrPanelEditorSave,
  TrPanelEditorTabs,
} from "@/components/tr/panel/TrPanelEditor";
import { TrPanelCategoryPicker } from "@/components/tr/panel/TrPanelCategoryPicker";
import { TrPanelKindPicker } from "@/components/tr/panel/TrPanelKindPicker";
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
import { TrPanelLoading } from "@/components/tr/panel/TrPanelMotion";
import { TrProductImageLightbox } from "@/components/tr/panel/TrProductImageLightbox";
import { useOwnerSizeSources } from "@/components/tr/panel/useOwnerSizeSources";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  sanitizeStockInput,
} from "@/lib/tr/ownerProductConstraints";
import {
  createOwnerProductDetailed,
  deleteOwnerProduct,
  fetchOwnerAttributes,
  fetchOwnerProductKinds,
  updateOwnerProduct,
  type TrOwnerBoutiqueSummary,
} from "@/lib/tr/ownerClient";
import {
  effectiveStock,
  emptyProductForm,
  productFormFromProduct,
  productPatch,
  productPayload,
  validateProductForm,
  type ProductFormState,
} from "@/lib/tr/panel/productForm";
import { trPanelSettingsPath } from "@/lib/tr/paths";
import { missingRequiredField } from "@/lib/tr/productKinds/featureValues";
import type { TrAttributeDefinition, TrProductKind } from "@/lib/tr/productKinds/types";
import { findSizeSource, NO_SIZE_SOURCE, type TrSizeSource } from "@/lib/tr/sizeSources";
import { switchStockInputs } from "@/lib/tr/sizeStockInputs";
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

/** Tabs above the cards; each jumps to the card with the same id. */
function editorTabs(options: { variants: boolean; attributes: boolean }) {
  return [
    { id: "editor-temel", label: "Temel bilgi" },
    { id: "editor-medya", label: "Medya" },
    ...(options.variants ? [{ id: "editor-varyant", label: "Varyant" }] : []),
    { id: "editor-tur", label: "Ürün türü" },
    ...(options.attributes ? [{ id: "editor-ozellikler", label: "Özellikler" }] : []),
    { id: "editor-detay", label: "Ürün detayı" },
    { id: "editor-envanter", label: "Envanter" },
    { id: "editor-stok", label: "Stok" },
    { id: "editor-lokasyon", label: "Lokasyon" },
    { id: "editor-seo", label: "SEO" },
  ];
}

/** Read-only thumbnails of an AI-made shop gallery. */
function PhotoStrip({ urls }: { urls: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {urls.slice(0, 12).map((src) => (
        <div key={src} className="relative h-24 w-16 overflow-hidden rounded-lg bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-contain p-1" />
        </div>
      ))}
    </div>
  );
}

/**
 * The boutique's product kinds and fields, for the Tür picker and the Özellikler card.
 * Empty (not an error) when it has none or the kinds patch isn't applied.
 */
function useKindDefinitions(boutiqueId: string) {
  const [state, setState] = useState<{
    boutiqueId: string;
    kinds: TrProductKind[];
    attributes: TrAttributeDefinition[];
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchOwnerProductKinds(boutiqueId), fetchOwnerAttributes(boutiqueId)])
      .then(([kinds, attributes]) => {
        if (!cancelled) setState({ boutiqueId, kinds: kinds.kinds, attributes });
      })
      .catch(() => {
        if (!cancelled) setState({ boutiqueId, kinds: [], attributes: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);
  const loaded = state?.boutiqueId === boutiqueId;
  return {
    kinds: loaded ? state!.kinds : [],
    attributes: loaded ? state!.attributes : [],
    loaded,
  };
}

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

type ProductEditorProps = {
  boutiqueId: string;
  boutiqueSlug: string;
  /** The store's own domain, for the SEO preview. */
  customDomain?: string | null;
  /** "Ana adres" shown in the Lokasyon card. */
  address: string | null;
  product?: TrProduct;
  ownerOnly?: TrProductPrivate;
  /** The saved product's categories (edit). */
  initialCategories?: TrProductCategories;
  /** Create a Gelişmiş ürün (variants). */
  productType?: "simple" | "advanced";
  /** A Gelişmiş product's saved option types and variants (edit). */
  initialVariants?: TrProductVariants;
  onCreated?: (product: TrProduct, warning?: string) => void;
  onSaved?: (product: TrProduct) => void;
  onDeleted?: () => void;
};

/**
 * The product editor: every product, create and edit (foundation plan F3). Its kind
 * (Ürün türü card, picked like categories) decides the Özellikler fields; categories,
 * photos, prices, stock and SEO are the same for all. Stock is per variant for a product
 * with variants, else the size table (sizes, or one count). Saving is explicit (Kaydet in the top bar) and leaving with
 * unsaved edits asks first.
 *
 * The form reads the product against the boutique's size types and kinds, so it opens
 * once they are in (both are cached, usually instant).
 */
export function TrProductEditor(props: ProductEditorProps) {
  const { sources, loaded: sizesLoaded } = useOwnerSizeSources(props.boutiqueId);
  const definitions = useKindDefinitions(props.boutiqueId);
  if (!sizesLoaded || !definitions.loaded) {
    return <TrPanelLoading label="Ürün yükleniyor…" />;
  }
  return (
    <ProductEditorForm
      {...props}
      sizeSources={sources}
      kinds={definitions.kinds}
      attributes={definitions.attributes}
    />
  );
}

function ProductEditorForm({
  boutiqueId,
  boutiqueSlug,
  customDomain = null,
  address,
  product,
  ownerOnly,
  initialCategories,
  productType = "simple",
  initialVariants,
  onCreated,
  onSaved,
  onDeleted,
  sizeSources,
  kinds,
  attributes,
}: ProductEditorProps & {
  sizeSources: TrSizeSource[];
  kinds: TrProductKind[];
  attributes: TrAttributeDefinition[];
}) {
  const { categories, loaded: categoriesLoaded } = useOwnerCategories(boutiqueId);
  const facets = useOwnerProductFacets(boutiqueId);
  const [form, setForm] = useState<ProductFormState>(() => {
    const own = initialCategories ?? { ids: [], primaryId: null };
    if (product) {
      return productFormFromProduct(
        product,
        ownerOnly ?? EMPTY_PRODUCT_PRIVATE,
        own,
        initialVariants,
        sizeSources,
      );
    }
    // A new product takes its kind's suggestions when the kind is picked (`changeKind`).
    return emptyProductForm(own, productType);
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

  const change = (patch: Partial<ProductFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const save = async () => {
    if (saving || uploading) return;
    const problem =
      validateProductForm(form, { requireSlug: Boolean(product?.slug) }) ??
      missingRequiredField(kind, attributes, form.features);
    if (problem) {
      toast.error(problem);
      return;
    }

    const submitted = JSON.stringify(form);
    setSaving(true);
    try {
      if (!product) {
        const { product: created, warning } = await createOwnerProductDetailed(
          productPayload(form, boutiqueId, sizeSources),
        );
        setBaseline(submitted);
        // The toast outlives the redirect to the new product's page.
        if (warning) toast.warning(`Ürün eklendi, ancak: ${warning}`);
        else toast.success("Ürün eklendi.");
        onCreated?.(created, warning);
      } else {
        const saved = await updateOwnerProduct(
          product.id,
          productPatch(form, sizeSources),
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
  const zeroStock = Number.isFinite(totalStock) && totalStock === 0;
  const kind = kinds.find((entry) => entry.id === form.kindId) ?? null;
  const showAttributes = Boolean(kind && kind.attributes.length > 0);
  const tabs = editorTabs({ variants: advanced, attributes: showAttributes });

  const applySizeChart = (next: string) => {
    change({
      sizeChart: next,
      sizeStockInputs:
        next === NO_SIZE_SOURCE
          ? {}
          : switchStockInputs(
              findSizeSource(sizeSources, form.sizeChart),
              findSizeSource(sizeSources, next),
              form.sizeStockInputs,
            ),
    });
  };

  /**
   * Picks the product's kind. A new product also takes the kind's suggestions where it
   * has nothing yet: its category, and the size table of its first size type.
   */
  const changeKind = (kindId: string | null) => {
    const next = kinds.find((entry) => entry.id === kindId) ?? null;
    setForm((current) => {
      const patch: Partial<ProductFormState> = { kindId };
      if (!product && next) {
        const noCategory = !current.categories || current.categories.ids.length === 0;
        if (noCategory && next.suggestedCategoryId) {
          patch.categories = { ids: [next.suggestedCategoryId], primaryId: next.suggestedCategoryId };
        }
        const sizeType = next.defaultOptionTypeIds.find((id) => findSizeSource(sizeSources, id));
        if (sizeType && current.sizeChart === NO_SIZE_SOURCE && current.variants.rows.length === 0) {
          patch.sizeChart = sizeType;
          patch.sizeStockInputs = {};
        }
      }
      return { ...current, ...patch };
    });
  };

  /** An AI-made gallery becomes a plain list, in the shop's order (saved with Kaydet). */
  const editGeneratedPhotos = () => {
    if (!form.generatedGallery) return;
    change({ images: form.generatedGallery, generatedGallery: null, galleryConverted: true });
  };

  /** Linking a colour group saves on the server by itself: take its features as saved. */
  const applyLinkedGroup = (saved: TrProduct) => {
    const pick = (features: ProductFormState["features"]) => ({
      ...features,
      colorGroupId: saved.features?.colorGroupId,
      colorSiblingIds: saved.features?.colorSiblingIds,
    });
    setForm((current) => ({ ...current, features: pick(current.features) }));
    setBaseline((current) => {
      const parsed = JSON.parse(current) as ProductFormState;
      return JSON.stringify({ ...parsed, features: pick(parsed.features) });
    });
    onSaved?.(saved);
  };
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
                Teslimat
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
          {form.generatedGallery ? (
            <div className="space-y-3">
              <p className={panelHintClass}>
                Bu ürünün mağaza görselleri (packshot ve model kareleri) otomatik
                hazırlandı ve olduğu gibi kalır. Değiştirmek için “Fotoğrafları
                düzenle”ye basın: mağazadaki kareler bu sırayla listeye alınır; sonra
                ekleyip çıkarabilir, sırasını değiştirebilirsiniz.
              </p>
              <PhotoStrip urls={form.generatedGallery} />
              <button
                type="button"
                className={panelSecondaryBtnClass}
                disabled={saving || form.generatedGallery.length === 0}
                onClick={editGeneratedPhotos}
              >
                Fotoğrafları düzenle
              </button>
            </div>
          ) : (
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
              maxImages={
                advanced
                  ? TR_OWNER_PRODUCT_LIMITS.maxImagesAdvanced
                  : TR_OWNER_PRODUCT_LIMITS.maxImages
              }
            />
          )}
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
          id="editor-tur"
          title="Ürün türü"
          hint="Ürünün ne olduğu (Elbise, Pantolon…): Özellikler kartındaki alanları belirler."
        >
          <TrPanelKindPicker
            kinds={kinds}
            value={form.kindId}
            onChange={changeKind}
            disabled={saving}
          />
        </TrPanelEditorCard>

        {kind && showAttributes ? (
          <TrPanelEditorCard
            id="editor-ozellikler"
            title="Özellikler"
            hint={`${kind.name} türünün alanları; ürün sayfasında “Ürün özellikleri” olarak görünür.`}
            allowOverflow
          >
            <TrProductAttributesFields
              kind={kind}
              attributes={attributes}
              features={form.features}
              onChange={(features) => change({ features })}
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

          {form.categories ? (
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
          {hasVariants ? (
            <label className="block max-w-xs space-y-2">
              <span className={panelLabelClass}>Stok adedi</span>
              <input
                value={String(totalStock)}
                inputMode="numeric"
                disabled
                className={panelFieldClass}
              />
            </label>
          ) : (
            <TrOwnerSizeChartStock
              chart={form.sizeChart}
              onChartChange={applySizeChart}
              sources={sizeSources}
              stockInputs={form.sizeStockInputs}
              onStockInputsChange={(sizeStockInputs) => change({ sizeStockInputs })}
              stock={form.stock}
              onStockChange={(stock) => change({ stock: sanitizeStockInput(stock) })}
              allowCustomSizes
              onlyListedSizes={Boolean(product)}
            />
          )}
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

        {product && !hasVariants ? (
          <TrPanelEditorCard
            id="editor-renk-grubu"
            title="Renk grubu"
            hint="Aynı ürünün başka renkleri ayrı ürün olarak duruyorsa burada birbirine bağlayın; mağazada renk seçeneği olarak görünürler."
          >
            <TrOwnerColorGroupLinker
              boutiqueId={boutiqueId}
              product={{ ...product, title: form.title, features: form.features }}
              onLinked={applyLinkedGroup}
            />
          </TrPanelEditorCard>
        ) : null}

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
