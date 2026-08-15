"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { TrBoutiqueOrderDialogShell } from "@/components/tr/boutique/orders/TrBoutiqueOrderDialogShell";
import {
  DEMO_CANCEL_REASONS,
  demoShopperOrderStatusLabel,
  type DemoShopperOrder,
} from "@/lib/tr/commerce/demoShopperOrders";
import { formatTryFromKurus } from "@/types/tr-marketplace";

const selectClass =
  "mt-1.5 w-full border border-black/20 bg-white px-3 py-3 text-left text-[14px] text-neutral-900 outline-none focus:border-neutral-900";

export function TrBoutiqueCancelOrderModal({
  open,
  onClose,
  order,
  accent,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  order: DemoShopperOrder;
  accent: string;
  onConfirm: (itemIds: string[]) => void;
}) {
  const eligible = useMemo(
    () => order.items.filter((item) => item.status !== "cancelled"),
    [order.items],
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(eligible.map((item) => item.id));
    setReason("");
    setError(null);
    setSaving(false);
  }, [eligible, open]);

  const allSelected =
    eligible.length > 0 && selected.length === eligible.length;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (selected.length === 0) {
      setError("İptal etmek için en az bir ürün seçin.");
      return;
    }
    if (!reason) {
      setError("İptal nedeni seçin.");
      return;
    }
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 280));
    onConfirm(selected);
    setSaving(false);
    onClose();
  };

  return (
    <TrBoutiqueOrderDialogShell
      open={open}
      title="Ürünleri iptal et"
      onClose={onClose}
      wide
    >
      <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
        {order.displayNumber} siparişinden iptal etmek istediğiniz ürünleri ve
        bir neden seçin. Demo iptal yalnızca bu tarayıcıda görünür.
      </p>
      <form onSubmit={handleSubmit} className="mt-6">
        <label className="flex min-h-11 items-center gap-3 text-[13px] text-neutral-800">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => {
              setSelected(allSelected ? [] : eligible.map((item) => item.id));
              setError(null);
            }}
            className="h-4 w-4"
            style={{ accentColor: accent }}
          />
          Tümünü seç
        </label>

        <ul className="mt-3 divide-y divide-black/10 border-y border-black/10">
          {eligible.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-11 cursor-pointer gap-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                  className="mt-1 h-4 w-4 shrink-0"
                  style={{ accentColor: accent }}
                />
                <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-neutral-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-neutral-950">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">
                    {formatTryFromKurus(item.unitPriceKurus)} · Durum:{" "}
                    {demoShopperOrderStatusLabel(item.status)}
                    {item.size ? ` · Beden ${item.size}` : ""}
                    {item.color ? ` · ${item.color}` : ""}
                  </p>
                </div>
              </label>
            </li>
          ))}
        </ul>

        <label className="mt-5 block text-[11px] font-medium tracking-[0.14em] text-neutral-800 uppercase">
          İptal nedeni
          <select
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(null);
            }}
            className={selectClass}
            required
          >
            <option value="">Bir neden seçin</option>
            {DEMO_CANCEL_REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p className="mt-3 text-center text-[12px] text-red-700">{error}</p>
        ) : (
          <p className="mt-3 text-center text-[12px] text-neutral-500">
            {selected.length} / {eligible.length} ürün iptal edilecek
          </p>
        )}

        <button
          type="submit"
          disabled={saving || selected.length === 0 || !reason}
          className="mt-5 w-full px-5 py-3.5 text-[11px] tracking-[0.18em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: accent }}
        >
          {saving ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span
                aria-hidden
                className="h-3 w-3 animate-spin border border-white/40 border-t-white"
              />
              İptal ediliyor
            </span>
          ) : (
            "Ürünleri iptal et"
          )}
        </button>
      </form>
    </TrBoutiqueOrderDialogShell>
  );
}
