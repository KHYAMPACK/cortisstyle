"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrSandboxBanner,
  cartHasDemoItems,
} from "@/components/tr/TrSandboxBanner";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import {
  trBoutiqueLegalPath,
  trBoutiquePath,
  trCartPath,
  trOrderConfirmationPath,
} from "@/lib/tr/paths";
import { getTrBoutiqueLocalCartStore } from "@/store/trBoutiqueLocalCartStore";
import { useTrCartStore } from "@/store/trCartStore";
import {
  cartTotalKurus,
  EMPTY_CHECKOUT_FORM,
  groupCartItemsByBoutique,
  type TrCartLineItem,
  type TrCheckoutFormData,
} from "@/types/tr-cart";
import { formatTryFromKurus } from "@/types/tr-marketplace";

const inputClassName =
  "w-full border border-blueprint-border bg-canvas-paper px-3 py-3 text-[13px] text-jet-black outline-none focus-visible:ring-2 focus-visible:ring-blueprint-accent";

const labelClassName = "text-meta text-[10px] tracking-[0.16em] uppercase";

function useCheckoutCart(boutiqueSlug: string | null): {
  items: TrCartLineItem[];
  clearCart: () => void;
  hydrated: boolean;
} {
  const globalItems = useTrCartStore((state) => state.items);
  const clearGlobal = useTrCartStore((state) => state.clearCart);
  const [localItems, setLocalItems] = useState<TrCartLineItem[]>([]);
  const [hydrated, setHydrated] = useState(!boutiqueSlug);

  useEffect(() => {
    if (!boutiqueSlug) {
      setHydrated(true);
      return;
    }

    const store = getTrBoutiqueLocalCartStore(boutiqueSlug);
    const sync = () => setLocalItems(store.getState().items);
    sync();

    const unsub = store.subscribe(sync);
    const finish = store.persist?.onFinishHydration(() => {
      sync();
      setHydrated(true);
    });
    if (store.persist?.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsub();
      finish?.();
    };
  }, [boutiqueSlug]);

  if (boutiqueSlug) {
    return {
      items: localItems,
      clearCart: () => getTrBoutiqueLocalCartStore(boutiqueSlug).getState().clearCart(),
      hydrated,
    };
  }

  return { items: globalItems, clearCart: clearGlobal, hydrated: true };
}

function TrCheckoutForm({ boutiqueSlug }: { boutiqueSlug: string | null }) {
  const router = useRouter();
  const { items, clearCart, hydrated } = useCheckoutCart(boutiqueSlug);
  const [form, setForm] = useState<TrCheckoutFormData>(EMPTY_CHECKOUT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedDistance, setAcceptedDistance] = useState(false);
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);

  const grouped = groupCartItemsByBoutique(items);
  const totalKurus = cartTotalKurus(items);
  const demoCart = cartHasDemoItems(items);
  const boutiqueCheckout = Boolean(boutiqueSlug);
  const canSubmit =
    demoCart || boutiqueCheckout || isTrCheckoutEnabled();

  if (!hydrated) {
    return (
      <div className="px-5 py-10 text-[13px] text-neutral-600 md:px-10">
        Sepet yükleniyor…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6 px-5 py-10 md:px-10">
        <TrSandboxBanner demo={demoCart || !isTrCheckoutEnabled()} />
        <p className="text-meta max-w-xl text-[12px] leading-relaxed">
          Ödeme için önce sepetinize ürün ekleyin.
        </p>
        <Link
          href={
            boutiqueSlug ? trBoutiquePath(boutiqueSlug) : trCartPath()
          }
          className="btn-primary inline-flex items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
        >
          {boutiqueSlug ? "Mağazaya dön" : "Sepete dön"}
        </Link>
      </div>
    );
  }

  const updateField = (field: keyof TrCheckoutFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    if (!acceptedDistance || !acceptedKvkk) {
      setError("Sözleşmeleri onaylamanız gerekir.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (demoCart) {
        clearCart();
        const base = trOrderConfirmationPath(
          boutiqueSlug ? { boutique: boutiqueSlug } : undefined,
        );
        router.push(`${base}${base.includes("?") ? "&" : "?"}demo=1`);
        return;
      }

      const response = await fetch("/api/tr/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boutiqueSlug: boutiqueSlug ?? undefined,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone || undefined,
          shippingAddress: {
            line1: form.line1,
            line2: form.line2 || undefined,
            district: form.district,
            city: form.city,
            postalCode: form.postalCode,
            country: form.country || "TR",
          },
          items: items.map((item) => ({
            productId: item.productId,
            boutiqueId: item.boutiqueId,
            title: item.title,
            priceKurus: item.priceKurus,
            quantity: 1,
          })),
          acceptedDistanceSales: acceptedDistance,
          acceptedKvkk,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        orderId?: string;
        error?: string;
      };

      if (!response.ok || !data.orderId) {
        throw new Error(data.error ?? "Sipariş oluşturulamadı.");
      }

      clearCart();
      const confirm = trOrderConfirmationPath(
        boutiqueSlug ? { boutique: boutiqueSlug } : undefined,
      );
      router.push(
        `${confirm}${confirm.includes("?") ? "&" : "?"}order=${encodeURIComponent(data.orderId)}&sandbox=1`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Sipariş oluşturulamadı.",
      );
      setSubmitting(false);
    }
  };

  const legalSlug = boutiqueSlug ?? grouped[0]?.boutiqueSlug;

  return (
    <div className="px-5 py-8 md:px-10 md:py-10">
      <TrSandboxBanner
        className="mb-8"
        demo={demoCart || !isTrCheckoutEnabled()}
      />

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
                  onChange={(event) =>
                    updateField("customerName", event.target.value)
                  }
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
                  onChange={(event) =>
                    updateField("customerEmail", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className={labelClassName}>Telefon</span>
                <input
                  value={form.customerPhone}
                  onChange={(event) =>
                    updateField("customerPhone", event.target.value)
                  }
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
                    onChange={(event) =>
                      updateField("district", event.target.value)
                    }
                    className={`${inputClassName} mt-2`}
                  />
                </label>
                <label className="block">
                  <span className={labelClassName}>İl</span>
                  <input
                    required
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    className={`${inputClassName} mt-2`}
                  />
                </label>
              </div>
              <label className="block sm:max-w-xs">
                <span className={labelClassName}>Posta kodu</span>
                <input
                  required
                  value={form.postalCode}
                  onChange={(event) =>
                    updateField("postalCode", event.target.value)
                  }
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
            <div className="mt-5 space-y-3 text-[12px] leading-relaxed text-neutral-800">
              <label className="flex items-start gap-3">
                <input
                  required
                  type="checkbox"
                  className="mt-1"
                  checked={acceptedDistance}
                  onChange={(event) => setAcceptedDistance(event.target.checked)}
                />
                <span>
                  {legalSlug ? (
                    <>
                      <Link
                        href={trBoutiqueLegalPath(legalSlug, "mesafeli-satis")}
                        className="underline underline-offset-2"
                        target="_blank"
                      >
                        Mesafeli satış sözleşmesi
                      </Link>
                      {" ve "}
                      <Link
                        href={trBoutiqueLegalPath(legalSlug, "on-bilgilendirme")}
                        className="underline underline-offset-2"
                        target="_blank"
                      >
                        ön bilgilendirme formunu
                      </Link>{" "}
                      okudum, kabul ediyorum.
                    </>
                  ) : (
                    "Mesafeli satış sözleşmesi ve ön bilgilendirme formunu okudum, kabul ediyorum."
                  )}
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  required
                  type="checkbox"
                  className="mt-1"
                  checked={acceptedKvkk}
                  onChange={(event) => setAcceptedKvkk(event.target.checked)}
                />
                <span>
                  {legalSlug ? (
                    <>
                      <Link
                        href={trBoutiqueLegalPath(legalSlug, "kvkk")}
                        className="underline underline-offset-2"
                        target="_blank"
                      >
                        KVKK aydınlatma metnini
                      </Link>{" "}
                      okudum.
                    </>
                  ) : (
                    "KVKK aydınlatma metnini okudum."
                  )}
                </span>
              </label>
            </div>
          </section>

          {error ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          {canSubmit ? (
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex w-full items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em] disabled:opacity-60 sm:max-w-md"
            >
              {submitting
                ? "Tamamlanıyor…"
                : demoCart && !boutiqueCheckout
                  ? "Demo siparişi tamamla"
                  : "Siparişi tamamla (sandbox)"}
            </button>
          ) : (
            <button
              type="submit"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center border border-blueprint-border bg-neutral-100 px-6 py-4 text-[11px] tracking-[0.2em] text-meta uppercase sm:max-w-md"
            >
              Ödemeyi tamamla (yakında)
            </button>
          )}
        </form>

        <aside className="border border-blueprint-border bg-canvas-paper p-5 lg:sticky lg:top-24">
          <p className="text-meta text-[10px] tracking-[0.22em] uppercase">
            Sipariş özeti
          </p>
          <div className="mt-4 space-y-4">
            {grouped.map((group) => (
              <div key={group.boutiqueId}>
                <p className="text-meta text-[10px] tracking-[0.16em] uppercase">
                  {group.boutiqueName}
                </p>
                <ul className="mt-2 space-y-1 text-[12px] text-neutral-800">
                  {group.items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex justify-between gap-3"
                    >
                      <span className="truncate">{item.title}</span>
                      <span className="shrink-0 text-brand-primary">
                        {formatTryFromKurus(item.priceKurus)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-blueprint-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-meta text-[10px] tracking-[0.16em] uppercase">
                Toplam
              </span>
              <span className="font-serif text-xl text-brand-primary">
                {formatTryFromKurus(totalKurus)}
              </span>
            </div>
          </div>
          <Link
            href={
              boutiqueSlug ? trBoutiquePath(boutiqueSlug) : trCartPath()
            }
            className="text-meta mt-5 inline-block text-[10px] tracking-[0.22em] uppercase underline underline-offset-2"
          >
            ← {boutiqueSlug ? "Mağazaya dön" : "Sepete dön"}
          </Link>
        </aside>
      </div>
    </div>
  );
}

function TrCheckoutPageInner() {
  const searchParams = useSearchParams();
  const boutiqueSlug = searchParams.get("boutique")?.trim() || null;
  return <TrCheckoutForm boutiqueSlug={boutiqueSlug} />;
}

export function TrCheckoutPageContent() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-10 text-[13px] text-neutral-600 md:px-10">
          Ödeme yükleniyor…
        </div>
      }
    >
      <TrCheckoutPageInner />
    </Suspense>
  );
}
