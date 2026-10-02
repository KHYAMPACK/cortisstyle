"use client";

import { ArrowUpRight, MessageCircle } from "lucide-react";
import {
  buildSizeHelpWhatsAppMessage,
  buildSizeRestockNotifyMessage,
  buildWhatsAppOrderUrl,
} from "@/lib/tr/whatsapp";
import { isSizeInStock, type SizeStocks } from "@/lib/tr/sizeStocks";

interface TrProductSizePickerProps {
  sizes: string[];
  selectedSize: string | null;
  onChange: (size: string) => void;
  /** When set, 0-stock sizes stay visible as “gelince haber ver”. */
  sizeStocks?: SizeStocks | null;
  productTitle?: string;
  whatsappPhone?: string | null;
  /** Boutique theme accent; defaults to marketplace brand primary. */
  accentColor?: string;
  /** Hide the “Beden seçin” heading (e.g. sheet already has a title). */
  hideLabel?: boolean;
  /** WhatsApp “pick a size together” under the chips. Off in add-to-cart sheets. */
  showSizeHelp?: boolean;
  className?: string;
}

export function TrProductSizePicker({
  sizes,
  selectedSize,
  onChange,
  sizeStocks = null,
  productTitle = "Ürün",
  whatsappPhone = null,
  accentColor,
  hideLabel = false,
  showSizeHelp = true,
  className = "",
}: TrProductSizePickerProps) {
  if (sizes.length === 0) return null;

  const selectedOutOfStock =
    Boolean(selectedSize) && !isSizeInStock(sizeStocks, selectedSize!);

  const notifyHref =
    selectedOutOfStock && selectedSize && whatsappPhone
      ? buildWhatsAppOrderUrl(
          whatsappPhone,
          buildSizeRestockNotifyMessage({
            title: productTitle,
            size: selectedSize,
          }),
        )
      : null;

  const sizeHelpHref =
    showSizeHelp && whatsappPhone
      ? buildWhatsAppOrderUrl(
          whatsappPhone,
          buildSizeHelpWhatsAppMessage({
            title: productTitle,
            size: selectedSize,
          }),
        )
      : null;

  return (
    <div className={className || (hideLabel ? "mt-3" : "mt-6")}>
      {hideLabel ? null : (
        <p className="text-[11px] font-medium tracking-[0.12em] text-neutral-800 uppercase">
          Beden seçin
        </p>
      )}
      <div className={`flex flex-wrap gap-2 ${hideLabel ? "" : "mt-3"}`}>
        {sizes.map((size) => {
          const inStock = isSizeInStock(sizeStocks, size);
          const isSelected = selectedSize === size;
          const useCustomAccent = Boolean(accentColor && isSelected && inStock);

          return (
            <button
              key={size}
              type="button"
              onClick={() => onChange(size)}
              aria-pressed={isSelected}
              title={!inStock ? "Stok yok — gelince haber ver" : undefined}
              className={`relative min-w-[2.75rem] border px-3 py-2 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors ${
                !inStock
                  ? isSelected
                    ? "border-neutral-500 bg-neutral-100 text-neutral-500"
                    : "border-black/10 bg-neutral-50 text-neutral-400"
                  : isSelected && !accentColor
                    ? "border-brand-primary bg-brand-primary text-white"
                    : !isSelected
                      ? "border-black/12 bg-white text-neutral-900"
                      : "text-white"
              }`}
              style={
                useCustomAccent
                  ? {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                      color: "#ffffff",
                    }
                  : undefined
              }
            >
              <span
                className={
                  !inStock ? "line-through decoration-neutral-300" : undefined
                }
              >
                {size}
              </span>
            </button>
          );
        })}
      </div>

      {sizeHelpHref ? (
        <a
          href={sizeHelpHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-4 flex min-h-14 w-full items-center gap-3 border border-black/10 bg-[#F7F4EF] px-3.5 py-3 text-left transition-colors duration-200 hover:border-black/25 hover:bg-[#F1EDE6]"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: accentColor || "#25D366" }}
            aria-hidden
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold tracking-[-0.01em] text-neutral-950">
              Bedeni birlikte seçelim
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-neutral-600">
              Emin değil misiniz? WhatsApp’tan yazın
            </span>
          </span>
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-800"
            strokeWidth={1.75}
            aria-hidden
          />
        </a>
      ) : null}

      {selectedOutOfStock && selectedSize ? (
        <div className="mt-3 rounded-lg border border-black/8 bg-neutral-50 px-3 py-3">
          <p className="text-[12px] leading-snug text-neutral-700">
            <span className="font-medium text-neutral-900">{selectedSize}</span>{" "}
            bedeni şu an yok. Gelince haber verelim.
          </p>
          {notifyHref ? (
            <a
              href={notifyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-[11px] font-semibold tracking-[0.08em] text-neutral-900 uppercase underline underline-offset-2"
            >
              WhatsApp ile haber ver
            </a>
          ) : (
            <p className="mt-2 text-[11px] text-neutral-500">
              Butik WhatsApp numarası eklenince buradan bildirim isteyebilirsiniz.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
