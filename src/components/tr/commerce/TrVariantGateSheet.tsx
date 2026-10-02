"use client";

import { useState } from "react";
import { TrPickerSheet } from "@/components/tr/commerce/TrPickerSheet";
import { TrVariantPicker } from "@/components/tr/product/TrPdpVariants";
import {
  initialSelection,
  pickValue,
  selectedVariant,
  type TrPublicVariant,
  type TrPublicVariants,
  type TrVariantSelection,
} from "@/lib/tr/variants/storefront";

/**
 * Bottom sheet to finish choosing a variant before add-to-cart (the product page's
 * buy bar, and quick-add on product lists). Confirms only a combination in stock.
 */
export function TrVariantGateSheet({
  open,
  onClose,
  data,
  initial,
  title = "Seçenek belirleyin",
  confirmLabel = "Sepete ekle",
  onConfirm,
  accentColor,
}: {
  open: boolean;
  onClose: () => void;
  data: TrPublicVariants | null;
  /** The page's selection to start from; else the default one. */
  initial?: TrVariantSelection | null;
  title?: string;
  confirmLabel?: string;
  onConfirm: (variant: TrPublicVariant, selection: TrVariantSelection) => void;
  accentColor?: string;
}) {
  const [draft, setDraft] = useState<TrVariantSelection>({});
  // Each open starts fresh, once the options are in (quick-add loads them on open).
  const [seeded, setSeeded] = useState(false);
  if (!open && seeded) setSeeded(false);
  if (open && data && !seeded) {
    setSeeded(true);
    setDraft(initial ?? initialSelection(data));
  }

  const variant = data ? selectedVariant(data, draft) : null;
  const canConfirm = Boolean(variant && variant.stock > 0);

  return (
    <TrPickerSheet
      open={open}
      onClose={onClose}
      title={title}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      onConfirm={() => {
        if (variant) onConfirm(variant, draft);
      }}
    >
      {data ? (
        <TrVariantPicker
          data={data}
          selection={draft}
          onPick={(typeId, valueId) => setDraft(pickValue(data, draft, typeId, valueId))}
          accentColor={accentColor}
          className="space-y-5 pb-2"
        />
      ) : (
        <p className="py-6 text-center text-[13px] text-neutral-500">Seçenekler yükleniyor…</p>
      )}
    </TrPickerSheet>
  );
}
