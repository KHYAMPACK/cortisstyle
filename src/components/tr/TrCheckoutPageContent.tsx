"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { TrSandboxBanner } from "@/components/tr/TrSandboxBanner";
import { trCartPath } from "@/lib/tr/paths";
import { useTrCartStore } from "@/store/trCartStore";
import {
  cartTotalKurus,
  EMPTY_CHECKOUT_FORM,
  groupCartItemsByBoutique,
  type TrCheckoutFormData,
} from "@/types/tr-cart";
import { formatTryFromKurus } from "@/types/tr-marketplace";

const inputClassName =
  "w-full border border-blueprint-border bg-canvas-paper px-3 py-3 text-[13px] text-jet-black outline-none focus-visible:ring-2 focus-visible:ring-blueprint-accent";

const labelClassName = "text-meta text-[10px] tracking-[0.16em] uppercase";

export function TrCheckoutPageContent() {
  const items = useTrCartStore((state) => state.items);
  const [form, setForm] = useState<TrCheckoutFormData>(EMPTY_CHECKOUT_FORM);
  const grouped = groupCartItemsByBoutique(items);
  const totalKurus = cartTotalKurus(items);

  if (items.length === 0) {
    return (
      <div className="space-y-6 px-5 py-10 md:px-10">
        <TrSandboxBanner />
        <p className="text-meta max-w-xl text-[12px] leading-relaxed">
          Ödeme için önce sepetinize ürün ekleyin.
        </p>
        <Link
          href={trCartPath()}
          className="btn-primary inline-flex items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
        >
          Sepete dön
        </Link>
      </div>
    );
  }

  const updateField = (field: keyof TrCheckoutFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="px-5 py-8 md:px-10 md:py-10">
      <TrSandboxBanner className="mb-8" />

      <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border border-blueprint-border bg-canvas-paper p-5">
            <h2 className="font-serif text-xl tracking-[-0.02em] text-neutral-950">
              İletişim
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelClassName}>Ad soyad</span>
                <input
                  required
                  value={form.customerName}
                  onChange={(event) => updateField("customerName", event.target.value)}
                  className={`${inputClassName} mt-2`}
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className={labelClassName}>E-posta</span>
                <input
                  required
                  type="email"
                  value={form.customerEmail}
                  onChange={(event) => updateField("customerEmail", event.target.value)}
                  className={`${inputClassName} mt-2`}
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className={labelClassName}>Telefon</span>
                <input
                  value={form.customerPhone}
                  onChange={(event) => updateField("customerPhone", event.target.value)}
                  className={`${inputClassName} mt-2`}
                  autoComplete="tel"
                />
              </label>
            </div>
          </section>

          <section className="border border-blueprint-border bg-canvas-paper p-5">
            <h2 className="font-serif text-xl tracking-[-0.02em] text-neutral-950">
              Teslimat adresi
            </h2>
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className={labelClassName}>Adres</span>
                <input
                  required
                  value={form.line1}
                  onChange={(event) => updateField("line1", event.target.value)}
                  className={`${inputClassName} mt-2`}
                  autoComplete="address-line1"
                />
              </label>
              <label className="block">
                <span className={labelClassName}>Adres devamı (isteğe bağlı)</span>
                <input
                  value={form.line2}
                  onChange={(event) => updateField("line2", event.target.value)}
                  className={`${inputClassName} mt-2`}
                  autoComplete="address-line2"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClassName}>İlçe</span>
                  <input
                    required
                    value={form.district}
                    onChange={(event) => updateField("district", event.target.value)}
                    className={`${inputClassName} mt-2`}
                  />
                </label>
                <label className="block">
                  <span className={labelClassName}>İl</span>
                  <input
                    required
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    className={`${inputClassName} mt-2`}
                  />
                </label>
              </div>
              <label className="block sm:max-w-xs">
                <span className={labelClassName}>Posta kodu</span>
                <input
                  required
                  value={form.postalCode}
                  onChange={(event) => updateField("postalCode", event.target.value)}
                  className={`${inputClassName} mt-2`}
                  autoComplete="postal-code"
                />
              </label>
            </div>
          </section>

          <section className="border border-blueprint-border bg-blueprint-surface p-5">
            <h2 className="font-serif text-xl tracking-[-0.02em] text-neutral-950">
              Ön bilgilendirme
            </h2>
            <ul className="text-meta mt-4 space-y-2 text-[12px] leading-relaxed">
              {items.map((item) => (
                <li key={item.productId}>
                  {item.title} — {formatTryFromKurus(item.priceKurus)} — Satıcı:{" "}
                  {item.boutiqueName}
                </li>
              ))}
            </ul>
            <label className="mt-5 flex items-start gap-3 text-[12px] leading-relaxed text-neutral-800">
              <input required type="checkbox" className="mt-1" />
              <span>
                Mesafeli satış sözleşmesi ve ön bilgilendirme formunu okudum. (Taslak —
                ödeme henüz aktif değil.)
              </span>
            </label>
          </section>

          <button
            type="submit"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center border border-blueprint-border bg-neutral-100 px-6 py-4 text-[11px] tracking-[0.2em] text-meta uppercase sm:max-w-md"
          >
            Ödemeyi tamamla (yakında)
          </button>
        </form>

        <aside className="border border-blueprint-border bg-canvas-paper p-5 lg:sticky lg:top-24">
          <p className="text-meta text-[10px] tracking-[0.22em] uppercase">Sipariş özeti</p>
          <div className="mt-4 space-y-4">
            {grouped.map((group) => (
              <div key={group.boutiqueId}>
                <p className="text-meta text-[10px] tracking-[0.16em] uppercase">
                  {group.boutiqueName}
                </p>
                <ul className="mt-2 space-y-1 text-[12px] text-neutral-800">
                  {group.items.map((item) => (
                    <li key={item.productId} className="flex justify-between gap-3">
                      <span className="truncate">{item.title}</span>
                      <span className="shrink-0">{formatTryFromKurus(item.priceKurus)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-blueprint-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-meta text-[10px] tracking-[0.16em] uppercase">Toplam</span>
              <span className="font-serif text-xl text-neutral-950">
                {formatTryFromKurus(totalKurus)}
              </span>
            </div>
          </div>
          <Link
            href={trCartPath()}
            className="text-meta mt-5 inline-block text-[10px] tracking-[0.22em] uppercase underline underline-offset-2"
          >
            ← Sepete dön
          </Link>
        </aside>
      </div>
    </div>
  );
}
