"use client";

import { Pencil, X } from "lucide-react";
import { useState } from "react";
import {
  panelErrorClass,
  panelFieldClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelModal } from "@/components/tr/panel/TrPanelModal";
import {
  adjustmentDiscountKurus,
  MANUAL_ORDER_LIMITS,
  type ManualAdjustment,
  type ManualTotals,
} from "@/lib/tr/orders/manualOrder";
import { formatLiraInput, parseLiraInput } from "@/lib/tr/orders/moneyInput";
import { formatTryFromKurus } from "@/types/tr-marketplace";

const linkButtonClass =
  "text-left text-[13.5px] font-medium text-[color:var(--panel-accent-deep)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 text-[13.5px]">{children}</div>;
}

/**
 * Sipariş Özeti: subtotal, a price reduction ("Fiyat Azalt"), shipping ("Kargo Ekle")
 * and the total. Each of the two opens a small modal; once set, a line shows what was
 * entered with a pencil to change it.
 */
export function TrManualOrderSummary({
  totals,
  adjustment,
  shippingFeeKurus,
  canAdjust,
  onEditAdjustment,
  onEditShipping,
}: {
  totals: ManualTotals;
  adjustment: ManualAdjustment | null;
  shippingFeeKurus: number;
  /** A reduction needs something to reduce. */
  canAdjust: boolean;
  onEditAdjustment: () => void;
  onEditShipping: () => void;
}) {
  return (
    <section className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <h2 className="text-[16px] font-semibold text-neutral-900">Sipariş Özeti</h2>
      <div className="mt-4 space-y-3">
        <Row>
          <span className="text-neutral-600">Ara Toplam</span>
          <span className="tabular-nums text-neutral-900">
            {formatTryFromKurus(totals.subtotalKurus)}
          </span>
        </Row>

        {adjustment && totals.discountKurus > 0 ? (
          <Row>
            <button type="button" onClick={onEditAdjustment} className={`${linkButtonClass} inline-flex items-center gap-1.5`}>
              {adjustment.title || "İndirim"}
              {adjustment.kind === "percent" ? ` (%${String(adjustment.percent).replace(".", ",")})` : ""}
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            </button>
            <span className="tabular-nums text-neutral-900">
              −{formatTryFromKurus(totals.discountKurus)}
            </span>
          </Row>
        ) : (
          <button
            type="button"
            onClick={onEditAdjustment}
            disabled={!canAdjust}
            className={`${linkButtonClass} disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline`}
            title={canAdjust ? undefined : "Önce ürün ekleyin"}
          >
            Fiyat Azalt
          </button>
        )}

        <Row>
          {shippingFeeKurus > 0 ? (
            <button type="button" onClick={onEditShipping} className={`${linkButtonClass} inline-flex items-center gap-1.5`}>
              Kargo
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            </button>
          ) : (
            <button type="button" onClick={onEditShipping} className={linkButtonClass}>
              Kargo Ekle
            </button>
          )}
          <span className="tabular-nums text-neutral-900">
            {formatTryFromKurus(totals.shippingKurus)}
          </span>
        </Row>

        <div className="border-t border-neutral-200 pt-3">
          <Row>
            <span className="font-semibold text-neutral-900">Toplam</span>
            <span className="text-[1.05rem] font-semibold tabular-nums text-neutral-900">
              {formatTryFromKurus(totals.totalKurus)}
            </span>
          </Row>
        </div>
      </div>
    </section>
  );
}

type AdjustmentKind = "amount" | "percent";

function KindTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 flex-1 rounded-md px-3 text-[13px] font-semibold transition-colors duration-150 motion-reduce:transition-none ${
        active
          ? "bg-white text-neutral-900 shadow-sm"
          : "text-neutral-500 hover:text-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

/** "Fiyat Azalt": a reduction as an amount or a percentage, with an optional name. */
export function TrManualAdjustmentModal({
  open,
  onClose,
  adjustment,
  subtotalKurus,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  adjustment: ManualAdjustment | null;
  subtotalKurus: number;
  /** Null removes the reduction. */
  onSave: (next: ManualAdjustment | null) => void;
}) {
  return (
    <TrPanelModal open={open} onClose={onClose} title="Fiyat Azalt">
      <AdjustmentForm
        adjustment={adjustment}
        subtotalKurus={subtotalKurus}
        onClose={onClose}
        onSave={onSave}
      />
    </TrPanelModal>
  );
}

function AdjustmentForm({
  adjustment,
  subtotalKurus,
  onClose,
  onSave,
}: {
  adjustment: ManualAdjustment | null;
  subtotalKurus: number;
  onClose: () => void;
  onSave: (next: ManualAdjustment | null) => void;
}) {
  const [kind, setKind] = useState<AdjustmentKind>(adjustment?.kind ?? "amount");
  const [value, setValue] = useState(() =>
    !adjustment
      ? ""
      : adjustment.kind === "amount"
        ? formatLiraInput(adjustment.amountKurus)
        : String(adjustment.percent).replace(".", ","),
  );
  const [title, setTitle] = useState(adjustment?.title ?? "");
  const [error, setError] = useState<string | null>(null);

  function preview(): number | null {
    const next = read();
    return next ? adjustmentDiscountKurus(subtotalKurus, next) : null;
  }

  function read(): ManualAdjustment | null {
    const name = title.trim();
    if (kind === "amount") {
      const kurus = parseLiraInput(value);
      if (kurus === null || kurus <= 0) return null;
      return { kind: "amount", amountKurus: kurus, title: name };
    }
    const percent = Number(value.trim().replace(",", "."));
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return null;
    return { kind: "percent", percent, title: name };
  }

  function save() {
    const next = read();
    if (!next) {
      setError(
        kind === "amount"
          ? "Geçerli bir tutar girin."
          : "Yüzde 0’dan büyük, en fazla 100 olmalı.",
      );
      return;
    }
    if (next.kind === "amount" && next.amountKurus > subtotalKurus) {
      setError("İndirim, ara toplamdan büyük olamaz.");
      return;
    }
    onSave(next);
    onClose();
  }

  const reduced = preview();

  return (
    <div className="space-y-5 px-6 py-5">
      <div className="flex rounded-lg bg-neutral-100 p-1" role="group" aria-label="İndirim türü">
        <KindTab active={kind === "amount"} onClick={() => { setKind("amount"); setError(null); }}>
          Tutar (₺)
        </KindTab>
        <KindTab active={kind === "percent"} onClick={() => { setKind("percent"); setError(null); }}>
          Yüzde (%)
        </KindTab>
      </div>

      <div className="space-y-2">
        <label htmlFor="adjustment-value" className={panelLabelClass}>
          {kind === "amount" ? "İndirim tutarı" : "İndirim yüzdesi"}
        </label>
        <input
          id="adjustment-value"
          value={value}
          inputMode="decimal"
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder={kind === "amount" ? "0,00" : "10"}
          className={panelFieldClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="adjustment-title" className={panelLabelClass}>
          İndirim adı <span className="font-normal text-neutral-400">(isteğe bağlı)</span>
        </label>
        <input
          id="adjustment-title"
          value={title}
          maxLength={MANUAL_ORDER_LIMITS.adjustmentTitleMax}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Örn. Arkadaş indirimi"
          className={panelFieldClass}
        />
      </div>

      {reduced !== null && reduced > 0 ? (
        <p className="text-[13px] text-neutral-600">
          Ara toplamdan{" "}
          <span className="font-semibold tabular-nums text-neutral-900">
            {formatTryFromKurus(reduced)}
          </span>{" "}
          düşülür.
        </p>
      ) : null}
      {error ? <p className={panelErrorClass} role="alert">{error}</p> : null}

      <div className="flex items-center justify-between gap-3 pt-1">
        {adjustment ? (
          <button
            type="button"
            onClick={() => {
              onSave(null);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-red-600 hover:underline"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            İndirimi kaldır
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className={panelSecondaryBtnClass}>
            İptal Et
          </button>
          <button type="button" onClick={save} className={panelPrimaryBtnClass}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Kargo Ekle": what the customer pays for shipping. Zero or removing means none. */
export function TrManualShippingModal({
  open,
  onClose,
  shippingFeeKurus,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  shippingFeeKurus: number;
  onSave: (kurus: number) => void;
}) {
  return (
    <TrPanelModal open={open} onClose={onClose} title="Kargo Ekle">
      <ShippingForm shippingFeeKurus={shippingFeeKurus} onClose={onClose} onSave={onSave} />
    </TrPanelModal>
  );
}

function ShippingForm({
  shippingFeeKurus,
  onClose,
  onSave,
}: {
  shippingFeeKurus: number;
  onClose: () => void;
  onSave: (kurus: number) => void;
}) {
  const [value, setValue] = useState(shippingFeeKurus > 0 ? formatLiraInput(shippingFeeKurus) : "");
  const [error, setError] = useState<string | null>(null);

  function save() {
    const kurus = value.trim() === "" ? 0 : parseLiraInput(value);
    if (kurus === null) return setError("Geçerli bir tutar girin.");
    if (kurus > MANUAL_ORDER_LIMITS.shippingMaxKurus) {
      return setError("Kargo tutarı çok yüksek.");
    }
    onSave(kurus);
    onClose();
  }

  return (
    <div className="space-y-5 px-6 py-5">
      <div className="space-y-2">
        <label htmlFor="shipping-fee" className={panelLabelClass}>
          Kargo ücreti (₺)
        </label>
        <input
          id="shipping-fee"
          value={value}
          inputMode="decimal"
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder="0,00"
          className={panelFieldClass}
        />
        <p className="text-[12.5px] text-neutral-500">
          Müşterinin ödeyeceği kargo tutarı. Boş bırakırsanız kargo ücretsiz olur.
        </p>
      </div>
      {error ? <p className={panelErrorClass} role="alert">{error}</p> : null}
      <div className="flex items-center justify-between gap-3 pt-1">
        {shippingFeeKurus > 0 ? (
          <button
            type="button"
            onClick={() => {
              onSave(0);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-red-600 hover:underline"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Kargoyu kaldır
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className={panelSecondaryBtnClass}>
            İptal Et
          </button>
          <button type="button" onClick={save} className={panelPrimaryBtnClass}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
