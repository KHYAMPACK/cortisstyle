"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrSandboxBanner,
  cartHasDemoItems,
} from "@/components/tr/TrSandboxBanner";
import { useAuth } from "@/context/AuthContext";
import {
  loadSavedCheckoutProfile,
  saveCheckoutProfile,
} from "@/lib/tr/checkoutProfile";
import {
  clearBoutiqueCheckoutSelection,
  loadBoutiqueCheckoutSelection,
} from "@/lib/tr/checkoutSelection";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import {
  trBoutiqueCartPath,
  trBoutiqueLegalPath,
  trBoutiquePath,
  trCartPath,
  trOrderConfirmationPath,
} from "@/lib/tr/paths";
import { getTrUserFirstName } from "@/lib/tr/userDisplayName";
import { getTrBoutiqueLocalCartStore } from "@/store/trBoutiqueLocalCartStore";
import { useTrCartStore } from "@/store/trCartStore";
import {
  cartLineKey,
  cartTotalKurus,
  EMPTY_CHECKOUT_FORM,
  groupCartItemsByBoutique,
  type TrCartLineItem,
  type TrCheckoutFormData,
} from "@/types/tr-cart";
import { formatTryFromKurus } from "@/types/tr-marketplace";

const inputClassName =
  "w-full border border-black/10 bg-white px-3 py-3 text-[13px] text-jet-black outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30";

const labelClassName = "text-[10px] tracking-[0.16em] text-neutral-500 uppercase";

type CheckoutStep = "phone" | "identity" | "address" | "review";

function useCheckoutCart(boutiqueSlug: string | null): {
  items: TrCartLineItem[];
  allItems: TrCartLineItem[];
  clearCheckedOut: () => void;
  hydrated: boolean;
} {
  const globalItems = useTrCartStore((state) => state.items);
  const clearGlobal = useTrCartStore((state) => state.clearCart);
  const [localItems, setLocalItems] = useState<TrCartLineItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[] | null>(null);
  const [hydrated, setHydrated] = useState(!boutiqueSlug);

  useEffect(() => {
    if (!boutiqueSlug) {
      setHydrated(true);
      return;
    }

    const store = getTrBoutiqueLocalCartStore(boutiqueSlug);
    const sync = () => {
      setLocalItems(store.getState().items);
      setSelectedKeys(loadBoutiqueCheckoutSelection(boutiqueSlug));
    };
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
    const selected =
      selectedKeys && selectedKeys.length > 0
        ? localItems.filter((item) =>
            selectedKeys.includes(cartLineKey(item)),
          )
        : localItems;
    return {
      items: selected.length > 0 ? selected : localItems,
      allItems: localItems,
      clearCheckedOut: () => {
        const store = getTrBoutiqueLocalCartStore(boutiqueSlug);
        const keys = new Set(
          (selected.length > 0 ? selected : localItems).map((item) =>
            cartLineKey(item),
          ),
        );
        for (const item of store.getState().items) {
          if (keys.has(cartLineKey(item))) {
            store.getState().removeItem(item.productId, item.size);
          }
        }
        clearBoutiqueCheckoutSelection(boutiqueSlug);
      },
      hydrated,
    };
  }

  return {
    items: globalItems,
    allItems: globalItems,
    clearCheckedOut: clearGlobal,
    hydrated: true,
  };
}

function stepTitle(step: CheckoutStep): string {
  switch (step) {
    case "phone":
      return "Telefon";
    case "identity":
      return "İletişim";
    case "address":
      return "Adres";
    case "review":
      return "Onay";
  }
}

function TrCheckoutForm({ boutiqueSlug }: { boutiqueSlug: string | null }) {
  const router = useRouter();
  const { user } = useAuth();
  const { items, clearCheckedOut, hydrated } = useCheckoutCart(boutiqueSlug);
  const [form, setForm] = useState<TrCheckoutFormData>(EMPTY_CHECKOUT_FORM);
  const [step, setStep] = useState<CheckoutStep>("phone");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedDistance, setAcceptedDistance] = useState(false);
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [saveProfile, setSaveProfile] = useState(true);
  const [profileReady, setProfileReady] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  const profileScope = boutiqueSlug?.trim() || "marketplace";
  const authEmail = user?.email?.trim() || "";
  const authNameHint = getTrUserFirstName(user);
  const authName =
    authNameHint
      ? authNameHint
          .toLocaleLowerCase("tr-TR")
          .replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase("tr-TR"))
      : "";

  const needsIdentity =
    !form.customerName.trim() || !form.customerEmail.trim();

  const steps = useMemo(() => {
    const list: CheckoutStep[] = ["phone"];
    if (needsIdentity) list.push("identity");
    list.push("address", "review");
    return list;
  }, [needsIdentity]);

  useEffect(() => {
    const saved = loadSavedCheckoutProfile(profileScope);
    setForm((current) => {
      const next = { ...current, ...(saved ?? {}) };
      if (authEmail && !next.customerEmail.trim()) {
        next.customerEmail = authEmail;
      }
      if (authName && !next.customerName.trim()) {
        next.customerName = authName;
      }
      return next;
    });
    setProfileReady(true);
  }, [authEmail, authName, profileScope]);

  const grouped = groupCartItemsByBoutique(items);
  const totalKurus = cartTotalKurus(items);
  const demoCart = cartHasDemoItems(items);
  const boutiqueCheckout = Boolean(boutiqueSlug);
  const canSubmit =
    demoCart || boutiqueCheckout || isTrCheckoutEnabled();

  if (!hydrated || !profileReady) {
    return (
      <div className="px-5 py-10 text-[13px] text-neutral-600 md:px-10">
        <span className="inline-block h-3 w-24 animate-pulse bg-neutral-200" />
        <p className="mt-3">Ödeme hazırlanıyor…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6 px-5 py-10 md:px-10">
        <TrSandboxBanner demo={demoCart} />
        <p className="max-w-xl text-[12px] leading-relaxed text-neutral-600">
          Ödeme için önce sepetinize ürün ekleyin.
        </p>
        <Link
          href={boutiqueSlug ? trBoutiquePath(boutiqueSlug) : trCartPath()}
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

  const goNext = () => {
    setError(null);
    const index = steps.indexOf(step);
    const next = steps[index + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    setError(null);
    const index = steps.indexOf(step);
    const prev = steps[index - 1];
    if (prev) setStep(prev);
  };

  const validateCurrentStep = (): boolean => {
    if (step === "phone") {
      if (form.customerPhone.trim().length < 10) {
        setError("Geçerli bir telefon numarası girin.");
        return false;
      }
    }
    if (step === "identity") {
      if (!form.customerName.trim() || !form.customerEmail.trim()) {
        setError("Ad soyad ve e-posta gerekli.");
        return false;
      }
    }
    if (step === "address") {
      if (
        !form.line1.trim() ||
        !form.district.trim() ||
        !form.city.trim() ||
        !form.postalCode.trim()
      ) {
        setError("Adres alanlarını tamamlayın.");
        return false;
      }
    }
    return true;
  };

  const handleStepContinue = (event: FormEvent) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;
    goNext();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    if (!acceptedDistance || !acceptedKvkk) {
      setError("Sözleşmeleri onaylamanız gerekir.");
      return;
    }
    if (
      !form.customerPhone.trim() ||
      !form.customerName.trim() ||
      !form.customerEmail.trim() ||
      !form.line1.trim() ||
      !form.district.trim() ||
      !form.city.trim() ||
      !form.postalCode.trim()
    ) {
      setError("Eksik bilgi var — önceki adımları kontrol edin.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (saveProfile) {
        saveCheckoutProfile(profileScope, form);
      }

      if (demoCart) {
        clearCheckedOut();
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
            size: item.size,
            quantity: 1,
          })),
          discountCode: boutiqueSlug
            ? discountCode.trim() || undefined
            : undefined,
          acceptedDistanceSales: acceptedDistance,
          acceptedKvkk,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        orderId?: string;
        confirmToken?: string;
        sandbox?: boolean;
        error?: string;
      };

      if (!response.ok || !data.orderId) {
        throw new Error(data.error ?? "Sipariş oluşturulamadı.");
      }

      clearCheckedOut();
      const confirm = trOrderConfirmationPath(
        boutiqueSlug ? { boutique: boutiqueSlug } : undefined,
      );
      const token = data.confirmToken
        ? `&token=${encodeURIComponent(data.confirmToken)}`
        : "";
      router.push(
        `${confirm}${confirm.includes("?") ? "&" : "?"}order=${encodeURIComponent(data.orderId)}${
          data.sandbox ? "&sandbox=1" : ""
        }${token}`,
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
  const stepIndex = steps.indexOf(step);

  return (
    <div className="px-5 py-8 md:px-10 md:py-10">
      <TrSandboxBanner
        className="mb-8"
        demo={demoCart}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            {steps.map((id, index) => (
              <span
                key={id}
                className={`px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase ${
                  index === stepIndex
                    ? "bg-brand-primary text-white"
                    : index < stepIndex
                      ? "bg-brand-primary/15 text-brand-primary"
                      : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {index + 1} · {stepTitle(id)}
              </span>
            ))}
          </div>

          {user?.email ? (
            <p className="mb-4 text-[12px] text-neutral-600">
              Hesap: <span className="text-neutral-900">{user.email}</span>
              {form.customerName ? ` · ${form.customerName}` : ""}
            </p>
          ) : null}

          {step === "phone" ? (
            <form
              onSubmit={handleStepContinue}
              className="space-y-5 border border-black/10 bg-white p-5"
            >
              <h2 className="font-serif text-xl tracking-tight text-neutral-950">
                Telefon numaranız
              </h2>
              <p className="text-[13px] text-neutral-600">
                Sipariş ve kargo bilgilendirmesi için kullanacağız.
              </p>
              <label className="block">
                <span className={labelClassName}>Telefon</span>
                <input
                  required
                  value={form.customerPhone}
                  onChange={(event) =>
                    updateField("customerPhone", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="05xx xxx xx xx"
                  autoFocus
                />
              </label>
              {error ? (
                <p className="text-[13px] text-red-700">{error}</p>
              ) : null}
              <button
                type="submit"
                className="btn-primary inline-flex w-full items-center justify-center px-6 py-3.5 text-[11px] tracking-[0.18em] sm:max-w-xs"
              >
                Devam et
              </button>
            </form>
          ) : null}

          {step === "identity" ? (
            <form
              onSubmit={handleStepContinue}
              className="space-y-5 border border-black/10 bg-white p-5"
            >
              <h2 className="font-serif text-xl tracking-tight text-neutral-950">
                İletişim bilgileri
              </h2>
              <label className="block">
                <span className={labelClassName}>Ad soyad</span>
                <input
                  required
                  value={form.customerName}
                  onChange={(event) =>
                    updateField("customerName", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                  autoComplete="name"
                  autoFocus
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
              {error ? (
                <p className="text-[13px] text-red-700">{error}</p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="border border-black/15 px-5 py-3.5 text-[11px] tracking-[0.16em] uppercase"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  className="btn-primary inline-flex items-center justify-center px-6 py-3.5 text-[11px] tracking-[0.18em]"
                >
                  Devam et
                </button>
              </div>
            </form>
          ) : null}

          {step === "address" ? (
            <form
              onSubmit={handleStepContinue}
              className="space-y-5 border border-black/10 bg-white p-5"
            >
              <h2 className="font-serif text-xl tracking-tight text-neutral-950">
                Teslimat adresi
              </h2>
              <label className="block">
                <span className={labelClassName}>Adres</span>
                <input
                  required
                  value={form.line1}
                  onChange={(event) => updateField("line1", event.target.value)}
                  className={`${inputClassName} mt-2`}
                  autoComplete="address-line1"
                  autoFocus
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
              {error ? (
                <p className="text-[13px] text-red-700">{error}</p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="border border-black/15 px-5 py-3.5 text-[11px] tracking-[0.16em] uppercase"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  className="btn-primary inline-flex items-center justify-center px-6 py-3.5 text-[11px] tracking-[0.18em]"
                >
                  Devam et
                </button>
              </div>
            </form>
          ) : null}

          {step === "review" ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 border border-black/10 bg-white p-5"
            >
              <h2 className="font-serif text-xl tracking-tight text-neutral-950">
                Sipariş onayı
              </h2>

              <dl className="space-y-3 text-[13px] text-neutral-700">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Telefon</dt>
                  <dd>{form.customerPhone}</dd>
                </div>
                <label className="block">
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
                <div className="flex justify-between gap-4 pt-1">
                  <dt className="text-neutral-500">Adres</dt>
                  <dd className="text-right">
                    {form.line1}
                    {form.line2 ? `, ${form.line2}` : ""}
                    <br />
                    {form.district} / {form.city} {form.postalCode}
                  </dd>
                </div>
              </dl>

              {boutiqueSlug ? (
                <label className="block space-y-2">
                  <span className={labelClassName}>Kupon kodu (opsiyonel)</span>
                  <input
                    value={discountCode}
                    onChange={(event) => setDiscountCode(event.target.value)}
                    className={inputClassName}
                    placeholder="Örn. YAZ10"
                    autoComplete="off"
                  />
                </label>
              ) : null}

              <label className="flex items-start gap-3 border border-black/5 bg-neutral-50 px-3 py-3 text-[13px]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={saveProfile}
                  onChange={(event) => setSaveProfile(event.target.checked)}
                />
                <span>
                  Bu bilgileri sonraki siparişler için kaydet
                  <span className="mt-0.5 block text-[11px] text-neutral-500">
                    Yalnızca bu cihazda saklanır.
                  </span>
                </span>
              </label>

              <div className="space-y-3 text-[12px] leading-relaxed text-neutral-800">
                <label className="flex items-start gap-3">
                  <input
                    required
                    type="checkbox"
                    className="mt-1"
                    checked={acceptedDistance}
                    onChange={(event) =>
                      setAcceptedDistance(event.target.checked)
                    }
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
                          href={trBoutiqueLegalPath(
                            legalSlug,
                            "on-bilgilendirme",
                          )}
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

              {error ? (
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="border border-black/15 px-5 py-3.5 text-[11px] tracking-[0.16em] uppercase"
                >
                  Geri
                </button>
                {canSubmit ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary inline-flex min-w-[12rem] items-center justify-center px-6 py-3.5 text-[11px] tracking-[0.18em] disabled:opacity-60"
                  >
                    {submitting
                      ? "Tamamlanıyor…"
                      : demoCart && !boutiqueCheckout
                        ? "Demo siparişi tamamla"
                        : "Siparişi tamamla"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed border border-black/10 bg-neutral-100 px-6 py-3.5 text-[11px] tracking-[0.18em] text-neutral-400 uppercase"
                  >
                    Ödeme yakında
                  </button>
                )}
              </div>
            </form>
          ) : null}
        </div>

        <aside className="border border-black/10 bg-white p-5 lg:sticky lg:top-24">
          <p className="text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
            Sipariş özeti
          </p>
          <div className="mt-4 space-y-4">
            {grouped.map((group) => (
              <div key={group.boutiqueId}>
                {!boutiqueSlug ? (
                  <p className="text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                    {group.boutiqueName}
                  </p>
                ) : null}
                <ul className="mt-2 space-y-1 text-[12px] text-neutral-800">
                  {group.items.map((item) => (
                    <li
                      key={cartLineKey(item)}
                      className="flex justify-between gap-3"
                    >
                      <span className="truncate">
                        {item.title}
                        {item.size ? (
                          <span className="text-neutral-500">
                            {" "}
                            · {item.size}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-brand-primary">
                        {formatTryFromKurus(item.priceKurus)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-black/5 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-[0.16em] text-neutral-500 uppercase">
                Toplam
              </span>
              <span className="font-serif text-xl text-brand-primary">
                {formatTryFromKurus(totalKurus)}
              </span>
            </div>
          </div>
          <Link
            href={
              boutiqueSlug ? trBoutiqueCartPath(boutiqueSlug) : trCartPath()
            }
            className="mt-5 inline-block text-[10px] tracking-[0.22em] text-neutral-500 uppercase underline underline-offset-2"
          >
            ← Sepete dön
          </Link>
        </aside>
      </div>
    </div>
  );
}

function TrCheckoutPageInner({
  boutiqueSlug: boutiqueSlugProp = null,
}: {
  boutiqueSlug?: string | null;
}) {
  const searchParams = useSearchParams();
  const boutiqueSlug =
    boutiqueSlugProp?.trim() ||
    searchParams.get("boutique")?.trim() ||
    null;
  return <TrCheckoutForm boutiqueSlug={boutiqueSlug} />;
}

export function TrCheckoutPageContent({
  boutiqueSlug = null,
}: {
  boutiqueSlug?: string | null;
} = {}) {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-10 text-[13px] text-neutral-600 md:px-10">
          Ödeme yükleniyor…
        </div>
      }
    >
      <TrCheckoutPageInner boutiqueSlug={boutiqueSlug} />
    </Suspense>
  );
}
