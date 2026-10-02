"use client";

import { TrPanelBusyButton } from "@/components/tr/panel/TrPanelBusyButton";
import { motion } from "framer-motion";
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
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
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
import { tlLabel } from "@/lib/tr/shipping/shippingCopy";
import {
  AUTO_BUY_FEE_CAP_KURUS,
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

const noticeClass = "space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4";

/**
 * Carrier label and tracking for boutiques with a live carrier integration
 * (Basit Kargo). Sits inside the order's fulfilment card. Correcting a rejected
 * address is a form, so it opens in a drawer.
 */
export function TrOwnerShipmentSection({
  boutiqueId,
  order,
  onOrder,
}: {
  boutiqueId: string;
  order: TrOrderWithItems;
  onOrder: (order: TrOrderWithItems) => void;
}) {
  const [busy, setBusy] = useState(false);
  // Which carrier call is running, for that button's spinner.
  const [busyAction, setBusyAction] = useState<"fulfill" | "cancel" | "label" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackingPath, setTrackingPath] = useState<string | null>(null);
  const [whatsappConfirmed, setWhatsappConfirmed] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
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

  const addressDirty =
    draft.city !== order.shippingAddress.city ||
    draft.district !== order.shippingAddress.district ||
    draft.line1 !== order.shippingAddress.line1 ||
    draft.line2 !== (order.shippingAddress.line2 ?? "") ||
    draft.postalCode !== order.shippingAddress.postalCode;

  /** Runs a carrier call; returns whether it worked (failures land in `error`). */
  const run = async (
    fn: () => Promise<void>,
    action: "fulfill" | "cancel" | "label" | null = null,
  ): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    setBusyAction(action);
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kargo işlemi başarısız.");
      return false;
    } finally {
      setBusy(false);
      setBusyAction(null);
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
    }, "fulfill");

  const cancel = () =>
    void run(async () => {
      const result = await cancelOwnerShipmentBarcode(boutiqueId, order.id);
      onOrder(result.order);
    }, "cancel");

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
    }, "label");

  const openAddressDrawer = () => {
    // Every open starts from the address on the order, not from abandoned edits.
    setDraft({
      city: order.shippingAddress.city,
      district: order.shippingAddress.district,
      line1: order.shippingAddress.line1,
      line2: order.shippingAddress.line2 ?? "",
      postalCode: order.shippingAddress.postalCode,
    });
    setAddressError(null);
    setWhatsappConfirmed(false);
    setAddressOpen(true);
  };

  const saveAddressAndRetry = async () => {
    const clientError = turkeyAddressClientError(draft);
    if (clientError) {
      setAddressError(clientError);
      return;
    }
    setAddressError(null);
    const worked = await run(async () => {
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
    });
    // On a failure the drawer stays open and shows the reason (`error`).
    if (worked) setAddressOpen(false);
  };

  const customerWhatsAppUrl = order.customerPhone
    ? buildWhatsAppOrderUrl(
        order.customerPhone,
        buildAddressCorrectionWhatsAppMessage(order),
      )
    : null;

  return (
    <div className="space-y-4">
      <p className={panelHintClass}>
        {shipment.feeKurus === 0
          ? `Alıcı kargo ödemedi (ücretsiz kargo). En uygun firma otomatik seçilir (en fazla ${tlLabel(AUTO_BUY_FEE_CAP_KURUS)}). Siz paketi hazırlayıp etiketi yazdırın. Adresi normalde değiştiremezsiniz.`
          : shipment.feeKurus != null
            ? `Alıcı ${formatTryFromKurus(shipment.feeKurus)} kargo ödedi; en uygun firma otomatik seçilir (en fazla ${tlLabel(AUTO_BUY_FEE_CAP_KURUS)}). Siz paketi hazırlayıp etiketi yazdırın. Adresi normalde değiştiremezsiniz.`
            : `Alıcı kargo ücreti siparişte kayıtlıdır; en uygun firma otomatik seçilir (en fazla ${tlLabel(AUTO_BUY_FEE_CAP_KURUS)}). Siz paketi hazırlayıp etiketi yazdırın. Adresi normalde değiştiremezsiniz.`}
      </p>

      {!paid ? (
        <p className={panelHintClass}>
          Tahsilatı “Ödendi” yapınca etiket otomatik üretilir.
        </p>
      ) : (
        <div className="space-y-4">
          <dl className="grid gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Kargo durumu</dt>
              <dd className="font-medium text-neutral-900">
                {statusLabel(shipment.status)}
              </dd>
            </div>
            {shipment.carrierName ? (
              <div>
                <dt className="text-neutral-500">Kargo firması</dt>
                <dd className="font-medium text-neutral-900">
                  {shipment.carrierName}
                </dd>
              </div>
            ) : null}
            {hasBarcode && shipment.barcode ? (
              <div>
                <dt className="text-neutral-500">Barkod</dt>
                <dd className="font-mono font-medium text-neutral-900">
                  {shipment.barcode}
                </dd>
              </div>
            ) : null}
            {shipment.trackingCode ? (
              <div>
                <dt className="text-neutral-500">Takip numarası</dt>
                <dd className="font-mono font-medium text-neutral-900">
                  {shipment.trackingCode}
                </dd>
              </div>
            ) : null}
          </dl>
          {shipment.lastError && !hasBarcode ? (
            <p className="text-[13px] text-neutral-600">
              Son kargo notu: {shipment.lastError}
            </p>
          ) : null}

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
              <TrPanelBusyButton
                busy={busyAction === "label"}
                busyLabel="Açılıyor…"
                disabled={busy}
                onClick={printLabel}
                className={panelPrimaryBtnClass}
              >
                Etiket yazdır
              </TrPanelBusyButton>
              {shipment.status === "READY_TO_SHIP" ||
              shipment.status === "NEW" ? (
                <TrPanelBusyButton
                  busy={busyAction === "cancel"}
                  busyLabel="İptal ediliyor…"
                  disabled={busy}
                  onClick={cancel}
                  className={panelSecondaryBtnClass}
                >
                  Kargo kodunu iptal et
                </TrPanelBusyButton>
              ) : null}
            </div>
          ) : addressRejected && retryUsed ? (
            <div className={noticeClass}>
              <p className="text-[14.5px] font-semibold text-amber-950">
                Adres bir kez düzeltildi; kargo yine reddetti
              </p>
              <p className={panelHintClass}>
                Tekrar deneme yok. Siparişi sağ üstteki ⋯ menüsünden iptal
                edin. Kart iadesi henüz yok — müşteriye havale / WhatsApp ile
                iade siz aktarırsınız.
              </p>
            </div>
          ) : addressRejected ? (
            <div className={noticeClass}>
              <p className="text-[14.5px] font-semibold text-amber-950">
                Hiçbir kargo firması bu adresi kabul etmedi
              </p>
              <p className={panelHintClass}>
                Önce müşteriyle WhatsApp’tan konuşun. Adresi ancak o konuşmadan
                sonra bir kez düzeltebilirsiniz; kaydetmek kargoyu otomatik
                tekrar dener.
              </p>
              <button
                type="button"
                onClick={openAddressDrawer}
                disabled={busy}
                className={panelPrimaryBtnClass}
              >
                Adresi düzelt
              </button>
            </div>
          ) : insufficientBalance || providerError ? (
            <div className={noticeClass}>
              <p className="text-[14.5px] font-semibold text-amber-950">
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
              <TrPanelBusyButton
                busy={busyAction === "fulfill"}
                busyLabel="Hazırlanıyor…"
                disabled={busy}
                onClick={fulfill}
                className={panelPrimaryBtnClass}
              >
                Etiket hazırla
              </TrPanelBusyButton>
            </div>
          ) : (
            <TrPanelBusyButton
              busy={busyAction === "fulfill"}
              busyLabel="Hazırlanıyor…"
              disabled={busy}
              onClick={fulfill}
              className={panelPrimaryBtnClass}
            >
              Etiket hazırla
            </TrPanelBusyButton>
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

      <TrPanelDrawer
        open={addressOpen}
        onClose={() => setAddressOpen(false)}
        title="Teslimat adresini düzelt"
        dirty={addressDirty}
        saving={busy}
        saveDisabled={!whatsappConfirmed || !addressDirty}
        saveLabel="Adresi kaydet ve kargoyu dene"
        onSave={() => void saveAddressAndRetry()}
      >
        <div className="space-y-5">
          <p className={panelHintClass}>
            Adres yalnızca bir kez düzeltilebilir. Önce müşteriyle konuşun,
            doğru adresi aldığınızı işaretleyin.
          </p>
          {customerWhatsAppUrl ? (
            <a
              href={customerWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className={`${panelSecondaryBtnClass} w-full`}
            >
              Müşteriyi WhatsApp’tan yaz
            </a>
          ) : (
            <p className={panelHintClass}>
              Müşteri telefonu yok; müşteri kartındaki numarayı kontrol edin.
            </p>
          )}
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[14px] text-neutral-800">
            <input
              type="checkbox"
              checked={whatsappConfirmed}
              onChange={(event) => setWhatsappConfirmed(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0"
            />
            <span>Müşteriyle konuştum, doğru adresi aldım.</span>
          </label>
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
          {addressError ?? error ? (
            <p className={panelErrorClass}>{addressError ?? error}</p>
          ) : null}
        </div>
      </TrPanelDrawer>
    </div>
  );
}
