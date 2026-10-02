"use client";

import { useState } from "react";
import { TrPickerSheet } from "@/components/tr/commerce/TrPickerSheet";
import { TrProductSizePicker } from "@/components/tr/TrProductSizePicker";
import { isSizeInStock, type SizeStocks } from "@/lib/tr/sizeStocks";

interface TrSizeGateSheetProps {
  open: boolean;
  onClose: () => void;
  sizes: string[];
  initialSize?: string | null;
  title?: string;
  confirmLabel?: string;
  onConfirm: (size: string) => void;
  sizeStocks?: SizeStocks | null;
  productTitle?: string;
  whatsappPhone?: string | null;
  accentColor?: string;
}

/** Bottom sheet for size before add-to-cart — keeps the buy CTA always tappable. */
export function TrSizeGateSheet({
  open,
  onClose,
  sizes,
  initialSize = null,
  title = "Beden seçin",
  confirmLabel = "Sepete ekle",
  onConfirm,
  sizeStocks = null,
  productTitle,
  whatsappPhone = null,
  accentColor,
}: TrSizeGateSheetProps) {
  const [draft, setDraft] = useState<string | null>(initialSize);

  // Every open starts from the page's size, or the first one in stock.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(
        initialSize && isSizeInStock(sizeStocks, initialSize)
          ? initialSize
          : (sizes.find((size) => isSizeInStock(sizeStocks, size)) ?? null),
      );
    }
  }

  const canConfirm = Boolean(draft) && isSizeInStock(sizeStocks, draft ?? "");

  return (
    <TrPickerSheet
      open={open}
      onClose={onClose}
      title={title}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      onConfirm={() => {
        if (draft) onConfirm(draft);
      }}
    >
      <TrProductSizePicker
        sizes={sizes}
        selectedSize={draft}
        onChange={setDraft}
        sizeStocks={sizeStocks}
        productTitle={productTitle}
        whatsappPhone={whatsappPhone}
        accentColor={accentColor}
        hideLabel
      />
    </TrPickerSheet>
  );
}
