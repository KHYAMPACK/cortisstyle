"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrBoutiqueOrderDialogShell } from "@/components/tr/boutique/orders/TrBoutiqueOrderDialogShell";
import {
  DEMO_SHOPPER_LOOKUP_POSTAL_CODE,
  findDemoShopperOrder,
  type DemoShopperOrder,
} from "@/lib/tr/commerce/demoShopperOrders";
import { trBoutiqueLegalPath, trBoutiqueOrderDetailPath } from "@/lib/tr/paths";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";

const inputClass =
  "mt-1.5 w-full border border-black/20 bg-white px-3 py-3 text-left text-[14px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900";

export function TrBoutiqueFindOrderModal({
  open,
  onClose,
  boutiqueSlug,
  accent,
  orders,
}: {
  open: boolean;
  onClose: () => void;
  boutiqueSlug: string;
  accent: string;
  orders: DemoShopperOrder[];
}) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOrderNumber("");
    setPostalCode("");
    setError(null);
    setChecking(false);
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!orderNumber.trim() || !postalCode.trim()) {
      setError("Sipariş no ve posta kodunu girin.");
      return;
    }
    setChecking(true);
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    const match = findDemoShopperOrder(orders, { orderNumber, postalCode });
    setChecking(false);
    if (!match) {
      setError("Bu bilgilerle sipariş bulunamadı. Numara ve posta kodunu kontrol edin.");
      return;
    }
    onClose();
    router.push(trBoutiqueOrderDetailPath(boutiqueSlug, match.id));
  };

  return (
    <TrBoutiqueOrderDialogShell
      open={open}
      title="Sipariş durumu"
      onClose={onClose}
    >
      <p className="mt-3 text-center text-[13px] leading-relaxed text-neutral-600">
        Sipariş numaranızı ve teslimat posta kodunu girin.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="block text-[11px] font-medium tracking-[0.14em] text-neutral-800 uppercase">
          Sipariş no
          <input
            value={orderNumber}
            onChange={(event) => {
              setOrderNumber(event.target.value);
              setError(null);
            }}
            className={inputClass}
            placeholder="CS-DEM-2398"
            autoComplete="off"
          />
        </label>
        <label className="block text-[11px] font-medium tracking-[0.14em] text-neutral-800 uppercase">
          Posta kodu
          <input
            value={postalCode}
            onChange={(event) => {
              setPostalCode(event.target.value);
              setError(null);
            }}
            inputMode="numeric"
            className={inputClass}
            placeholder={DEMO_SHOPPER_LOOKUP_POSTAL_CODE}
            autoComplete="postal-code"
          />
        </label>
        {error ? (
          <p className="text-center text-[12px] leading-relaxed text-red-700">
            {error}
          </p>
        ) : (
          <p className="text-center text-[12px] leading-relaxed text-neutral-500">
            Demo: CS-DEM-2398 veya CS-DEM-2401 · {DEMO_SHOPPER_LOOKUP_POSTAL_CODE}
          </p>
        )}
        <button
          type="submit"
          disabled={checking}
          className="mt-2 w-full px-5 py-3.5 text-[11px] tracking-[0.18em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-70"
          style={{ backgroundColor: accent }}
        >
          {checking ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span
                aria-hidden
                className="h-3 w-3 animate-spin border border-white/40 border-t-white"
              />
              Kontrol ediliyor
            </span>
          ) : (
            "Durumu kontrol et"
          )}
        </button>
        <p className="text-center text-[12px] leading-relaxed text-neutral-500">
          İade için{" "}
          <TrBoutiquePendingLink
            href={trBoutiqueLegalPath(boutiqueSlug, "iade")}
            className="underline underline-offset-4"
          >
            iade politikasına
          </TrBoutiquePendingLink>{" "}
          bakın.
        </p>
      </form>
    </TrBoutiqueOrderDialogShell>
  );
}
