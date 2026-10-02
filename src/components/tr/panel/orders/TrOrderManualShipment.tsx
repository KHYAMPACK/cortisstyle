"use client";

import { useState } from "react";
import {
  fulfillmentHintForBoutique,
} from "@/components/tr/panel/orderFulfillmentUi";
import {
  panelChipClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelBusyButton } from "@/components/tr/panel/TrPanelBusyButton";
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
import { toast } from "@/lib/tr/panel/toast";
import { saveOwnerManualShipment } from "@/lib/tr/ownerClient";
import {
  CARRIER_NAME_MAX,
  COMMON_CARRIERS,
  TRACKING_CODE_MAX,
} from "@/lib/tr/shipping/manualShipment";
import type {
  TrFulfillmentStatus,
  TrOrderWithItems,
} from "@/types/tr-marketplace";

/**
 * Shipping for boutiques that use their own carrier: no label to buy, so the
 * owner records who carries the parcel (and a tracking code if there is one) and
 * the order moves to Kargoda. Steps that need no details are one click.
 */
export function TrOrderManualShipment({
  boutiqueId,
  order,
  busy,
  onStatus,
  onOrder,
}: {
  boutiqueId: string;
  order: TrOrderWithItems;
  busy: boolean;
  onStatus: (next: TrFulfillmentStatus) => void;
  onOrder: (order: TrOrderWithItems) => void;
}) {
  const { shipment, fulfillmentStatus: status } = order;
  const savedCarrier = shipment.carrierName ?? "";
  const savedTracking = shipment.trackingCode ?? "";

  const [open, setOpen] = useState(false);
  // The status button last pressed, for its spinner while `busy`.
  const [requested, setRequested] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty =
    carrier.trim() !== savedCarrier.trim() ||
    tracking.trim() !== savedTracking.trim();

  function openDrawer() {
    setCarrier(savedCarrier);
    setTracking(savedTracking);
    setOpen(true);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const result = await saveOwnerManualShipment(boutiqueId, order.id, {
        carrierName: carrier,
        trackingCode: tracking,
      });
      onOrder(result.order);
      toast.success("Kargo bilgisi kaydedildi.");
      setOpen(false);
    } catch (saveError) {
      toast.error(saveError, "Kargo bilgisi kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  const hasShipmentInfo = Boolean(savedCarrier || savedTracking);

  return (
    <div className="space-y-4">
      {hasShipmentInfo ? (
        <dl className="grid gap-x-8 gap-y-1 text-[13.5px] sm:grid-cols-2">
          {savedCarrier ? (
            <div>
              <dt className="text-neutral-500">Kargo firması</dt>
              <dd className="font-medium text-neutral-900">{savedCarrier}</dd>
            </div>
          ) : null}
          {savedTracking ? (
            <div>
              <dt className="text-neutral-500">Takip numarası</dt>
              <dd className="font-mono font-medium text-neutral-900">
                {savedTracking}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <p className={panelHintClass}>
        {fulfillmentHintForBoutique(status, false)}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {status === "created" || status === "ready" ? (
          <>
            <button
              type="button"
              onClick={openDrawer}
              disabled={busy}
              className={panelPrimaryBtnClass}
            >
              Kargoya ver
            </button>
            {status === "created" ? (
              <TrPanelBusyButton
                busy={busy && requested === "ready"}
                busyLabel="Kaydediliyor…"
                onClick={() => {
                  setRequested("ready");
                  onStatus("ready");
                }}
                disabled={busy}
                className={panelSecondaryBtnClass}
              >
                Kargoya hazır
              </TrPanelBusyButton>
            ) : null}
          </>
        ) : null}
        {status === "shipped" ? (
          <>
            <TrPanelBusyButton
              busy={busy && requested === "delivered"}
              busyLabel="Kaydediliyor…"
              onClick={() => {
                setRequested("delivered");
                onStatus("delivered");
              }}
              disabled={busy}
              className={panelPrimaryBtnClass}
            >
              Teslim edildi
            </TrPanelBusyButton>
            <button
              type="button"
              onClick={openDrawer}
              disabled={busy}
              className={panelSecondaryBtnClass}
            >
              Kargo bilgisini düzenle
            </button>
          </>
        ) : null}
      </div>

      <TrPanelDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={status === "shipped" ? "Kargo bilgisini düzenle" : "Kargoya ver"}
        dirty={dirty}
        saving={saving}
        saveDisabled={!carrier.trim()}
        saveLabel={status === "shipped" ? "Kaydet" : "Kargoya ver"}
        onSave={() => void save()}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="manual-carrier" className={panelLabelClass}>
              Kargo firması
            </label>
            <input
              id="manual-carrier"
              value={carrier}
              maxLength={CARRIER_NAME_MAX}
              onChange={(event) => setCarrier(event.target.value)}
              placeholder="Örn. Yurtiçi Kargo"
              className={panelFieldClass}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {COMMON_CARRIERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCarrier(name)}
                  className={panelChipClass(carrier.trim() === name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="manual-tracking" className={panelLabelClass}>
              Takip numarası{" "}
              <span className="font-normal text-neutral-400">(isteğe bağlı)</span>
            </label>
            <input
              id="manual-tracking"
              value={tracking}
              maxLength={TRACKING_CODE_MAX}
              onChange={(event) => setTracking(event.target.value)}
              className={`${panelFieldClass} font-mono`}
            />
            <p className={panelHintClass}>
              Kaydedince sipariş “Kargoda” olur.
            </p>
          </div>

        </div>
      </TrPanelDrawer>
    </div>
  );
}
