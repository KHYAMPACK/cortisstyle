"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { TrCatalogBackgroundPicker } from "@/components/tr/panel/TrCatalogBackgroundPicker";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerCategoryPicker } from "@/components/tr/panel/TrOwnerCategoryPicker";
import { TrOwnerColorGroupLinker } from "@/components/tr/panel/TrOwnerColorGroupLinker";
import { TrOwnerManualPhotoGallery } from "@/components/tr/panel/TrOwnerManualPhotoGallery";
import { TrOwnerProductFeaturesFields } from "@/components/tr/panel/TrOwnerProductFeaturesFields";
import { TrOwnerSizeChartStock } from "@/components/tr/panel/TrOwnerSizeChartStock";
import {
  TrPanelEditorCard,
  TrPanelEditorSave,
  TrPanelEditorTabs,
} from "@/components/tr/panel/TrPanelEditor";
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
  panelAddChipClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { shopperGalleryUrls } from "@/lib/tr/catalog/productImages";
import { TR_BOUTIQUE_CATEGORIES } from "@/lib/tr/fashion/categories";
import {
  fashionFormFacts,
  fashionFormFromProduct,
  fashionFormStock,
  fashionProductPatch,
  fashionServerSavedFields,
  rebaseFashionForm,
  validateFashionProductForm,
  type FashionProductFormState,
  type FashionServerSavedFields,
} from "@/lib/tr/fashion/productForm";
import { deleteOwnerProduct, updateOwnerProduct } from "@/lib/tr/ownerClient";
import {
  clampDescription,
  sanitizeColorName,
  TR_OWNER_PRODUCT_LIMITS,
} from "@/lib/tr/ownerProductConstraints";
import { toast } from "@/lib/tr/panel/toast";
import { findSizeSource, NO_SIZE_SOURCE, type TrSizeSource } from "@/lib/tr/sizeSources";
import { switchStockInputs } from "@/lib/tr/sizeStockInputs";
import { slugify } from "@/lib/tr/seo/slug";
import type { TrProduct, TrProductColor } from "@/types/tr-marketplace";

const PRESET_COLORS: TrProductColor[] = [
  { name: "Siyah", hex: "#1A1A1A" },
  { name: "Beyaz", hex: "#F5F5F5" },
  { name: "Lacivert", hex: "#1E3A5F" },
  { name: "Kahverengi", hex: "#6B4423" },
  { name: "Bej", hex: "#D4C4A8" },
  { name: "Kırmızı", hex: "#B71C1C" },
  { name: "Pembe", hex: "#C2185B" },
  { name: "Yeşil", hex: "#2E5A3C" },
];

/** Tabs above the cards; each jumps to the card with the same id. "Ürünü sil" has no tab. */
const EDIT_TABS = [
  { id: "editor-temel", label: "Temel bilgi" },
  { id: "editor-medya", label: "Medya" },
  { id: "editor-detay", label: "Ürün detayı" },
  { id: "editor-envanter", label: "Envanter" },
] as const;

/** Read-only thumbnails of photos the editor doesn't change directly. */
function PhotoStrip({ urls }: { urls: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {urls
        .filter((url) => Boolean(url?.trim()))
        .slice(0, 8)
        .map((src) => (
          <div
            key={src}
            className="relative h-24 w-16 overflow-hidden rounded-lg bg-neutral-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-contain p-1" />
          </div>
        ))}
    </div>
  );
}

function OptionToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[color:var(--panel-accent)]" : "bg-neutral-300"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/**
 * The garment (fashion) product editor. Saves explicitly (Kaydet in the top bar,
 * Ctrl/Cmd+S) and asks before leaving with unsaved edits, like every other panel form.
 * The form rules and the save body are in `lib/tr/fashion/productForm.ts`.
 *
 * Photos: a product added by hand has a plain gallery. A product whose shop photos
 * were made by the (parked) AI pipeline keeps them as they are until the owner chooses
 * "Fotoğrafları düzenle", which turns the shop's current gallery into a plain list.
 *
 * Linking a colour group saves on the server by itself; its result is folded into the
 * form's baseline with `rebaseFashionForm`, so it isn't reported as unsaved and a later
 * Kaydet doesn't undo it, while the owner's own unsaved edits are kept.
 */
type FashionProductEditorProps = {
  boutiqueId: string;
  boutiqueSlug: string;
  initialProduct: TrProduct;
  onSaved: (product: TrProduct) => void;
  onDeleted?: () => void;
};

export function TrFashionProductEditor(props: FashionProductEditorProps) {
  // The size table offers the boutique's Beden types; the form reads a product's sizes
  // against them, so it opens once they are in (the list is cached, usually instant).
  const { sources, loaded } = useOwnerSizeSources(props.boutiqueId);
  if (!loaded) {
    return <TrPanelLoading label="Ürün yükleniyor…" />;
  }
  return <FashionProductEditorForm {...props} sizeSources={sources} />;
}

function FashionProductEditorForm({
  boutiqueId,
  boutiqueSlug,
  initialProduct,
  onSaved,
  onDeleted,
  sizeSources,
}: FashionProductEditorProps & { sizeSources: TrSizeSource[] }) {
  const [state, setState] = useState(() => {
    const loaded = fashionFormFromProduct(initialProduct, sizeSources);
    return { form: loaded, baseline: loaded };
  });
  const { form, baseline } = state;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(
    null,
  );
  const [extraCategories, setExtraCategories] = useState<
    Array<{ id: string; label: string }>
  >(() =>
    initialProduct.category &&
    !TR_BOUTIQUE_CATEGORIES.some((entry) => entry.id === initialProduct.category)
      ? [
          {
            id: initialProduct.category,
            label: initialProduct.category.replace(/-/g, " "),
          },
        ]
      : [],
  );
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [addingColor, setAddingColor] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#C2185B");

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  useUnsavedChangesGuard(
    "fashion-product-editor",
    dirty || saving || uploading || deleting,
  );

  const change = useCallback((patch: Partial<FashionProductFormState>) => {
    setState((current) => ({ ...current, form: { ...current.form, ...patch } }));
  }, []);
  /** An action saved these fields on the server: make them the baseline. */
  const rebase = useCallback((server: FashionServerSavedFields) => {
    setState((current) => rebaseFashionForm(current, server));
  }, []);

  const { takim, elbise, family } = fashionFormFacts(form);
  const stockTotal = fashionFormStock(form);
  // What the shop shows for an AI-made product (model shots, then packshots).
  const shopGallery = useMemo(
    () =>
      shopperGalleryUrls({
        images: form.images,
        marketplaceImages: form.marketplaceImages,
        lifestyleImages: form.lifestyleImages,
        features: form.features,
      }),
    [form.images, form.marketplaceImages, form.lifestyleImages, form.features],
  );
  const hasGeneratedImages =
    form.marketplaceImages.some((url) => url?.trim()) ||
    form.lifestyleImages.some((url) => url?.trim());

  /**
   * An AI-made product's photos become a plain list: the shop's current gallery, in
   * its order. Saved with Kaydet like any other edit; until then it can be undone by
   * leaving without saving.
   */
  const editGeneratedPhotos = () => {
    change({
      manualMode: true,
      images: shopGallery,
      marketplaceImages: [],
      lifestyleImages: [],
    });
  };

  const categoryOptions = useMemo(() => {
    const seen = new Set(TR_BOUTIQUE_CATEGORIES.map((entry) => entry.id));
    return extraCategories.filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  }, [extraCategories]);

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

  const toggleColor = (color: TrProductColor) => {
    const exists = form.colors.some(
      (entry) => entry.hex.toLowerCase() === color.hex.toLowerCase(),
    );
    change({
      colors: exists
        ? form.colors.filter(
            (entry) => entry.hex.toLowerCase() !== color.hex.toLowerCase(),
          )
        : [...form.colors, color],
    });
  };

  const commitCategory = () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const id = slugify(label).slice(0, 40) || `kategori-${Date.now()}`;
    const existing = categoryOptions.find(
      (entry) =>
        entry.id === id ||
        entry.label.toLocaleLowerCase("tr") === label.toLocaleLowerCase("tr"),
    );
    if (existing) {
      change({ category: existing.id });
    } else {
      setExtraCategories((current) => [...current, { id, label }]);
      change({ category: id });
    }
    setNewCategoryLabel("");
    setAddingCategory(false);
  };

  const commitColor = () => {
    const name = sanitizeColorName(newColorName).trim();
    let hex = newColorHex.trim();
    if (!name) return;
    if (!hex.startsWith("#")) hex = `#${hex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      toast.error("Renk için geçerli bir hex kodu girin (ör. #C2185B).");
      return;
    }
    toggleColor({ name, hex: hex.toUpperCase() });
    setNewColorName("");
    setNewColorHex("#C2185B");
    setAddingColor(false);
  };

  const save = async () => {
    if (saving || uploading) return;
    const problem = validateFashionProductForm(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    const submitted = form;
    setSaving(true);
    try {
      const saved = await updateOwnerProduct(
        initialProduct.id,
        fashionProductPatch(submitted, sizeSources),
      );
      setState((current) => ({ ...current, baseline: submitted }));
      setSavedOnce(true);
      toast.success("Ürün kaydedildi.");
      onSaved(saved);
    } catch (saveError) {
      toast.error(saveError, "Ürün kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (): Promise<boolean> => {
    setDeleting(true);
    try {
      const result = await deleteOwnerProduct(initialProduct.id);
      // A product with past orders is hidden, not deleted: say so.
      if (result.message) toast.warning(result.message);
      else toast.success("Ürün silindi.");
      // Nothing left to lose: release the leave guard before navigating away.
      setState((current) => ({ ...current, baseline: current.form }));
      onDeleted?.();
      return true;
    } catch (deleteError) {
      toast.error(deleteError, "Ürün silinemedi.");
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const busy = saving || uploading;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-5"
    >
      {initialProduct.status === "available" ? (
        <TrPanelProductStoreLink
          boutiqueSlug={boutiqueSlug}
          productId={initialProduct.id}
        />
      ) : null}
      <TrPanelEditorSave
        dirty={dirty}
        saving={saving}
        saved={savedOnce}
        requireDirty
        disabled={uploading || deleting}
        onSave={() => void save()}
      />

      <TrPanelEditorTabs tabs={EDIT_TABS} />

      <div className="space-y-5">
        <TrPanelEditorCard
          id="editor-temel"
          title="Temel bilgi"
          hint="Mağazada görünen ad, fiyat ve satış durumu."
        >
          <TrPanelProductTitleField
            value={form.title}
            onChange={(title) => change({ title })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <TrPanelProductVisibilityField
            hidden={form.hidden}
            onChange={(hidden) => change({ hidden })}
            hint={
              form.hidden
                ? "Gizli ürün mağazada çıkmaz."
                : stockTotal > 0
                  ? "Satışta görünür. Tüm bedenlerin stoğu 0 olunca “Satıldı” görünür."
                  : "Stok 0 olduğu için ürün mağazada “Satıldı” görünür."
            }
          />
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-medya"
          title="Medya"
          hint="Fotoğraflar mağazada bu sırayla görünür."
        >
          {takim ? (
            <>
              <p className={panelHintClass}>
                Takım görselleri burada değiştirilmez.
              </p>
              <PhotoStrip
                urls={[
                  ...form.lifestyleImages,
                  ...form.marketplaceImages,
                  ...form.images,
                ]}
              />
            </>
          ) : form.manualMode ? (
            <>
              <p className={panelHintClass}>
                Fotoğraflar sitede bu sırayla görünür. En az bir kare.
              </p>
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
            </>
          ) : (
            <>
              <p className={panelHintClass}>
                Bu ürünün mağaza görselleri (packshot ve model kareleri) otomatik
                hazırlandı ve olduğu gibi kalır. Değiştirmek için “Fotoğrafları
                düzenle”ye basın: mağazadaki kareler bu sırayla listeye alınır;
                sonra ekleyip çıkarabilir, sırasını değiştirebilirsiniz.
              </p>
              <PhotoStrip urls={shopGallery} />
              <button
                type="button"
                className={panelSecondaryBtnClass}
                disabled={busy || shopGallery.length === 0}
                onClick={editGeneratedPhotos}
              >
                Fotoğrafları düzenle
              </button>
              {!elbise && hasGeneratedImages ? (
                <TrCatalogBackgroundPicker
                  value={form.catalogBackgroundId}
                  onChange={(catalogBackgroundId) => change({ catalogBackgroundId })}
                  disabled={busy}
                />
              ) : null}
            </>
          )}
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-detay"
          title="Ürün detayı"
          hint="Açıklama, özellikler ve kategori ürün sayfasında gösterilir."
        >
          <label className="block space-y-2">
            <span className={panelLabelClass}>Açıklama</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                change({ description: clampDescription(event.target.value) })
              }
              rows={5}
              maxLength={TR_OWNER_PRODUCT_LIMITS.descriptionMax}
              className={panelFieldClass}
            />
            <span className={`block ${panelHintClass}`}>
              {form.description.length}/{TR_OWNER_PRODUCT_LIMITS.descriptionMax}
            </span>
          </label>
          <TrOwnerProductFeaturesFields
            value={form.features}
            onChange={(features) => change({ features })}
            fieldClass={panelFieldClass}
            labelClass={panelLabelClass}
            hintClass={panelHintClass}
            variant={family ? "dress" : "default"}
            family={family ?? "elbise"}
            shopCategory={form.category}
          />

          <div className="space-y-3 border-t border-neutral-100 pt-6">
            <p className={panelLabelClass}>Kategori</p>
            {takim ? (
              <p className={panelHintClass}>Takım ürünleri Takım kategorisinde kalır.</p>
            ) : null}
            {family === "ust-giyim" ? (
              <p className={panelHintClass}>
                Bluz, gömlek, tişört gibi bir alt kategori kullanın — üst giyim
                olarak bırakmayın.
              </p>
            ) : null}
            {family === "alt-giyim" ? (
              <p className={panelHintClass}>
                Etek, pantolon veya eşofman kullanın — alt giyim olarak bırakmayın.
              </p>
            ) : null}
            <TrOwnerCategoryPicker
              value={form.category}
              onChange={(category) => change({ category })}
              extras={categoryOptions}
              disabled={takim}
            />
            {takim || addingCategory ? null : (
              <button
                type="button"
                className={panelAddChipClass}
                onClick={() => setAddingCategory(true)}
              >
                + Kategori ekle
              </button>
            )}
            <AnimatePresence>
              {addingCategory ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  <input
                    value={newCategoryLabel}
                    onChange={(event) => setNewCategoryLabel(event.target.value)}
                    placeholder="Örn. Aksesuar"
                    className={`${panelFieldClass} min-w-[160px] flex-1`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={panelPrimaryBtnClass}
                    onClick={commitCategory}
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    className={panelSecondaryBtnClass}
                    onClick={() => {
                      setAddingCategory(false);
                      setNewCategoryLabel("");
                    }}
                  >
                    Vazgeç
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="editor-envanter"
          title="Envanter"
          hint="Beden, stok ve renk seçenekleri."
        >
          <TrOwnerSizeChartStock
            chart={form.sizeChart}
            onChartChange={applySizeChart}
            sources={sizeSources}
            stockInputs={form.sizeStockInputs}
            onStockInputsChange={(sizeStockInputs) => change({ sizeStockInputs })}
            stock={form.stock}
            onStockChange={(stock) => change({ stock })}
            allowCustomSizes
            onlyListedSizes
          />

          <div className="space-y-4 border-t border-neutral-100 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={panelLabelClass}>Renkler</p>
                <p className={`mt-1 ${panelHintClass}`}>
                  İsterseniz açın — kapalıysa mağazada renk seçimi çıkmaz.
                </p>
              </div>
              <OptionToggle
                label="Renk seçenekleri"
                checked={form.colorsEnabled}
                onChange={(colorsEnabled) => {
                  change({ colorsEnabled });
                  if (!colorsEnabled) {
                    setAddingColor(false);
                    setNewColorName("");
                    setNewColorHex("#C2185B");
                  }
                }}
              />
            </div>
            {form.colorsEnabled ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {PRESET_COLORS.map((color) => {
                    const active = form.colors.some(
                      (entry) => entry.hex.toLowerCase() === color.hex.toLowerCase(),
                    );
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        title={color.name}
                        aria-label={color.name}
                        aria-pressed={active}
                        onClick={() => toggleColor(color)}
                        className="h-12 w-12 rounded-lg border-2"
                        style={{
                          backgroundColor: color.hex,
                          borderColor: active ? "var(--panel-accent)" : "rgba(0,0,0,0.15)",
                        }}
                      />
                    );
                  })}
                  {form.colors
                    .filter(
                      (color) =>
                        !PRESET_COLORS.some(
                          (preset) => preset.hex.toLowerCase() === color.hex.toLowerCase(),
                        ),
                    )
                    .map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        title={color.name}
                        aria-label={color.name}
                        aria-pressed
                        onClick={() => toggleColor(color)}
                        className="h-12 w-12 rounded-lg border-2"
                        style={{
                          backgroundColor: color.hex,
                          borderColor: "var(--panel-accent)",
                        }}
                      />
                    ))}
                  {!addingColor ? (
                    <button
                      type="button"
                      className={panelAddChipClass}
                      onClick={() => setAddingColor(true)}
                    >
                      + Renk ekle
                    </button>
                  ) : null}
                </div>
                {form.colors.length > 0 ? (
                  <p className="text-[14px] text-neutral-700">
                    Seçili: {form.colors.map((color) => color.name).join(", ")}
                  </p>
                ) : null}
                {addingColor ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      value={newColorName}
                      onChange={(event) => setNewColorName(event.target.value)}
                      placeholder="Renk adı"
                      className={`${panelFieldClass} min-w-[140px] flex-1`}
                    />
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(newColorHex) ? newColorHex : "#C2185B"
                      }
                      onChange={(event) => setNewColorHex(event.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1"
                      title="Renk seç"
                    />
                    <input
                      value={newColorHex}
                      onChange={(event) => setNewColorHex(event.target.value)}
                      placeholder="#C2185B"
                      className={`${panelFieldClass} w-36`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitColor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={panelPrimaryBtnClass}
                      onClick={commitColor}
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      className={panelSecondaryBtnClass}
                      onClick={() => {
                        setAddingColor(false);
                        setNewColorName("");
                        setNewColorHex("#C2185B");
                      }}
                    >
                      Vazgeç
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <TrOwnerColorGroupLinker
              boutiqueId={boutiqueId}
              product={{ ...initialProduct, title: form.title, features: form.features }}
              onLinked={(saved) => {
                rebase(fashionServerSavedFields(saved, ["features"]));
                onSaved(saved);
              }}
            />
          </div>
        </TrPanelEditorCard>

        <TrPanelProductDeleteCard
          productTitle={initialProduct.title}
          disabled={busy}
          deleting={deleting}
          onDelete={remove}
        />
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
