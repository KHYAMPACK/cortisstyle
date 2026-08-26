"use client";

import type { TrCustomerAddress } from "@/types/tr-marketplace";

function addressSummary(address: TrCustomerAddress): string {
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  return `${street} · ${address.district} / ${address.city}`;
}

export function TrCheckoutAddressPicker({
  addresses,
  selectedId,
  loading,
  onSelect,
}: {
  addresses: TrCustomerAddress[];
  selectedId: string | "new" | null;
  loading?: boolean;
  onSelect: (id: string | "new") => void;
}) {
  if (loading) {
    return (
      <div
        className="space-y-2"
        role="status"
        aria-live="polite"
        aria-label="Kayıtlı adresler yükleniyor"
      >
        <div className="tr-skeleton-bone h-16 w-full" />
        <div className="tr-skeleton-bone h-16 w-full" />
      </div>
    );
  }

  if (addresses.length === 0) return null;

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Kayıtlı adresler">
      {addresses.map((address) => {
        const selected = selectedId === address.id;
        return (
          <button
            key={address.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(address.id)}
            className={`w-full min-h-12 border px-3 py-3 text-left transition-colors ${
              selected
                ? "border-neutral-950 bg-neutral-50"
                : "border-black/10 bg-white hover:border-black/25"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[12px] tracking-[0.12em] text-neutral-950 uppercase">
                {address.label}
              </span>
              {address.isDefault ? (
                <span className="text-[10px] tracking-[0.14em] text-brand-primary uppercase">
                  Varsayılan
                </span>
              ) : null}
            </span>
            <span className="mt-1 block text-[13px] text-neutral-800">
              {address.recipientName}
            </span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-neutral-600">
              {addressSummary(address)}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        role="radio"
        aria-checked={selectedId === "new"}
        onClick={() => onSelect("new")}
        className={`w-full min-h-12 border px-3 py-3 text-left text-[12px] tracking-[0.12em] uppercase transition-colors ${
          selectedId === "new"
            ? "border-neutral-950 bg-neutral-50"
            : "border-dashed border-black/15 bg-white hover:border-black/30"
        }`}
      >
        Yeni adres
      </button>
    </div>
  );
}
