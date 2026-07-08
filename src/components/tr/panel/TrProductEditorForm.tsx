"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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
  const [sizes, setSizes] = useState<string[]>(initialProduct?.sizes ?? []);
  const [colors, setColors] = useState<TrProductColor[]>(
    initialProduct?.colors ?? [],
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [status, setStatus] = useState<TrProductStatus>(
    initialProduct?.status ?? "available",
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialProduct) return;
    setTitle(initialProduct.title);
    setPriceTry(String(initialProduct.priceKurus / 100));
    setDescription(initialProduct.description ?? "");
    setCategory(initialProduct.category);
    setSizes(initialProduct.sizes);
    setColors(initialProduct.colors);
    setImages(initialProduct.images);
    setStatus(initialProduct.status);
  }, [initialProduct]);

  const toggleSize = (size: string) => {
    setSizes((current) =>
      current.includes(size)
        ? current.filter((entry) => entry !== size)
        : [...current, size],
    );
  };

  const toggleColor = (color: TrProductColor) => {
    setColors((current) => {
      const exists = current.some((entry) => entry.hex === color.hex);
      if (exists) {
        return current.filter((entry) => entry.hex !== color.hex);
      }
      return [...current, color];
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(fileList)) {
        const url = await uploadOwnerProductImage(boutiqueId, file);
        uploaded.push(url);
      }
      setImages((current) => [...current, ...uploaded]);
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

  const removeImage = (url: string) => {
    setImages((current) => current.filter((entry) => entry !== url));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
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

      const payload = {
        boutiqueId,
        title: title.trim(),
        description: description.trim() || null,
        priceTry: price,
        sizes,
        colors,
        category,
        images,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-3">
        <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Fotoğraflar
        </p>
        <p className="text-[12px] text-neutral-500">
          İlk fotoğraf kapak olur. PNG, JPEG veya WebP.
        </p>
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

        {images.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((url, index) => (
              <li
                key={url}
                className="relative aspect-[3/4] overflow-hidden border border-black/10 bg-neutral-100"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="120px"
                />
                {index === 0 ? (
                  <span className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 text-[8px] tracking-[0.1em] text-white uppercase">
                    Kapak
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex gap-0.5 bg-black/50 p-0.5">
                  <button
                    type="button"
                    className="flex-1 bg-white/90 text-[9px]"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-white/90 text-[9px]"
                    onClick={() => removeImage(url)}
                  >
                    Sil
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-white/90 text-[9px]"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                  >
                    →
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <label className="block space-y-2">
        <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Başlık
        </span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border border-black/15 bg-white px-3 py-3 text-[14px] outline-none focus:border-black/40"
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
          className="w-full border border-black/15 bg-white px-3 py-3 text-[14px] outline-none focus:border-black/40"
          required
        />
        {priceTry && Number(priceTry.replace(",", ".")) > 0 ? (
          <span className="text-[11px] text-neutral-500">
            {formatTryFromKurus(Math.round(Number(priceTry.replace(",", ".")) * 100))}
          </span>
        ) : null}
      </label>

      <section className="space-y-3">
        <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Kategori
        </p>
        <div className="flex flex-wrap gap-2">
          {TR_BOUTIQUE_CATEGORIES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={chipClass(category === entry.id)}
              onClick={() =>
                setCategory((current) => (current === entry.id ? null : entry.id))
              }
            >
              {entry.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Bedenler
        </p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_LETTER_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={chipClass(sizes.includes(size))}
              onClick={() => toggleSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Renkler
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => {
            const active = colors.some((entry) => entry.hex === color.hex);
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
        </div>
        {colors.length > 0 ? (
          <p className="text-[11px] text-neutral-600">
            {colors.map((color) => color.name).join(", ")}
          </p>
        ) : null}
      </section>

      <label className="block space-y-2">
        <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
          Açıklama
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="w-full border border-black/15 bg-white px-3 py-3 text-[14px] outline-none focus:border-black/40"
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
