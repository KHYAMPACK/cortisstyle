"use client";

import { useId, useRef, useState } from "react";
import { panelHintClass, panelSecondaryBtnClass } from "@/components/tr/panel/panelUi";
import { uploadOwnerProductImage } from "@/lib/tr/ownerClient";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";


function isAcceptedProductPhoto(file: File): boolean {
  if (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp") {
    return true;
  }
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

/** Non-empty image URLs, capped at the product image limit. */
function compactUrls(urls: string[]): string[] {
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, TR_OWNER_PRODUCT_LIMITS.maxImages);
}

export function TrOwnerManualPhotoGallery({
  boutiqueId,
  images,
  onImagesChange,
  onError,
  onLightbox,
  disabled = false,
  uploading = false,
  onUploadingChange,
}: {
  boutiqueId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  onError: (message: string | null) => void;
  onLightbox?: (payload: { src: string; label: string }) => void;
  disabled?: boolean;
  uploading?: boolean;
  onUploadingChange?: (value: boolean) => void;
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const gallery = compactUrls(images);
  const canAdd = gallery.length < TR_OWNER_PRODUCT_LIMITS.maxImages;
  const locked = disabled || uploading || busyIndex != null;

  async function addFiles(files: FileList | File[]) {
    const photos = Array.from(files).filter(isAcceptedProductPhoto);
    if (photos.length === 0) {
      onError("PNG, JPEG veya WebP yükleyin.");
      return;
    }
    const room = TR_OWNER_PRODUCT_LIMITS.maxImages - gallery.length;
    if (room <= 0) {
      onError("En fazla 8 fotoğraf.");
      return;
    }
    const batch = photos.slice(0, room);
    onError(null);
    onUploadingChange?.(true);
    let next = [...gallery];
    try {
      for (let i = 0; i < batch.length; i += 1) {
        setBusyIndex(next.length);
        const uploaded = await uploadOwnerProductImage(boutiqueId, batch[i]!);
        next = compactUrls([...next, uploaded.url]);
        onImagesChange(next);
      }
    } catch (uploadError) {
      onError(
        uploadError instanceof Error ? uploadError.message : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setBusyIndex(null);
      onUploadingChange?.(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onImagesChange(gallery.filter((_, i) => i !== index));
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onImagesChange(next);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[17px] font-semibold text-neutral-800">Fotoğraflar</p>
        <p className={`mt-1 ${panelHintClass}`}>
          En az bir fotoğraf. Sıra sitede görünen sıra — en fazla{" "}
          {TR_OWNER_PRODUCT_LIMITS.maxImages} kare.
        </p>
      </div>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="sr-only"
        disabled={locked || !canAdd}
        onChange={(event) => {
          if (event.target.files) void addFiles(event.target.files);
        }}
      />

      <div className="flex flex-wrap gap-3">
        {gallery.map((src, index) => (
          <div key={`${src}-${index}`} className="w-[5.5rem] space-y-1.5">
            <button
              type="button"
              className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"
              onClick={() => onLightbox?.({ src, label: `Fotoğraf ${index + 1}` })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              {busyIndex === index ? (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[12px] font-semibold text-neutral-700">
                  Yükleniyor…
                </span>
              ) : null}
            </button>
            <div className="flex justify-between gap-1">
              <button
                type="button"
                className="min-h-9 flex-1 rounded-lg text-[12px] font-semibold text-neutral-600 disabled:opacity-40"
                disabled={locked || index === 0}
                onClick={() => move(index, -1)}
              >
                ←
              </button>
              <button
                type="button"
                className="min-h-9 flex-1 rounded-lg text-[12px] font-semibold text-red-700 disabled:opacity-40"
                disabled={locked}
                onClick={() => removeAt(index)}
              >
                Sil
              </button>
              <button
                type="button"
                className="min-h-9 flex-1 rounded-lg text-[12px] font-semibold text-neutral-600 disabled:opacity-40"
                disabled={locked || index === gallery.length - 1}
                onClick={() => move(index, 1)}
              >
                →
              </button>
            </div>
          </div>
        ))}

        {canAdd ? (
          <button
            type="button"
            disabled={locked}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (locked) return;
              void addFiles(event.dataTransfer.files);
            }}
            className={`${panelSecondaryBtnClass} aspect-[3/4] w-[5.5rem] flex-col gap-1 border-dashed px-2 text-[13px]`}
          >
            + Ekle
          </button>
        ) : null}
      </div>
    </div>
  );
}
