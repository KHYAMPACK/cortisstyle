"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { TR_BOUTIQUE_CATEGORIES } from "@/lib/tr/categories";
import {
  DEFAULT_COLOR_PRESETS,
  DEFAULT_LETTER_SIZES,
} from "@/lib/tr/productOptions";
import {
  createOwnerProduct,
  fetchOwnerBoutiqueOptions,
  updateOwnerBoutiqueOptions,
  uploadOwnerProductImage,
} from "@/lib/tr/ownerClient";
import { formatTryFromKurus } from "@/types/tr-marketplace";
import type { TrProduct, TrProductColor } from "@/types/tr-marketplace";

const STEPS = [
  { id: "photo", title: "Fotoğraf", hint: "Ürünün fotoğrafını ekleyin" },
  { id: "name", title: "İsim", hint: "Ürüne bir isim verin" },
  { id: "price", title: "Fiyat", hint: "Fiyat ve stok" },
  { id: "details", title: "Detay", hint: "Kategori, beden, renk" },
  { id: "review", title: "Kaydet", hint: "Kontrol edip yayınlayın" },
] as const;

const fieldClass =
  "w-full rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-4 py-4 text-[18px] outline-none focus:border-[color:var(--panel-accent)]";

const primaryBtn =
  "inline-flex min-h-14 items-center justify-center rounded-xl px-6 py-4 text-[18px] font-semibold text-white disabled:opacity-50";

const secondaryBtn =
  "inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-6 py-4 text-[18px] font-semibold text-neutral-800";

interface TrProductCreateWizardProps {
  boutiqueId: string;
  onSaved: (product: TrProduct) => void;
}

export function TrProductCreateWizard({
  boutiqueId,
  onSaved,
}: TrProductCreateWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex]!;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceTry, setPriceTry] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [salePriceTry, setSalePriceTry] = useState("");
  const [stock, setStock] = useState("1");
  const [category, setCategory] = useState<string | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([
    ...DEFAULT_LETTER_SIZES,
  ]);
  const [colors, setColors] = useState<TrProductColor[]>([]);
  const [colorOptions, setColorOptions] = useState<TrProductColor[]>(
    DEFAULT_COLOR_PRESETS.map((c) => ({ ...c })),
  );
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "size"; value: string }
    | { kind: "color"; value: TrProductColor }
    | null
  >(null);
  const [images, setImages] = useState<string[]>([]);
  const [marketplaceImages, setMarketplaceImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addingSize, setAddingSize] = useState(false);
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [addingColor, setAddingColor] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#C2185B");

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      try {
        const options = await fetchOwnerBoutiqueOptions(boutiqueId);
        if (cancelled) return;
        setSizeOptions(options.sizePresets);
        setColorOptions(options.colorPresets);
      } catch {
        // Keep defaults if presets fail to load.
      }
    }
    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const persistPresets = async (
    nextSizes: string[],
    nextColors: TrProductColor[],
  ) => {
    setSizeOptions(nextSizes);
    setColorOptions(nextColors);
    try {
      const saved = await updateOwnerBoutiqueOptions(boutiqueId, {
        sizePresets: nextSizes,
        colorPresets: nextColors,
      });
      setSizeOptions(saved.sizePresets);
      setColorOptions(saved.colorPresets);
    } catch (persistError) {
      setError(
        persistError instanceof Error
          ? persistError.message
          : "Beden/renk listesi kaydedilemedi.",
      );
    }
  };

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const canContinue = useMemo(() => {
    if (step.id === "photo") return images.length > 0;
    if (step.id === "name") return title.trim().length > 0;
    if (step.id === "price") {
      const price = Number(priceTry.replace(",", "."));
      const stockValue = Number.parseInt(stock, 10);
      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isFinite(stockValue) ||
        stockValue < 0
      ) {
        return false;
      }
      if (discountEnabled) {
        const sale = Number(salePriceTry.replace(",", "."));
        return Number.isFinite(sale) && sale > 0 && sale < price;
      }
      return true;
    }
    return true;
  }, [
    discountEnabled,
    images.length,
    priceTry,
    salePriceTry,
    step.id,
    stock,
    title,
  ]);

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

  const goNext = () => {
    setError(null);
    if (!canContinue) {
      if (step.id === "photo") setError("Devam etmek için bir fotoğraf ekleyin.");
      else if (step.id === "name") setError("Ürün adı zorunlu.");
      else if (step.id === "price") {
        setError(
          discountEnabled
            ? "İndirimli fiyat, normal fiyattan düşük olmalı."
            : "Geçerli bir fiyat ve stok girin.",
        );
      }
      return;
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const listPrice = Number(priceTry.replace(",", "."));
      if (!Number.isFinite(listPrice) || listPrice <= 0) {
        throw new Error("Geçerli bir fiyat girin.");
      }
      if (!title.trim()) throw new Error("Başlık zorunlu.");
      if (images.length === 0) throw new Error("En az bir fotoğraf ekleyin.");

      const stockValue = Number.parseInt(stock, 10);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        throw new Error("Stok 0 veya daha büyük olmalı.");
      }

      let sellPrice = listPrice;
      let compareAtPriceTryValue: number | null = null;
      if (discountEnabled) {
        const sale = Number(salePriceTry.replace(",", "."));
        if (!Number.isFinite(sale) || sale <= 0 || sale >= listPrice) {
          throw new Error("İndirimli fiyat, normal fiyattan düşük olmalı.");
        }
        sellPrice = sale;
        compareAtPriceTryValue = listPrice;
      }

      const product = await createOwnerProduct({
        boutiqueId,
        title: title.trim(),
        description: description.trim() || null,
        priceTry: sellPrice,
        compareAtPriceTry: compareAtPriceTryValue,
        sizes,
        colors,
        category,
        images,
        marketplaceImages: images.map(
          (_, index) => marketplaceImages[index] ?? "",
        ),
        stock: stockValue,
        status: "available",
      });

      // Keep boutique presets in sync with anything used on this product.
      const mergedSizes = [...sizeOptions];
      for (const size of sizes) {
        if (!mergedSizes.includes(size)) mergedSizes.push(size);
      }
      const mergedColors = [...colorOptions];
      for (const color of colors) {
        if (
          !mergedColors.some(
            (entry) => entry.hex.toLowerCase() === color.hex.toLowerCase(),
          )
        ) {
          mergedColors.push(color);
        }
      }
      void persistPresets(mergedSizes, mergedColors);

      onSaved(product);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kayıt başarısız.",
      );
    } finally {
      setSaving(false);
    }
  };

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

  const addSize = () => {
    const size = newSizeLabel.trim().toUpperCase();
    if (!size) return;
    const nextSizes = sizeOptions.includes(size)
      ? sizeOptions
      : [...sizeOptions, size];
    setSizes((current) => (current.includes(size) ? current : [...current, size]));
    setNewSizeLabel("");
    setAddingSize(false);
    void persistPresets(nextSizes, colorOptions);
  };

  const addColor = () => {
    const name = newColorName.trim();
    let hex = newColorHex.trim();
    if (!name) return;
    if (!hex.startsWith("#")) hex = `#${hex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setError("Renk için geçerli bir hex kodu girin (ör. #C2185B).");
      return;
    }
    const color = { name, hex: hex.toUpperCase() };
    const nextColors = colorOptions.some(
      (entry) => entry.hex.toLowerCase() === color.hex.toLowerCase(),
    )
      ? colorOptions
      : [...colorOptions, color];
    toggleColor(color);
    setNewColorName("");
    setNewColorHex("#C2185B");
    setAddingColor(false);
    setError(null);
    void persistPresets(sizeOptions, nextColors);
  };

  const removeSizeOption = (size: string) => {
    const nextSizes = sizeOptions.filter((entry) => entry !== size);
    setSizes((current) => current.filter((entry) => entry !== size));
    void persistPresets(nextSizes, colorOptions);
  };

  const removeColorOption = (color: TrProductColor) => {
    const nextColors = colorOptions.filter(
      (entry) => entry.hex.toLowerCase() !== color.hex.toLowerCase(),
    );
    setColors((current) =>
      current.filter(
        (entry) => entry.hex.toLowerCase() !== color.hex.toLowerCase(),
      ),
    );
    void persistPresets(sizeOptions, nextColors);
  };

  const requestRemoveSizeOption = (size: string) => {
    setPendingDelete({ kind: "size", value: size });
  };

  const requestRemoveColorOption = (color: TrProductColor) => {
    setPendingDelete({ kind: "color", value: color });
  };

  const confirmPendingDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "size") {
      removeSizeOption(pendingDelete.value);
    } else {
      removeColorOption(pendingDelete.value);
    }
    setPendingDelete(null);
  };

  const displaySellPrice = discountEnabled
    ? salePriceTry
    : priceTry;
  const displayListPrice = discountEnabled ? priceTry : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] font-semibold text-neutral-700">
            Adım {stepIndex + 1} / {STEPS.length}
          </p>
          <p
            className="text-[16px] font-semibold"
            style={{ color: "var(--panel-accent-deep)" }}
          >
            {step.title}
          </p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[color:var(--panel-accent-soft)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--panel-accent)",
            }}
          />
        </div>
        <p className="mt-3 text-[18px] text-neutral-700">{step.hint}</p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[16px] text-red-800">
          {error}
        </p>
      ) : null}

      <AnimatePresence>
        {pendingDelete ? (
          <motion.div
            key="delete-confirm"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm sm:p-6"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="pending-delete-title"
          >
            <p
              id="pending-delete-title"
              className="text-[18px] font-semibold text-neutral-900"
            >
              Emin misiniz?
            </p>
            <p className="mt-2 text-[16px] leading-relaxed text-neutral-700">
              {pendingDelete.kind === "size" ? (
                <>
                  <span className="font-semibold">{pendingDelete.value}</span>{" "}
                  bedeni bu butikteki listeden silinecek. Sonraki ürünlerde
                  görünmez.
                </>
              ) : (
                <>
                  <span className="font-semibold">
                    {pendingDelete.value.name}
                  </span>{" "}
                  rengi bu butikteki listeden silinecek. Sonraki ürünlerde
                  görünmez.
                </>
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryBtn}
                style={{ backgroundColor: "#B45309" }}
                onClick={confirmPendingDelete}
              >
                Evet, sil
              </button>
              <button
                type="button"
                className={secondaryBtn}
                onClick={() => setPendingDelete(null)}
              >
                Vazgeç
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6"
        >
          {step.id === "photo" ? (
            <div className="space-y-5">
              <label
                className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] px-6 py-10 text-center"
              >
                <span
                  className="text-[22px] font-semibold"
                  style={{ color: "var(--panel-accent-deep)" }}
                >
                  {uploading ? "Yükleniyor…" : "Fotoğraf seçin"}
                </span>
                <span className="text-[16px] text-neutral-600">
                  Telefon veya bilgisayardan bir veya daha fazla fotoğraf
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    void handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="160px"
                      />
                      {index === 0 ? (
                        <span className="absolute top-2 left-2 rounded-lg bg-white px-2 py-1 text-[13px] font-semibold">
                          Kapak
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="absolute right-2 bottom-2 rounded-lg bg-white px-3 py-2 text-[14px] font-semibold text-red-700"
                        onClick={() => {
                          setImages((current) =>
                            current.filter((_, i) => i !== index),
                          );
                          setMarketplaceImages((current) =>
                            current.filter((_, i) => i !== index),
                          );
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {step.id === "name" ? (
            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-[17px] font-semibold text-neutral-800">
                  Ürün adı
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={fieldClass}
                  placeholder="Örn. Siyah Bluz"
                  autoFocus
                />
              </label>
              <label className="block space-y-2">
                <span className="text-[17px] font-semibold text-neutral-800">
                  Kısa açıklama (isteğe bağlı)
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={`${fieldClass} min-h-28`}
                  placeholder="Kumaş, kesim, kullanım…"
                />
              </label>
            </div>
          ) : null}

          {step.id === "price" ? (
            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-[17px] font-semibold text-neutral-800">
                  Fiyat (TL)
                </span>
                <input
                  value={priceTry}
                  onChange={(event) => setPriceTry(event.target.value)}
                  className={fieldClass}
                  inputMode="decimal"
                  placeholder="890"
                  autoFocus
                />
                {priceTry && Number(priceTry.replace(",", ".")) > 0 ? (
                  <span className="text-[15px] text-neutral-600">
                    {formatTryFromKurus(
                      Math.round(Number(priceTry.replace(",", ".")) * 100),
                    )}
                  </span>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-[17px] font-semibold text-neutral-800">
                  Stok adedi
                </span>
                <input
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  className={fieldClass}
                  inputMode="numeric"
                />
              </label>

              <button
                type="button"
                role="switch"
                aria-checked={discountEnabled}
                onClick={() => {
                  setDiscountEnabled((current) => !current);
                  if (discountEnabled) setSalePriceTry("");
                }}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] px-4 py-4 text-left"
              >
                <span
                  className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                    discountEnabled ? "" : "bg-neutral-300"
                  }`}
                  style={
                    discountEnabled
                      ? { backgroundColor: "var(--panel-accent)" }
                      : undefined
                  }
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      discountEnabled ? "translate-x-6" : ""
                    }`}
                  />
                </span>
                <span>
                  <span className="block text-[18px] font-semibold text-neutral-900">
                    İndirim var mı?
                  </span>
                  <span className="mt-0.5 block text-[15px] text-neutral-600">
                    Açınca indirimli satış fiyatını girebilirsiniz
                  </span>
                </span>
              </button>

              {discountEnabled ? (
                <label className="block space-y-2">
                  <span className="text-[17px] font-semibold text-neutral-800">
                    İndirimli fiyat (TL)
                  </span>
                  <input
                    value={salePriceTry}
                    onChange={(event) => setSalePriceTry(event.target.value)}
                    className={fieldClass}
                    inputMode="decimal"
                    placeholder="690"
                  />
                  <span className="text-[15px] text-neutral-600">
                    Müşteri bunu öder; üstteki fiyat üstü çizili görünür.
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}

          {step.id === "details" ? (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-[17px] font-semibold text-neutral-800">
                  Kategori
                </p>
                <div className="flex flex-wrap gap-2">
                  {TR_BOUTIQUE_CATEGORIES.map((entry) => {
                    const active = category === entry.id;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() =>
                          setCategory((current) =>
                            current === entry.id ? null : entry.id,
                          )
                        }
                        className={`rounded-full px-4 py-3 text-[16px] font-semibold ${
                          active
                            ? "text-white"
                            : "bg-white text-neutral-800 ring-1 ring-[color:var(--panel-accent-border)]"
                        }`}
                        style={
                          active
                            ? { backgroundColor: "var(--panel-accent)" }
                            : undefined
                        }
                      >
                        {entry.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[17px] font-semibold text-neutral-800">
                  Bedenler (isteğe bağlı)
                </p>
                <p className="text-[14px] text-neutral-600">
                  Eklediğiniz bedenler bu butikte saklanır; sonraki ürünlerde
                  tekrar görünür.
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => {
                    const active = sizes.includes(size);
                    return (
                      <div
                        key={size}
                        className={`inline-flex items-center gap-1 rounded-full pl-4 ${
                          active
                            ? "text-white"
                            : "bg-white text-neutral-800 ring-1 ring-[color:var(--panel-accent-border)]"
                        }`}
                        style={
                          active
                            ? { backgroundColor: "var(--panel-accent)" }
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={() => toggleSize(size)}
                          className="min-w-8 py-3 text-[16px] font-semibold"
                        >
                          {size}
                        </button>
                        <button
                          type="button"
                          aria-label={`${size} sil`}
                          onClick={() => requestRemoveSizeOption(size)}
                          className={`mr-1 flex h-8 w-8 items-center justify-center rounded-full text-[18px] ${
                            active
                              ? "bg-white/20 text-white"
                              : "text-neutral-500 hover:bg-neutral-100"
                          }`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {!addingSize ? (
                    <button
                      type="button"
                      onClick={() => setAddingSize(true)}
                      className="rounded-full border-2 border-dashed border-[color:var(--panel-accent-border)] px-4 py-3 text-[16px] font-semibold text-neutral-700"
                    >
                      + Beden ekle
                    </button>
                  ) : (
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <input
                        value={newSizeLabel}
                        onChange={(event) => setNewSizeLabel(event.target.value)}
                        className={`${fieldClass} max-w-[8rem]`}
                        placeholder="Örn. 38"
                        autoFocus
                      />
                      <button
                        type="button"
                        className={primaryBtn}
                        style={{ backgroundColor: "var(--panel-accent)" }}
                        onClick={addSize}
                      >
                        Ekle
                      </button>
                      <button
                        type="button"
                        className={secondaryBtn}
                        onClick={() => {
                          setAddingSize(false);
                          setNewSizeLabel("");
                        }}
                      >
                        Vazgeç
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[17px] font-semibold text-neutral-800">
                  Renkler (isteğe bağlı)
                </p>
                <p className="text-[14px] text-neutral-600">
                  Eklediğiniz renkler bu butikte saklanır; sonraki ürünlerde
                  tekrar görünür.
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => {
                    const active = colors.some(
                      (entry) =>
                        entry.hex.toLowerCase() === color.hex.toLowerCase(),
                    );
                    return (
                      <div
                        key={color.hex}
                        className={`inline-flex items-center gap-1 rounded-full pl-3 ${
                          active
                            ? "text-white"
                            : "bg-white text-neutral-800 ring-1 ring-[color:var(--panel-accent-border)]"
                        }`}
                        style={
                          active
                            ? { backgroundColor: "var(--panel-accent)" }
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={() => toggleColor(color)}
                          className="inline-flex items-center gap-2 py-3 pr-1 text-[16px] font-semibold"
                        >
                          <span
                            className="h-4 w-4 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </button>
                        <button
                          type="button"
                          aria-label={`${color.name} sil`}
                          onClick={() => requestRemoveColorOption(color)}
                          className={`mr-1 flex h-8 w-8 items-center justify-center rounded-full text-[18px] ${
                            active
                              ? "bg-white/20 text-white"
                              : "text-neutral-500 hover:bg-neutral-100"
                          }`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {!addingColor ? (
                    <button
                      type="button"
                      onClick={() => setAddingColor(true)}
                      className="rounded-full border-2 border-dashed border-[color:var(--panel-accent-border)] px-4 py-3 text-[16px] font-semibold text-neutral-700"
                    >
                      + Renk ekle
                    </button>
                  ) : (
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <input
                        value={newColorName}
                        onChange={(event) => setNewColorName(event.target.value)}
                        className={`${fieldClass} max-w-[10rem]`}
                        placeholder="Renk adı"
                        autoFocus
                      />
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(event) => setNewColorHex(event.target.value)}
                        className="h-14 w-14 rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white p-1"
                        aria-label="Renk seç"
                      />
                      <button
                        type="button"
                        className={primaryBtn}
                        style={{ backgroundColor: "var(--panel-accent)" }}
                        onClick={addColor}
                      >
                        Ekle
                      </button>
                      <button
                        type="button"
                        className={secondaryBtn}
                        onClick={() => {
                          setAddingColor(false);
                          setNewColorName("");
                          setNewColorHex("#C2185B");
                        }}
                      >
                        Vazgeç
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {step.id === "review" ? (
            <div className="space-y-4 text-[17px] text-neutral-800">
              <div className="flex gap-4">
                {images[0] ? (
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    <Image
                      src={images[0]}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 space-y-1">
                  <p className="text-[22px] font-semibold">{title || "—"}</p>
                  <p>
                    {displaySellPrice
                      ? formatTryFromKurus(
                          Math.round(
                            Number(displaySellPrice.replace(",", ".")) * 100,
                          ),
                        )
                      : "—"}
                    {displayListPrice &&
                    Number(displayListPrice.replace(",", ".")) > 0 ? (
                      <span className="ml-2 text-neutral-500 line-through">
                        {formatTryFromKurus(
                          Math.round(
                            Number(displayListPrice.replace(",", ".")) * 100,
                          ),
                        )}
                      </span>
                    ) : null}{" "}
                    · Stok {stock}
                  </p>
                  {category ? (
                    <p className="text-neutral-600">
                      Kategori:{" "}
                      {TR_BOUTIQUE_CATEGORIES.find((c) => c.id === category)
                        ?.label ?? category}
                    </p>
                  ) : null}
                  {sizes.length > 0 ? (
                    <p className="text-neutral-600">
                      Beden: {sizes.join(", ")}
                    </p>
                  ) : null}
                  {colors.length > 0 ? (
                    <p className="text-neutral-600">
                      Renk: {colors.map((c) => c.name).join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="rounded-xl bg-[color:var(--panel-accent-soft)] px-4 py-3 text-[16px]">
                Kaydettiğinizde ürün satışta görünür.
              </p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap gap-3">
        {stepIndex > 0 ? (
          <button type="button" className={secondaryBtn} onClick={goBack}>
            Geri
          </button>
        ) : null}
        {step.id !== "review" ? (
          <button
            type="button"
            className={`${primaryBtn} flex-1`}
            style={{ backgroundColor: "var(--panel-accent)" }}
            onClick={goNext}
            disabled={uploading}
          >
            Devam
          </button>
        ) : (
          <button
            type="button"
            className={`${primaryBtn} flex-1`}
            style={{ backgroundColor: "var(--panel-accent)" }}
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Kaydediliyor…" : "Ürünü kaydet"}
          </button>
        )}
      </div>
    </div>
  );
}
