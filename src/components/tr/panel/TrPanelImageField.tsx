"use client";

import { ImageIcon, Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";
import {
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { uploadOwnerProductImage } from "@/lib/tr/ownerClient";

function isAcceptedImage(file: File): boolean {
  if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) return true;
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

/**
 * One image (a category picture, later a brand logo…): a drop zone while empty, a
 * preview with Değiştir / Kaldır once set. Uploads through the owner image API
 * without background removal. `onUploadingChange` lets the page hold its Kaydet
 * button and exit guard while a file is on its way.
 */
export function TrPanelImageField({
  boutiqueId,
  value,
  onChange,
  onError,
  onUploadingChange,
  label = "Görsel",
  disabled = false,
}: {
  boutiqueId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onError: (message: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const locked = disabled || uploading;

  async function upload(files: FileList | File[]) {
    const file = Array.from(files).find(isAcceptedImage);
    if (!file) {
      onError("PNG, JPEG veya WebP yükleyin.");
      return;
    }
    onError(null);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const uploaded = await uploadOwnerProductImage(boutiqueId, file, {
        removeBackground: false,
      });
      onChange(uploaded.url);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <span className={panelLabelClass}>{label}</span>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={locked}
        onChange={(event) => {
          if (event.target.files) void upload(event.target.files);
        }}
      />

      {value ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            {uploading ? (
              <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                <TrPanelBusySpinner />
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor={inputId}
              className={`${panelSecondaryBtnClass} cursor-pointer ${
                locked ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Değiştir
            </label>
            <button
              type="button"
              className={panelSecondaryBtnClass}
              disabled={locked}
              onClick={() => onChange(null)}
            >
              Kaldır
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            if (!locked) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!locked) void upload(event.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors duration-150 motion-reduce:transition-none ${
            dragging
              ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-soft)]"
              : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
          } ${locked ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? (
            <TrPanelBusySpinner />
          ) : (
            <ImageIcon className="h-6 w-6 text-neutral-500" strokeWidth={1.5} aria-hidden />
          )}
          <span className={panelHintClass}>
            Maksimum 10MB boyutunda .jpeg, .jpg, .png ve .webp türlerinde dosya
            yükleyebilirsiniz.
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--panel-accent-deep)]">
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Görsel Ekle
          </span>
        </label>
      )}
    </div>
  );
}
