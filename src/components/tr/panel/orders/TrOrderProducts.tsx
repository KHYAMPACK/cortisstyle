"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import { getTrCategoryLabel } from "@/lib/tr/fashion/categories";
import { trPanelEditProductPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrOrderItem,
} from "@/types/tr-marketplace";

const ROW_GRID =
  "sm:grid sm:grid-cols-[minmax(0,1fr)_4rem_6.5rem_7.5rem] sm:items-center sm:gap-4";

function variantLine(item: TrOrderItem): string | null {
  const parts = [
    item.size ? `Beden: ${item.size}` : null,
    item.customization?.styleOption?.trim()
      ? `Stil: ${item.customization.styleOption.trim()}`
      : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function Thumb({ item }: { item: TrOrderItem }) {
  const url = item.referenceImageUrl ?? item.imageUrl;
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-[color:var(--panel-accent-soft)]">
      {url ? (
        <Image
          src={url}
          alt=""
          fill
          className="object-cover"
          sizes="40px"
          unoptimized={Boolean(item.referenceImageUrl)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-neutral-500">
          {item.title.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12.5px] text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] font-medium text-neutral-900">
        {children}
      </dd>
    </div>
  );
}

/** What a click on a product line shows: the product's details and a way to its page. */
function ProductDetails({
  item,
  close,
}: {
  item: TrOrderItem;
  close: () => void;
}) {
  const category = item.category ? getTrCategoryLabel(item.category) : null;
  const style = item.customization?.styleOption?.trim();

  return (
    <div className="w-[15.5rem] space-y-3 p-1">
      {item.productId ? (
        <Link
          href={trPanelEditProductPath(item.productId)}
          onClick={close}
          className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--panel-accent)] px-3 text-[13.5px] font-semibold text-[color:var(--panel-accent-deep)] transition-colors duration-150 hover:bg-[color:var(--panel-accent-soft)]"
        >
          Ürüne Git
          <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </Link>
      ) : (
        <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-[12.5px] text-neutral-500">
          Bu ürün katalogdan silinmiş.
        </p>
      )}
      <dl className="space-y-3 border-t border-neutral-100 pt-3">
        <InfoRow label="Ürün adı">{item.title}</InfoRow>
        {category ? <InfoRow label="Ana kategori">{category}</InfoRow> : null}
        {item.size ? <InfoRow label="Beden">{item.size}</InfoRow> : null}
        {style ? <InfoRow label="Stil">{style}</InfoRow> : null}
        {item.referenceImageUrl ? (
          <InfoRow label="Müşteri fotoğrafı">
            <a
              href={item.referenceImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--panel-accent-deep)] hover:underline"
            >
              Aç / indir
            </a>
          </InfoRow>
        ) : null}
      </dl>
    </div>
  );
}

/** Ürün · Adet · Fiyat · Toplam Tutar, one row per line, each opening its details. */
export function TrOrderProducts({ items }: { items: TrOrderItem[] }) {
  return (
    <div>
      <div
        className={`hidden border-y border-neutral-200/80 bg-neutral-50 px-6 py-2.5 text-[13px] font-medium text-neutral-600 sm:grid sm:grid-cols-[minmax(0,1fr)_4rem_6.5rem_7.5rem] sm:gap-4`}
        aria-hidden
      >
        <span>Ürün</span>
        <span>Adet</span>
        <span>Fiyat</span>
        <span className="text-right">Toplam Tutar</span>
      </div>
      <ul className="divide-y divide-neutral-100">
        {items.map((item) => {
          const variant = variantLine(item);
          return (
            <li key={item.id} className={`px-4 py-3 sm:px-6 ${ROW_GRID}`}>
              <TrPanelPopover
                label={`${item.title} ürün bilgisi`}
                align="start"
                panelClassName="p-3"
                trigger={({ open, ...trigger }) => (
                  <button
                    type="button"
                    {...trigger}
                    className={`-mx-2 flex max-w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] ${
                      open ? "bg-neutral-50" : ""
                    }`}
                  >
                    <Thumb item={item} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-neutral-900">
                        {item.title}
                      </span>
                      {variant ? (
                        <span className="block truncate text-[12.5px] text-neutral-500">
                          {variant}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )}
              >
                {(close) => <ProductDetails item={item} close={close} />}
              </TrPanelPopover>

              <p className="mt-1 flex items-baseline justify-between gap-3 text-[13.5px] tabular-nums text-neutral-600 sm:contents">
                <span className="sm:text-neutral-800">
                  <span className="sm:hidden">Adet: </span>
                  {item.quantity}
                </span>
                <span className="sm:text-neutral-800">
                  {formatTryFromKurus(item.priceKurus)}
                </span>
                <span className="font-medium text-neutral-900 sm:text-right">
                  {formatTryFromKurus(item.priceKurus * item.quantity)}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
