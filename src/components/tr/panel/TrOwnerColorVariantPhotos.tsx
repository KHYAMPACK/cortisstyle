"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from "react";
import {
  COLOR_GROUP_UPLOAD_MAX,
  colorVariantPhotosReady,
  emptyColorVariantDraft,
  type ColorVariantUploadDraft,
} from "@/lib/tr/catalog/colorSiblings";
import { TR_AI_CATALOG_CREDITS } from "@/lib/tr/aiCatalog/uploadCostHints";
import {
  panelAddChipClass,
  panelHintClass,
  panelLabelClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { uploadOwnerProductImage } from "@/lib/tr/ownerClient";

interface TrOwnerColorVariantPhotosProps {
  boutiqueId: string;
  variants: ColorVariantUploadDraft[];
  onChange: (variants: ColorVariantUploadDraft[]) => void;
  disabled?: boolean;
  generatingIds?: ReadonlySet<string>;
  tryOnGeneratingIds?: ReadonlySet<string>;
}

function isAcceptedPhoto(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/png" || type === "image/jpeg" || type === "image/webp") {
    return true;
  }
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

export function TrOwnerColorVariantPhotos({
  boutiqueId,
  variants,
  onChange,
  disabled = false,
  generatingIds,
  tryOnGeneratingIds,
}: TrOwnerColorVariantPhotosProps) {
  const extraSlots = COLOR_GROUP_UPLOAD_MAX - 1;
  const canAdd = variants.length < extraSlots && !disabled;
  const extraReady = variants.filter(colorVariantPhotosReady).length;
  const colorCount = 1 + extraReady;
  const credits =
    colorCount *
    (TR_AI_CATALOG_CREDITS.productPackage +
      2 * TR_AI_CATALOG_CREDITS.modelPackage);

  return (
    <div className="space-y-4 border-t border-neutral-200/80 pt-5">
      <div>
        <p className={panelLabelClass}>Diğer renkler — ayrı ürünler</p>
        <p className={`mt-1 ${panelHintClass}`}>
          Her renk ayrı bir ürün olarak kaydedilir. Ön + arka yükleyin;
          özellikler ve fiyat ilk üründen kopyalanır, stokları ayrı girersiniz.
          Mağazada “Diğer renkler” ile bağlanır.
        </p>
        <p className="mt-2 text-[13px] text-neutral-600">
          {colorCount} ürün: {colorCount} packshot + {colorCount * 2} model
          karesi = {credits} kredi.
        </p>
      </div>

      {variants.map((variant, index) => (
        <ColorVariantBlock
          key={variant.id}
          boutiqueId={boutiqueId}
          index={index}
          variant={variant}
          disabled={disabled}
          generating={Boolean(generatingIds?.has(variant.id))}
          tryOnGenerating={Boolean(tryOnGeneratingIds?.has(variant.id))}
          onChange={(next) =>
            onChange(variants.map((entry) => (entry.id === next.id ? next : entry)))
          }
          onRemove={() =>
            onChange(variants.filter((entry) => entry.id !== variant.id))
          }
        />
      ))}

      {canAdd ? (
        <button
          type="button"
          className={panelAddChipClass}
          onClick={() => onChange([...variants, emptyColorVariantDraft()])}
        >
          + Renk ekle (ayrı ürün)
        </button>
      ) : null}
    </div>
  );
}

export function TrOwnerColorVariantProgress({
  variants,
  packshotBusyIds,
  tryOnBusyIds,
}: {
  variants: ColorVariantUploadDraft[];
  packshotBusyIds?: ReadonlySet<string>;
  tryOnBusyIds?: ReadonlySet<string>;
}) {
  const rows = variants.filter(
    (variant) =>
      colorVariantPhotosReady(variant) ||
      Boolean(variant.frontUrl.trim() || variant.backUrl.trim()),
  );
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] p-4">
      <p className="text-[15px] font-semibold text-neutral-900">
        Diğer renkler — her biri ayrı ürün
      </p>
      <ul className="space-y-3">
        {rows.map((variant, index) => {
          const packing = Boolean(packshotBusyIds?.has(variant.id));
          const tryingOn = Boolean(tryOnBusyIds?.has(variant.id));
          const label =
            variant.colorName.trim() || `Renk ${index + 2}`;
          const lifestyle = variant.lifestyleImages.filter((url) =>
            url.trim(),
          );
          return (
            <li
              key={variant.id}
              className="flex items-center gap-3 text-[14px] text-neutral-800"
            >
              <ColorThumb
                src={
                  variant.packshotUrl.trim() ||
                  variant.frontUrl.trim() ||
                  null
                }
                alt={label}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{label}</p>
                <p className="mt-0.5 text-[13px] text-neutral-600">
                  {packing
                    ? "Packshot üretiliyor…"
                    : tryingOn
                      ? "Model fotoğrafı hazırlanıyor…"
                      : lifestyle.length > 0
                        ? "Packshot ve model hazır"
                        : variant.packshotUrl.trim()
                          ? "Packshot hazır — model ilk üründen sonra üretilir"
                          : "Ön ve arka fotoğraf yüklendi"}
                </p>
              </div>
              {lifestyle.length > 0 ? (
                <div className="flex gap-1">
                  {lifestyle.slice(0, 2).map((src) => (
                    <ColorThumb key={src} src={src} alt="" />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ColorThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-white">
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" sizes="36px" />
      ) : (
        <span className="block h-full w-full bg-neutral-200" />
      )}
    </div>
  );
}

function ColorVariantBlock({
  boutiqueId,
  index,
  variant,
  disabled,
  generating,
  tryOnGenerating,
  onChange,
  onRemove,
}: {
  boutiqueId: string;
  index: number;
  variant: ColorVariantUploadDraft;
  disabled: boolean;
  generating: boolean;
  tryOnGenerating: boolean;
  onChange: (next: ColorVariantUploadDraft) => void;
  onRemove: () => void;
}) {
  const busy = generating;
  const lifestyle = variant.lifestyleImages.filter((url) => url.trim());

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200/80 bg-[#F7F5F1] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-semibold text-neutral-900">
          Ürün {index + 2}
          {variant.colorName ? ` — ${variant.colorName}` : " (ayrı renk)"}
        </p>
        <button
          type="button"
          className={`${panelSecondaryBtnClass} min-h-11 px-3 text-[13px]`}
          disabled={disabled || busy}
          onClick={onRemove}
        >
          Kaldır
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <VariantSlot
          boutiqueId={boutiqueId}
          label="Ön"
          url={variant.frontUrl}
          disabled={disabled || busy}
          onUploaded={(url) =>
            onChange({
              ...variant,
              frontUrl: url,
              packshotUrl: "",
              lifestyleImages: [],
            })
          }
          onClear={() =>
            onChange({
              ...variant,
              frontUrl: "",
              packshotUrl: "",
              lifestyleImages: [],
            })
          }
        />
        <VariantSlot
          boutiqueId={boutiqueId}
          label="Arka"
          url={variant.backUrl}
          disabled={disabled || busy}
          onUploaded={(url) =>
            onChange({
              ...variant,
              backUrl: url,
              packshotUrl: "",
              lifestyleImages: [],
            })
          }
          onClear={() =>
            onChange({
              ...variant,
              backUrl: "",
              packshotUrl: "",
              lifestyleImages: [],
            })
          }
        />
        {variant.packshotUrl ? (
          <div className="w-[4.75rem] min-w-0 sm:w-[5.5rem]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-white">
              <Image
                src={variant.packshotUrl}
                alt="Packshot"
                fill
                className="object-contain p-1"
                sizes="88px"
              />
            </div>
            <p className="mt-1 truncate text-center text-[11px] font-semibold text-neutral-800">
              Packshot
            </p>
          </div>
        ) : busy ? (
          <p className="self-center text-[13px] text-neutral-600">
            Packshot üretiliyor…
          </p>
        ) : null}
        {lifestyle.map((src, shotIndex) => (
          <div key={src} className="w-[4.75rem] min-w-0 sm:w-[5.5rem]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-white">
              <Image
                src={src}
                alt={`Model ${shotIndex + 1}`}
                fill
                className="object-cover"
                sizes="88px"
              />
            </div>
            <p className="mt-1 truncate text-center text-[11px] font-semibold text-neutral-800">
              Model {shotIndex + 1}
            </p>
          </div>
        ))}
        {tryOnGenerating ? (
          <p className="self-center text-[13px] text-neutral-600">
            Model fotoğrafı hazırlanıyor…
          </p>
        ) : null}
      </div>
    </div>
  );
}

function VariantSlot({
  boutiqueId,
  label,
  url,
  disabled,
  onUploaded,
  onClear,
}: {
  boutiqueId: string;
  label: string;
  url: string;
  disabled: boolean;
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function clearLocalPreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
  }

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  async function onFile(file: File | undefined) {
    if (!file || !isAcceptedPhoto(file) || disabled || uploading) return;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const local = URL.createObjectURL(file);
    previewRef.current = local;
    setPreviewUrl(local);
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadOwnerProductImage(boutiqueId, file, {
        removeBackground: false,
      });
      const next = uploaded.url?.trim();
      if (!next) throw new Error("Fotoğraf yüklenemedi.");
      onUploaded(next);
    } catch (uploadError) {
      clearLocalPreview();
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setUploading(false);
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
      setPreviewUrl(null);
    }
  }

  function onDragOver(event: ReactDragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || uploading) return;
    event.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }

  function onDragLeave(event: ReactDragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }

  function onDrop(event: ReactDragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = event.dataTransfer.files?.[0];
    void onFile(file);
  }

  const dropClass = dragOver
    ? "ring-2 ring-[color:var(--panel-accent)] ring-offset-1"
    : "";
  const displayUrl = previewUrl || url;

  return (
    <div className="w-[4.75rem] min-w-0 sm:w-[5.5rem]">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {displayUrl ? (
        <div
          className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#EDE9E2] ${dropClass}`}
          aria-busy={uploading}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Image
              src={url}
              alt={label}
              fill
              className="object-cover"
              sizes="88px"
            />
          )}
          {uploading ? (
            <div className="absolute inset-0 z-[1] flex items-end justify-center bg-black/45 px-1 pb-2">
              <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
                Yükleniyor…
              </span>
            </div>
          ) : null}
          {url && !uploading ? (
            <button
              type="button"
              className="absolute top-1 right-1 z-[1] min-h-8 min-w-8 rounded-md bg-black/55 text-[11px] font-semibold text-white"
              disabled={disabled}
              onClick={onClear}
              aria-label={`${label} sil`}
            >
              Sil
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative flex aspect-[3/4] w-full items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-white text-center text-[11px] font-semibold text-neutral-500 disabled:opacity-60 ${dropClass}`}
        >
          Ekle
        </button>
      )}
      <p className="mt-1 truncate text-center text-[11px] font-semibold text-neutral-800">
        {label}
      </p>
      {error ? (
        <p className="mt-0.5 text-center text-[10px] text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
