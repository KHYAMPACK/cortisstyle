"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  TrTurkeyAddressFields,
  turkeyAddressClientError,
} from "@/components/tr/commerce/TrTurkeyAddressFields";
import {
  panelErrorClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelSuccessClass,
} from "@/components/tr/panel/panelUi";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";
import {
  cancelOwnerShipmentBarcode,
  fetchOwnerShipmentLabel,
  fulfillOwnerShipment,
  openOwnerShipmentLabel,
  OwnerShipmentStaleError,
  retryOwnerShipmentAddress,
} from "@/lib/tr/ownerClient";
import {
  buildAddressCorrectionWhatsAppMessage,
  buildWhatsAppOrderUrl,
} from "@/lib/tr/whatsapp";
import { boutiqueHasCarrierIntegration } from "@/lib/tr/shipping/registry";
import { tlLabel } from "@/lib/tr/shipping/shippingCopy";
import { AUTO_BUY_FEE_CAP_KURUS } from "@/lib/tr/shipping/types";
import {
  SHIPPING_BLOCK_ADDRESS_REJECTED,
  SHIPPING_BLOCK_INSUFFICIENT_BALANCE,
  SHIPPING_BLOCK_PROVIDER_ERROR,
  hasPurchasedShippingLabel,
} from "@/lib/tr/shipping/types";
import { formatTryFromKurus, type TrOrderWithItems } from "@/types/tr-marketplace";

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
  if (!status) return "Etiket bekleniyor";
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
  const live = boutiqueHasCarrierIntegration(boutiqueSlug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingPath, setTrackingPath] = useState<string | null>(null);
  const [whatsappConfirmed, setWhatsappConfirmed] = useState(false);
  const [draft, setDraft] = useState({
    city: order.shippingAddress.city,
    district: order.shippingAddress.district,
    line1: order.shippingAddress.line1,
    line2: order.shippingAddress.line2 ?? "",
    postalCode: order.shippingAddress.postalCode,
  });

  const paid =
    order.paymentStatus === "paid" ||
    order.paymentStatus === "sandbox" ||
    order.isSandbox;
  const cancelled = order.fulfillmentStatus === "cancelled";
  const shipment = order.shipment;
  const hasBarcode = hasPurchasedShippingLabel(shipment);
  const lastErrorLooksLikeBalance = (shipment.lastError ?? "")
    .toLocaleLowerCase("tr-TR")
    .includes("bakiye") ||
    (shipment.lastError ?? "").toLowerCase().includes("insufficient");
  const addressRejected =
    shipment.block === SHIPPING_BLOCK_ADDRESS_REJECTED &&
    !hasBarcode &&
    !lastErrorLooksLikeBalance;
  const retryUsed = shipment.addressRetryUsed;
  const insufficientBalance =
    !hasBarcode &&
    (shipment.block === SHIPPING_BLOCK_INSUFFICIENT_BALANCE ||
      lastErrorLooksLikeBalance);
  const providerError =
    shipment.block === SHIPPING_BLOCK_PROVIDER_ERROR && !hasBarcode;

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

  const fulfill = () =>
    void run(async () => {
      const result = await fulfillOwnerShipment(boutiqueId, order.id);
      onOrder(result.order);
      setTrackingPath(result.trackingPath ?? null);
      if (!hasPurchasedShippingLabel(result.order.shipment)) {
        throw new Error(
          result.order.shipment.lastError ?? "Etiket üretilemedi.",
        );
      }
    });

  const cancel = () =>
    void run(async () => {
      const result = await cancelOwnerShipmentBarcode(boutiqueId, order.id);
      onOrder(result.order);
    });

  const printLabel = () =>
    void run(async () => {
      try {
        const svg = await fetchOwnerShipmentLabel(boutiqueId, order.id);
        openOwnerShipmentLabel(svg);
      } catch (err) {
        if (err instanceof OwnerShipmentStaleError) {
          onOrder(err.order);
        }
        throw err;
      }
    });

  const saveAddressAndRetry = () => {
    const clientError = turkeyAddressClientError(draft);
    if (clientError) {
      setError(clientError);
      return;
    }
    void run(async () => {
      const result = await retryOwnerShipmentAddress(boutiqueId, order.id, {
        line1: draft.line1,
        line2: draft.line2.trim() || undefined,
        city: draft.city,
        district: draft.district,
        postalCode: draft.postalCode,
        country: "TR",
      });
      onOrder(result.order);
      setTrackingPath(result.trackingPath ?? null);
      setWhatsappConfirmed(false);
    });
  };

  const customerWhatsAppUrl = order.customerPhone
    ? buildWhatsAppOrderUrl(
        order.customerPhone,
        buildAddressCorrectionWhatsAppMessage(order),
      )
    : null;

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
        {shipment.feeKurus === 0
          ? `Alıcı kargo ödemedi (ücretsiz kargo). En uygun firma otomatik seçilir (en fazla ${tlLabel(AUTO_BUY_FEE_CAP_KURUS)}). Siz paketi hazırlayıp etiketi yazdırın. Adresi normalde değiştiremezsiniz.`
          : shipment.feeKurus != null
            ? `Alıcı ${formatTryFromKurus(shipment.feeKurus)} kargo ödedi; en uygun firma otomatik seçilir (en fazla ${tlLabel(AUTO_BUY_FEE_CAP_KURUS)}). Siz paketi hazırlayıp etiketi yazdırın. Adresi normalde değiştiremezsiniz.`
            : `Alıcı kargo ücreti siparişte kayıtlıdır; en uygun firma otomatik seçilir (en fazla ${tlLabel(AUTO_BUY_FEE_CAP_KURUS)}). Siz paketi hazırlayıp etiketi yazdırın. Adresi normalde değiştiremezsiniz.`}
      </p>

      {cancelled ? (
        <p className={panelHintClass}>İptal siparişte kargo oluşturulmaz.</p>
      ) : !paid ? (
        <p className={panelHintClass}>
          Tahsilatı “Ödendi” yapınca etiket otomatik üretilir.
        </p>
      ) : (
        <div className="space-y-4">
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
            {hasBarcode && shipment.barcode ? (
              <p className="font-mono text-[15px]">Barkod: {shipment.barcode}</p>
            ) : null}
            {shipment.trackingCode ? (
              <p className="font-mono text-[15px]">
                Takip no: {shipment.trackingCode}
              </p>
            ) : null}
            {shipment.feeKurus != null ? (
              <p>Alıcı ödedi: {formatTryFromKurus(shipment.feeKurus)}</p>
            ) : null}
            {shipment.lastError && !hasBarcode ? (
              <p className="text-[15px] text-neutral-600">
                Son kargo notu: {shipment.lastError}
              </p>
            ) : null}
          </div>

          {error ? <p className={panelErrorClass}>{error}</p> : null}

          {hasBarcode && !error ? (
            <motion.p
              key="label-created"
              role="status"
              className={panelSuccessClass}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={trPanelFadeTransition}
            >
              Etiket başarıyla oluşturuldu. Yazdırabilirsiniz.
            </motion.p>
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
                {busy ? "Açılıyor…" : "Etiket yazdır"}
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
          ) : addressRejected && retryUsed ? (
            <div className="space-y-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
              <p className="text-[17px] font-semibold text-amber-950">
                Adres bir kez düzeltildi; kargo yine reddetti
              </p>
              <p className={panelHintClass}>
                Tekrar deneme yok. Aşağıdan siparişi iptal edin. Kart iadesi
                henüz yok — müşteriye havale / WhatsApp ile iade siz
                aktarırsınız.
              </p>
            </div>
          ) : addressRejected ? (
            <div className="space-y-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
              <p className="text-[17px] font-semibold text-amber-950">
                Hiçbir kargo firması bu adresi kabul etmedi
              </p>
              <p className={panelHintClass}>
                Önce müşteriyle WhatsApp’tan konuşun. Adresi ancak o konuşmadan
                sonra bir kez düzeltebilirsiniz; kaydetmek kargoyu otomatik
                tekrar dener.
              </p>
              {customerWhatsAppUrl ? (
                <a
                  href={customerWhatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={panelPrimaryBtnClass}
                  style={{ backgroundColor: "var(--panel-accent-deep)" }}
                >
                  Müşteriyi WhatsApp’tan yaz
                </a>
              ) : (
                <p className={panelHintClass}>
                  Müşteri telefonu yok; paneldaki numarayı kontrol edin.
                </p>
              )}
              <label className="flex min-h-12 cursor-pointer items-start gap-3 text-[16px] text-neutral-800">
                <input
                  type="checkbox"
                  checked={whatsappConfirmed}
                  onChange={(event) =>
                    setWhatsappConfirmed(event.target.checked)
                  }
                  className="mt-1 h-5 w-5 shrink-0"
                />
                <span>Müşteriyle WhatsApp’tan konuştum, doğru adresi aldım.</span>
              </label>
              <AnimatePresence>
                {whatsappConfirmed ? (
                  <motion.div
                    key="address-edit"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={trPanelFadeTransition}
                    className="space-y-4"
                  >
                    <TrTurkeyAddressFields
                      city={draft.city}
                      district={draft.district}
                      line1={draft.line1}
                      line2={draft.line2}
                      postalCode={draft.postalCode}
                      fieldClassName={panelFieldClass}
                      labelClassName={panelLabelClass}
                      onChange={(patch) =>
                        setDraft((current) => ({ ...current, ...patch }))
                      }
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={saveAddressAndRetry}
                      className={panelPrimaryBtnClass}
                      style={{ backgroundColor: "var(--panel-accent-deep)" }}
                    >
                      {busy ? "Kargo deneniyor…" : "Adresi kaydet ve kargoyu dene"}
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : insufficientBalance || providerError ? (
            <div className="space-y-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
              <p className="text-[17px] font-semibold text-amber-950">
                {insufficientBalance
                  ? "Basit Kargo bakiyesi yetersiz"
                  : "Kargo etiketi üretilemedi"}
              </p>
              <p className={panelHintClass}>
                {shipment.lastError ??
                  (insufficientBalance
                    ? "Bakiyeyi yükleyip tekrar deneyin. Bu bir adres hatası değil."
                    : "Adres değiştirmeyin; önce kargo hesabını kontrol edin.")}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={fulfill}
                className={panelPrimaryBtnClass}
                style={{ backgroundColor: "var(--panel-accent-deep)" }}
              >
                {busy ? "Hazırlanıyor…" : "Etiket hazırla"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={fulfill}
              className={panelPrimaryBtnClass}
              style={{ backgroundColor: "var(--panel-accent-deep)" }}
            >
              {busy ? "Hazırlanıyor…" : "Etiket hazırla"}
            </button>
          )}

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
