"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { TR_BOUTIQUE_CATEGORIES } from "@/lib/tr/categories";
import { DEFAULT_LETTER_SIZES } from "@/lib/tr/productOptions";
import {
  createOwnerProduct,
  updateOwnerProduct,
  uploadOwnerProductImage,
} from "@/lib/tr/ownerClient";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductColor, TrProductStatus } from "@/types/tr-marketplace";

function InlineBusySpinner() {
  return (
    <motion.span
      aria-hidden
      className="inline-block h-3 w-3 shrink-0 border border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
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
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-jet-black" : "bg-neutral-300"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

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

const STATUS_OPTIONS: Array<{ id: TrProductStatus; label: string }> = [
  { id: "available", label: "Satışta" },
  { id: "sold", label: "Satıldı" },
  { id: "hidden", label: "Gizli" },
];

function slugifyCustomId(label: string): string {
  return label
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

interface TrProductEditorFormProps {
  boutiqueId: string;
  mode: "create" | "edit";
  initialProduct?: TrProduct | null;
  onSaved: (product: TrProduct) => void;
}

export function TrProductEditorForm({
  boutiqueId,
  mode,
  initialProduct,
  onSaved,
}: TrProductEditorFormProps) {
  const [title, setTitle] = useState(initialProduct?.title ?? "");
  const [priceTry, setPriceTry] = useState(
    initialProduct ? String(initialProduct.priceKurus / 100) : "",
  );
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );
  const [category, setCategory] = useState<string | null>(
    initialProduct?.category ?? null,
  );
  const [extraCategories, setExtraCategories] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [sizesEnabled, setSizesEnabled] = useState(
    () => (initialProduct?.sizes.length ?? 0) > 0,
  );
  const [sizes, setSizes] = useState<string[]>(initialProduct?.sizes ?? []);
  const [extraSizes, setExtraSizes] = useState<string[]>([]);
  const [colorsEnabled, setColorsEnabled] = useState(
    () => (initialProduct?.colors.length ?? 0) > 0,
  );
  const [colors, setColors] = useState<TrProductColor[]>(
    initialProduct?.colors ?? [],
  );
  const [stock, setStock] = useState(
    String(initialProduct?.stock ?? 1),
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [marketplaceImages, setMarketplaceImages] = useState<string[]>(
    initialProduct?.marketplaceImages ?? [],
  );
  const [status, setStatus] = useState<TrProductStatus>(
    initialProduct?.status ?? "available",
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [addingSize, setAddingSize] = useState(false);
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [addingColor, setAddingColor] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#C2185B");

  useEffect(() => {
    if (!initialProduct) return;
    setTitle(initialProduct.title);
    setPriceTry(String(initialProduct.priceKurus / 100));
    setDescription(initialProduct.description ?? "");
    setCategory(initialProduct.category);
    setSizesEnabled(initialProduct.sizes.length > 0);
    setSizes(initialProduct.sizes);
    setColorsEnabled(initialProduct.colors.length > 0);
    setColors(initialProduct.colors);
    setStock(String(initialProduct.stock ?? 1));
    setImages(initialProduct.images);
    setMarketplaceImages(initialProduct.marketplaceImages ?? []);
    setStatus(initialProduct.status);

    if (
      initialProduct.category &&
      !TR_BOUTIQUE_CATEGORIES.some((entry) => entry.id === initialProduct.category)
    ) {
      setExtraCategories([
        {
          id: initialProduct.category,
          label: initialProduct.category.replace(/-/g, " "),
        },
      ]);
    }

    const unknownSizes = initialProduct.sizes.filter(
      (size) =>
        !(DEFAULT_LETTER_SIZES as readonly string[]).includes(size),
    );
    setExtraSizes(unknownSizes);
  }, [initialProduct]);

  const categoryOptions = useMemo(() => {
    const seen = new Set(TR_BOUTIQUE_CATEGORIES.map((entry) => entry.id));
    const extras = extraCategories.filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
    return [...TR_BOUTIQUE_CATEGORIES, ...extras];
  }, [extraCategories]);

  const sizeOptions = useMemo(() => {
    const seen = new Set<string>(DEFAULT_LETTER_SIZES);
    const extras = [
      ...extraSizes,
      ...sizes.filter(
        (size) => !(DEFAULT_LETTER_SIZES as readonly string[]).includes(size),
      ),
    ].filter((size) => {
      if (seen.has(size)) return false;
      seen.add(size);
      return true;
    });
    return [...DEFAULT_LETTER_SIZES, ...extras];
  }, [extraSizes, sizes]);

  const toggleSize = (size: string) => {
    setSizes((current) =>
      current.includes(size)
        ? current.filter((entry) => entry !== size)
        : [...current, size],
    );
  };

  const toggleColor = (color: TrProductColor) => {
    setColors((current) => {
      const exists = current.some(
        (entry) => entry.hex.toLowerCase() === color.hex.toLowerCase(),
      );
      if (exists) {
        return current.filter(
          (entry) => entry.hex.toLowerCase() !== color.hex.toLowerCase(),
        );
      }
      return [...current, color];
    });
  };

  const commitCategory = () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const id = slugifyCustomId(label) || `kategori-${Date.now()}`;
    const existing = categoryOptions.find(
      (entry) => entry.id === id || entry.label.toLocaleLowerCase("tr") === label.toLocaleLowerCase("tr"),
    );
    if (existing) {
      setCategory(existing.id);
    } else {
      setExtraCategories((current) => [...current, { id, label }]);
      setCategory(id);
    }
    setNewCategoryLabel("");
    setAddingCategory(false);
  };

  const commitSize = () => {
    const size = newSizeLabel.trim().toUpperCase();
    if (!size) return;
    if (!sizeOptions.includes(size)) {
      setExtraSizes((current) => [...current, size]);
    }
    setSizes((current) =>
      current.includes(size) ? current : [...current, size],
    );
    setNewSizeLabel("");
    setAddingSize(false);
  };

  const commitColor = () => {
    const name = newColorName.trim();
    let hex = newColorHex.trim();
    if (!name) return;
    if (!hex.startsWith("#")) hex = `#${hex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setError("Renk için geçerli bir hex kodu girin (ör. #C2185B).");
      return;
    }
    toggleColor({ name, hex: hex.toUpperCase() });
    setNewColorName("");
    setNewColorHex("#C2185B");
    setAddingColor(false);
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const nextOriginals: string[] = [];
      const nextMarketplace: string[] = [];
      for (const file of Array.from(fileList)) {
        const uploaded = await uploadOwnerProductImage(boutiqueId, file);
        nextOriginals.push(uploaded.url);
        nextMarketplace.push(uploaded.marketplaceUrl ?? "");
      }
      setImages((current) => [...current, ...nextOriginals]);
      setMarketplaceImages((current) => [...current, ...nextMarketplace]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
    setMarketplaceImages((current) => current.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setImages((current) => {
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
    setMarketplaceImages((current) => {
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const tmp = next[index] ?? "";
      next[index] = next[target] ?? "";
      next[target] = tmp;
      return next;
    });
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    setImages((current) => {
      const next = [...current];
      const [picked] = next.splice(index, 1);
      return [picked!, ...next];
    });
    setMarketplaceImages((current) => {
      const next = [...current];
      const [picked] = next.splice(index, 1);
      return [picked ?? "", ...next];
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const price = Number(priceTry.replace(",", "."));
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("Geçerli bir fiyat girin.");
      }
      if (!title.trim()) {
        throw new Error("Başlık zorunlu.");
      }
      if (images.length === 0) {
        throw new Error("En az bir fotoğraf ekleyin.");
      }

      const stockValue = Number.parseInt(stock, 10);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        throw new Error("Stok 0 veya daha büyük bir tam sayı olmalı.");
      }

      const payload = {
        boutiqueId,
        title: title.trim(),
        description: description.trim() || null,
        priceTry: price,
        sizes: sizesEnabled ? sizes : [],
        colors: colorsEnabled ? colors : [],
        category,
        images,
        marketplaceImages: images.map((_, index) => marketplaceImages[index] ?? ""),
        stock: stockValue,
        status,
      };

      const product =
        mode === "create"
          ? await createOwnerProduct(payload)
          : await updateOwnerProduct(initialProduct!.id, payload);

      onSaved(product);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kayıt başarısız.",
      );
    } finally {
      setSaving(false);
    }
  };

  const chipClass = (active: boolean) =>
    [
      "border px-3 py-2 text-[11px] tracking-[0.08em] uppercase transition-colors",
      active
        ? "border-jet-black bg-jet-black text-white"
        : "border-black/15 bg-white text-neutral-800 hover:border-black/30",
    ].join(" ");

  const addChipClass =
    "border border-dashed border-black/25 bg-white px-3 py-2 text-[11px] tracking-[0.08em] text-neutral-600 uppercase transition-colors hover:border-black/40 hover:text-neutral-900";

  const fieldClass =
    "w-full border border-black/15 bg-white px-3 py-3 text-[14px] outline-none focus:border-black/40";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
              Fotoğraflar
            </p>
            <p className="mt-1 text-[12px] text-neutral-500">
              Soldaki 1. görsel kapaktır. Sürükle yerine oklarla sırayı
              değiştirin.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 border border-black/15 bg-white px-4 py-3 text-[11px] tracking-[0.12em] uppercase">
            {uploading ? (
              <>
                <InlineBusySpinner />
                Yükleniyor…
              </>
            ) : (
              "Fotoğraf ekle"
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              disabled={uploading || saving}
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          {uploading ? (
            <p className="mt-2 text-[11px] leading-relaxed text-meta">
              Arka plan temizleniyor ve katalog görseli hazırlanıyor…
            </p>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-meta">
              Butik galerisi için orijinal fotoğraf kaydedilir; pazaryeri için
              ayrı katalog kesiti üretilir.
            </p>
          )}
        </div>

        {images.length > 0 ? (
          <ol className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((url, index) => {
              const catalogUrl = marketplaceImages[index];
              return (
              <li
                key={`${url}-${index}`}
                className={`relative w-[132px] shrink-0 overflow-hidden border bg-neutral-100 ${
                  index === 0
                    ? "border-jet-black ring-1 ring-jet-black"
                    : "border-black/10"
                }`}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="132px"
                  />
                  <span
                    className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] tracking-[0.08em] uppercase ${
                      index === 0
                        ? "bg-jet-black text-white"
                        : "bg-white/90 text-neutral-800"
                    }`}
                  >
                    {index === 0 ? "Kapak · 1" : `${index + 1}`}
                  </span>
                  {catalogUrl ? (
                    <span className="absolute right-1.5 bottom-1.5 bg-white/90 px-1.5 py-0.5 text-[8px] tracking-[0.06em] text-neutral-700 uppercase">
                      Katalog hazır
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1 border-t border-black/10 bg-white p-1.5">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="flex-1 border border-black/10 bg-white py-1.5 text-[10px] tracking-[0.06em] uppercase disabled:opacity-30"
                      onClick={() => moveImage(index, -1)}
                      disabled={index === 0}
                      title="Sola taşı"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="flex-1 border border-black/10 bg-white py-1.5 text-[10px] tracking-[0.06em] uppercase disabled:opacity-30"
                      onClick={() => moveImage(index, 1)}
                      disabled={index === images.length - 1}
                      title="Sağa taşı"
                    >
                      →
                    </button>
                  </div>
                  {index !== 0 ? (
                    <button
                      type="button"
                      className="w-full border border-black/10 bg-neutral-50 py-1.5 text-[10px] tracking-[0.06em] text-neutral-800 uppercase"
                      onClick={() => makeCover(index)}
                    >
                      Kapak yap
                    </button>
                  ) : (
                    <p className="py-1.5 text-center text-[10px] tracking-[0.06em] text-neutral-500 uppercase">
                      Vitrin
                    </p>
                  )}
                  <button
                    type="button"
                    className="w-full border border-black/10 bg-white py-1.5 text-[10px] tracking-[0.06em] text-red-700 uppercase"
                    onClick={() => removeImage(index)}
                  >
                    Sil
                  </button>
                </div>
              </li>
              );
            })}
          </ol>
        ) : (
          <p className="border border-dashed border-black/15 bg-neutral-50 px-4 py-6 text-[12px] text-neutral-500">
            Henüz fotoğraf yok. En az bir kapak görseli ekleyin.
          </p>
        )}
      </section>

      <label className="block space-y-2">
        <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Başlık
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClass}
          required
        />
      </label>

      <label className="block space-y-2">
        <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Fiyat (TL)
        </span>
        <input
          value={priceTry}
          onChange={(event) => setPriceTry(event.target.value)}
          inputMode="decimal"
          placeholder="899"
          className={fieldClass}
          required
        />
        {priceTry && Number(priceTry.replace(",", ".")) > 0 ? (
          <span className="text-[11px] text-neutral-500">
            {formatTryFromKurus(
              Math.round(Number(priceTry.replace(",", ".")) * 100),
            )}
          </span>
        ) : null}
      </label>

      <label className="block space-y-2">
        <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Stok
        </span>
        <input
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          inputMode="numeric"
          min={0}
          step={1}
          className={fieldClass}
        />
        <span className="text-[11px] text-neutral-500">
          Varsayılan 1 — tek parça için değiştirmenize gerek yok.
        </span>
      </label>

      <section className="space-y-3">
        <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Kategori
        </p>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={chipClass(category === entry.id)}
              onClick={() =>
                setCategory((current) =>
                  current === entry.id ? null : entry.id,
                )
              }
            >
              {entry.label}
            </button>
          ))}
          {!addingCategory ? (
            <button
              type="button"
              className={addChipClass}
              onClick={() => setAddingCategory(true)}
            >
              + Kategori ekle
            </button>
          ) : null}
        </div>
        <AnimatePresence>
          {addingCategory ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                value={newCategoryLabel}
                onChange={(event) => setNewCategoryLabel(event.target.value)}
                placeholder="Örn. Aksesuar"
                className="min-w-[160px] flex-1 border border-black/15 bg-white px-3 py-2 text-[13px] outline-none focus:border-black/40"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitCategory();
                  }
                }}
              />
              <button
                type="button"
                className="border border-jet-black bg-jet-black px-3 py-2 text-[11px] tracking-[0.08em] text-white uppercase"
                onClick={commitCategory}
              >
                Ekle
              </button>
              <button
                type="button"
                className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.08em] uppercase"
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
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Bedenler
          </p>
          <OptionToggle
            label="Beden seçenekleri"
            checked={sizesEnabled}
            onChange={(next) => {
              setSizesEnabled(next);
              if (!next) {
                setAddingSize(false);
                setNewSizeLabel("");
              }
            }}
          />
        </div>
        {!sizesEnabled ? (
          <p className="text-[12px] text-neutral-500">
            Kapalıyken mağazada beden seçimi gösterilmez.
          </p>
        ) : null}
        <AnimatePresence initial={false}>
          {sizesEnabled ? (
            <motion.div
              key="sizes-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={chipClass(sizes.includes(size))}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                ))}
                {!addingSize ? (
                  <button
                    type="button"
                    className={addChipClass}
                    onClick={() => setAddingSize(true)}
                  >
                    + Beden ekle
                  </button>
                ) : null}
              </div>
              <AnimatePresence>
                {addingSize ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      value={newSizeLabel}
                      onChange={(event) => setNewSizeLabel(event.target.value)}
                      placeholder="Örn. 38 veya XXL"
                      className="min-w-[140px] flex-1 border border-black/15 bg-white px-3 py-2 text-[13px] outline-none focus:border-black/40"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitSize();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="border border-jet-black bg-jet-black px-3 py-2 text-[11px] tracking-[0.08em] text-white uppercase"
                      onClick={commitSize}
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.08em] uppercase"
                      onClick={() => {
                        setAddingSize(false);
                        setNewSizeLabel("");
                      }}
                    >
                      Vazgeç
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Renkler
          </p>
          <OptionToggle
            label="Renk seçenekleri"
            checked={colorsEnabled}
            onChange={(next) => {
              setColorsEnabled(next);
              if (!next) {
                setAddingColor(false);
                setNewColorName("");
                setNewColorHex("#C2185B");
              }
            }}
          />
        </div>
        {!colorsEnabled ? (
          <p className="text-[12px] text-neutral-500">
            Kapalıyken mağazada renk seçimi gösterilmez.
          </p>
        ) : null}
        <AnimatePresence initial={false}>
          {colorsEnabled ? (
            <motion.div
              key="colors-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((color) => {
                  const active = colors.some(
                    (entry) =>
                      entry.hex.toLowerCase() === color.hex.toLowerCase(),
                  );
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.name}
                      onClick={() => toggleColor(color)}
                      className="h-8 w-8 border-2"
                      style={{
                        backgroundColor: color.hex,
                        borderColor: active ? "#0d0d0d" : "rgba(0,0,0,0.15)",
                      }}
                    />
                  );
                })}
                {colors
                  .filter(
                    (color) =>
                      !PRESET_COLORS.some(
                        (preset) =>
                          preset.hex.toLowerCase() === color.hex.toLowerCase(),
                      ),
                  )
                  .map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.name}
                      onClick={() => toggleColor(color)}
                      className="h-8 w-8 border-2 border-jet-black"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                {!addingColor ? (
                  <button
                    type="button"
                    className={addChipClass}
                    onClick={() => setAddingColor(true)}
                  >
                    + Renk ekle
                  </button>
                ) : null}
              </div>
              {colors.length > 0 ? (
                <p className="text-[11px] text-neutral-600">
                  {colors.map((color) => color.name).join(", ")}
                </p>
              ) : null}
              <AnimatePresence>
                {addingColor ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      value={newColorName}
                      onChange={(event) => setNewColorName(event.target.value)}
                      placeholder="Renk adı"
                      className="min-w-[120px] flex-1 border border-black/15 bg-white px-3 py-2 text-[13px] outline-none focus:border-black/40"
                    />
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(newColorHex)
                          ? newColorHex
                          : "#C2185B"
                      }
                      onChange={(event) => setNewColorHex(event.target.value)}
                      className="h-10 w-12 cursor-pointer border border-black/15 bg-white p-1"
                      title="Renk seç"
                    />
                    <input
                      value={newColorHex}
                      onChange={(event) => setNewColorHex(event.target.value)}
                      placeholder="#C2185B"
                      className="w-28 border border-black/15 bg-white px-3 py-2 text-[13px] outline-none focus:border-black/40"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitColor();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="border border-jet-black bg-jet-black px-3 py-2 text-[11px] tracking-[0.08em] text-white uppercase"
                      onClick={commitColor}
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.08em] uppercase"
                      onClick={() => {
                        setAddingColor(false);
                        setNewColorName("");
                        setNewColorHex("#C2185B");
                      }}
                    >
                      Vazgeç
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <label className="block space-y-2">
        <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Açıklama
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className={fieldClass}
        />
      </label>

      {mode === "edit" ? (
        <section className="space-y-3">
          <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Durum
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={chipClass(status === option.id)}
                onClick={() => setStatus(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving || uploading}
        className="btn-primary inline-flex w-full items-center justify-center gap-2 px-6 py-4 text-[11px] tracking-[0.16em] disabled:opacity-50"
      >
        {saving ? (
          <>
            <InlineBusySpinner />
            Kaydediliyor…
          </>
        ) : mode === "create" ? (
          "Ürünü ekle"
        ) : (
          "Kaydet"
        )}
      </button>
    </form>
  );
}
