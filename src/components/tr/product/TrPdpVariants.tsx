"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { TrProductGallery } from "@/components/tr/TrProductGallery";
import {
  photoOption,
  photoParamName,
  galleryForSelection,
  initialSelection,
  isValueAvailable,
  pickValue,
  publicVariantLabel,
  selectedVariant,
  valueParam,
  type TrPublicVariant,
  type TrPublicVariants,
  type TrVariantSelection,
} from "@/lib/tr/variants/storefront";

/**
 * The product page's variant state (F5), shared by the gallery and the detail panel:
 * what the shopper picked, the variant it names, and the photos to show. The chosen value
 * of the photo option is kept in the address (`?renk=` for Renk) so a shared link opens it.
 */

interface PdpVariantsValue {
  data: TrPublicVariants;
  selection: TrVariantSelection;
  pick: (typeId: string, valueId: string) => void;
  variant: TrPublicVariant | null;
  /** "Kırmızı / S" for the chosen variant. */
  label: string | null;
  gallery: string[];
}

const PdpVariantsContext = createContext<PdpVariantsValue | null>(null);

/** The product page's variants, or `null` for a product without any. */
export function usePdpVariants(): PdpVariantsValue | null {
  return useContext(PdpVariantsContext);
}

export function TrPdpVariantsProvider({
  data,
  productImages,
  children,
}: {
  data: TrPublicVariants;
  /** The product's own gallery, shown until a colour with photos is chosen. */
  productImages: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selection, setSelection] = useState<TrVariantSelection>(() => {
    const option = photoOption(data);
    return initialSelection(data, option ? searchParams.get(photoParamName(option)) : null);
  });

  const pick = useCallback(
    (typeId: string, valueId: string) => {
      const next = pickValue(data, selection, typeId, valueId);
      setSelection(next);
      const option = photoOption(data);
      if (option && typeId === option.typeId) {
        const value = option.values.find((entry) => entry.id === valueId);
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(photoParamName(option), valueParam(value.label));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [data, selection, pathname, router, searchParams],
  );

  const value = useMemo<PdpVariantsValue>(() => {
    const variant = selectedVariant(data, selection);
    return {
      data,
      selection,
      pick,
      variant,
      label: variant ? publicVariantLabel(data, variant) : null,
      gallery: galleryForSelection(data, selection, productImages),
    };
  }, [data, selection, pick, productImages]);

  return <PdpVariantsContext.Provider value={value}>{children}</PdpVariantsContext.Provider>;
}

/** The gallery, following the chosen colour. */
export function TrPdpVariantGallery({ title }: { title: string }) {
  const variants = usePdpVariants();
  const images = variants?.gallery ?? [];
  // Remount on a new set of photos so the gallery starts at the first one.
  return <TrProductGallery key={images.join("|")} product={{ title, images }} />;
}

/**
 * The option pickers: swatches for a colour (or picture) option, buttons for the rest.
 * A value that can't be sold with the other choices is shown struck through and
 * can't be picked.
 */
export function TrVariantPicker({
  data,
  selection,
  onPick,
  accentColor,
  className = "mt-6 space-y-5",
}: {
  data: TrPublicVariants;
  selection: TrVariantSelection;
  onPick: (typeId: string, valueId: string) => void;
  accentColor?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {data.options.map((option) => {
        const chosen = option.values.find((value) => value.id === selection[option.typeId]);
        const swatch = option.selectionStyle === "swatch";
        return (
          <div key={option.typeId}>
            <p className="text-[11px] font-medium tracking-[0.12em] text-neutral-800 uppercase">
              {option.name}
              {chosen ? (
                <span className="ml-2 font-normal tracking-normal text-neutral-600 normal-case">
                  {chosen.label}
                </span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {option.values.map((value) => {
                const selected = value.id === chosen?.id;
                const available = isValueAvailable(data, selection, option.typeId, value.id);
                if (swatch) {
                  return (
                    <button
                      key={value.id}
                      type="button"
                      title={value.label}
                      aria-label={`${option.name}: ${value.label}${available ? "" : " (stokta yok)"}`}
                      aria-pressed={selected}
                      disabled={!available}
                      onClick={() => onPick(option.typeId, value.id)}
                      className={`relative h-9 w-9 rounded-full border transition-[box-shadow,opacity] ${
                        selected ? "ring-2 ring-offset-2" : "border-black/15"
                      } ${available ? "" : "cursor-not-allowed opacity-35"}`}
                      style={{
                        backgroundColor: value.hex ?? "#e5e5e5",
                        ...(value.imageUrl
                          ? { backgroundImage: `url(${value.imageUrl})`, backgroundSize: "cover" }
                          : {}),
                        ...(selected ? { ["--tw-ring-color" as string]: accentColor ?? "#111" } : {}),
                      }}
                    >
                      {!available ? (
                        <span
                          aria-hidden
                          className="absolute top-1/2 left-1/2 h-px w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-neutral-700"
                        />
                      ) : null}
                    </button>
                  );
                }
                return (
                  <button
                    key={value.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={!available}
                    onClick={() => onPick(option.typeId, value.id)}
                    className={`min-h-11 min-w-12 border px-3 text-[13px] tracking-[0.04em] transition-colors ${
                      selected
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : available
                          ? "border-black/15 bg-white text-neutral-900 hover:border-neutral-950"
                          : "cursor-not-allowed border-black/10 bg-neutral-50 text-neutral-400 line-through"
                    }`}
                    style={
                      selected && accentColor
                        ? { backgroundColor: accentColor, borderColor: accentColor }
                        : undefined
                    }
                  >
                    {value.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
