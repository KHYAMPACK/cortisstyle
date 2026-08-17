"use client";

import { useState } from "react";
import {
  panelChipClass,
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  buyOwnerShipmentLabel,
  cancelOwnerShipmentBarcode,
  createOwnerShipment,
  fetchOwnerShipmentLabel,
} from "@/lib/tr/ownerClient";
import { boutiqueHasLiveShipping } from "@/lib/tr/shipping/registry";
import { formatTryFromKurus, type TrOrderWithItems } from "@/types/tr-marketplace";
import type { TrShippingRate } from "@/lib/tr/shipping/types";

const STATUS_TR: Record<string, string> = {
  NEW: "Yeni",
  READY_TO_SHIP: "Gönderime hazır",
  SHIPPED: "Yolda",
  OUT_FOR_DELIVERY: "Dağıtımda",
  DELIVERED: "Teslim edildi",
  NEEDS_SUPPORT: "Destek gerekiyor",
  DELAYED: "Gecikmeli",
  RETURNING: "Geri dönüyor",
  RETURNED: "İade",
  LOST: "Kayıp",
};

function statusLabel(status: string | null): string {
  if (!status) return "Kayıt yok";
  return STATUS_TR[status] ?? status;
}

export function TrOwnerShipmentSection({
  boutiqueId,
  boutiqueSlug,
  order,
  onOrder,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  order: TrOrderWithItems;
  onOrder: (order: TrOrderWithItems) => void;
}) {
  const live = boutiqueHasLiveShipping(boutiqueSlug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<TrShippingRate[] | null>(null);
  const [trackingPath, setTrackingPath] = useState<string | null>(null);

  const paid =
    order.paymentStatus === "paid" ||
    order.paymentStatus === "sandbox" ||
    order.isSandbox;
  const cancelled = order.fulfillmentStatus === "cancelled";
  const shipment = order.shipment;
  const hasDraft = Boolean(shipment.externalId);
  const hasBarcode = Boolean(shipment.barcode);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kargo işlemi başarısız.");
    } finally {
      setBusy(false);
    }
  };

  const create = () =>
    void run(async () => {
      const result = await createOwnerShipment(boutiqueId, order.id);
      onOrder(result.order);
      setRates(result.rates ?? []);
      setTrackingPath(result.trackingPath ?? null);
    });

  const buy = (handlerCode: string) =>
    void run(async () => {
      const result = await buyOwnerShipmentLabel(
        boutiqueId,
        order.id,
        handlerCode,
      );
      onOrder(result.order);
      setRates(null);
      setTrackingPath(result.trackingPath ?? trackingPath);
    });

  const cancel = () =>
    void run(async () => {
      const result = await cancelOwnerShipmentBarcode(boutiqueId, order.id);
      onOrder(result.order);
      setRates([]);
    });

  const printLabel = () =>
    void run(async () => {
      const blob = await fetchOwnerShipmentLabel(boutiqueId, order.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });

  if (!live) {
    return (
      <section className="space-y-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[19px] font-semibold text-neutral-900">Kargo</p>
        <p className={panelHintClass}>
          Bu butik için kargo API’si yok. Kendi kargo panelinizden gönderi
          oluşturun; durumu aşağıdan güncelleyin.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[19px] font-semibold text-neutral-900">Kargo</p>
      <p className={panelHintClass}>
        Basit Kargo Lila hesabı. Ödeme onayından sonra kargo oluşturup firma
        seçin; etiket buradan basılır, durum otomatik güncellenir.
      </p>

      {cancelled ? (
        <p className={panelHintClass}>İptal siparişte kargo oluşturulmaz.</p>
      ) : !paid ? (
        <p className={panelHintClass}>
          Önce tahsilatı “Ödendi” yapın; sonra kargo kodu üretilir.
        </p>
      ) : (
        <div className="space-y-4">
          {hasDraft ? (
            <div className="space-y-1 text-[16px] text-neutral-800">
              <p>
                Durum:{" "}
                <span className="font-semibold">
                  {statusLabel(shipment.status)}
                </span>
              </p>
              {shipment.carrierName ? (
                <p>Firma: {shipment.carrierName}</p>
              ) : null}
              {shipment.barcode ? (
                <p className="font-mono text-[15px]">
                  Barkod: {shipment.barcode}
                </p>
              ) : null}
              {shipment.trackingCode ? (
                <p className="font-mono text-[15px]">
                  Takip no: {shipment.trackingCode}
                </p>
              ) : null}
              {shipment.feeKurus != null ? (
                <p>Ücret: {formatTryFromKurus(shipment.feeKurus)}</p>
              ) : null}
            </div>
          ) : null}

          {error ? <p className={panelErrorClass}>{error}</p> : null}

          {!hasDraft ? (
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className={panelPrimaryBtnClass}
              style={{ backgroundColor: "var(--panel-accent-deep)" }}
            >
              {busy ? "Oluşturuluyor…" : "Kargo oluştur"}
            </button>
          ) : null}

          {hasDraft && !hasBarcode ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => buy("ECONOMIC")}
                  className={panelChipClass(false)}
                >
                  En ucuz
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => buy("FAST")}
                  className={panelChipClass(false)}
                >
                  En hızlı
                </button>
                {!rates ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={create}
                    className={panelChipClass(false)}
                  >
                    Firmaları listele
                  </button>
                ) : null}
              </div>
              {rates && rates.length > 0 ? (
                <ul className="space-y-2">
                  {rates.map((rate) => (
                    <li key={rate.handlerCode}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => buy(rate.handlerCode)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[color:var(--panel-accent-border)] px-4 py-3 text-left text-[16px] disabled:opacity-50"
                      >
                        <span>
                          {rate.handlerName}
                          {rate.durationDays != null
                            ? ` · ~${rate.durationDays} gün`
                            : ""}
                        </span>
                        <span className="tabular-nums font-semibold">
                          {formatTryFromKurus(rate.feeKurus)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {hasBarcode ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={printLabel}
                className={panelPrimaryBtnClass}
                style={{ backgroundColor: "var(--panel-accent-deep)" }}
              >
                Etiket yazdır
              </button>
              {shipment.status === "READY_TO_SHIP" ||
              shipment.status === "NEW" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={cancel}
                  className={panelSecondaryBtnClass}
                >
                  Kargo kodunu iptal et
                </button>
              ) : null}
            </div>
          ) : null}

          {trackingPath ? (
            <p className={panelHintClass}>
              Müşteri takip:{" "}
              <a
                href={trackingPath}
                className="underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                takip sayfası
              </a>
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
