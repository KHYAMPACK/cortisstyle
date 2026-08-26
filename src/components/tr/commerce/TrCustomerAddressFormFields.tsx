"use client";

import {
  TrTurkeyAddressFields,
  turkeyAddressClientError,
} from "@/components/tr/commerce/TrTurkeyAddressFields";
import {
  isValidCustomerPhone,
  normalizeCustomerPhone,
} from "@/lib/auth/customerProfileFields";
import { TR_CUSTOMER_ADDRESS_LABEL_MAX } from "@/lib/tr/commerce/customerAddressLimits";
import type { TrCustomerAddress, TrCustomerAddressInput } from "@/types/tr-marketplace";

const LABEL_PRESETS = ["Ev", "İş"] as const;

const inputClassName =
  "w-full border border-black/10 bg-white px-3 py-3 text-[13px] text-jet-black outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30";

const labelClassName = "text-[10px] tracking-[0.16em] text-neutral-500 uppercase";

export type TrCustomerAddressFormState = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  district: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
};

export function emptyCustomerAddressForm(defaults?: {
  recipientName?: string;
  phone?: string;
}): TrCustomerAddressFormState {
  return {
    label: "Ev",
    recipientName: defaults?.recipientName?.trim() ?? "",
    phone: defaults?.phone ? normalizeCustomerPhone(defaults.phone) : "",
    line1: "",
    line2: "",
    district: "",
    city: "",
    postalCode: "",
    isDefault: false,
  };
}

export function formFromCustomerAddress(
  address: TrCustomerAddress,
): TrCustomerAddressFormState {
  return {
    label: address.label,
    recipientName: address.recipientName,
    phone: normalizeCustomerPhone(address.phone),
    line1: address.line1,
    line2: address.line2 ?? "",
    district: address.district,
    city: address.city,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
}

export function customerAddressFormToInput(
  form: TrCustomerAddressFormState,
): TrCustomerAddressInput {
  return {
    label: form.label,
    recipientName: form.recipientName,
    phone: form.phone,
    line1: form.line1,
    line2: form.line2 || undefined,
    district: form.district,
    city: form.city,
    postalCode: form.postalCode,
    country: "TR",
    isDefault: form.isDefault,
  };
}

export function customerAddressFormClientError(
  form: TrCustomerAddressFormState,
): string | null {
  if (!form.label.trim()) return "Adres adı yazın (Ev, İş…).";
  if (form.recipientName.trim().length < 2) {
    return "Geçerli bir alıcı adı yazın.";
  }
  if (!isValidCustomerPhone(form.phone)) {
    return "Geçerli bir telefon numarası yazın.";
  }
  return turkeyAddressClientError(form);
}

export function TrCustomerAddressFormFields({
  form,
  onChange,
  showDefaultToggle = true,
}: {
  form: TrCustomerAddressFormState;
  onChange: (patch: Partial<TrCustomerAddressFormState>) => void;
  showDefaultToggle?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <span className={labelClassName}>Adres adı</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {LABEL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ label: preset })}
              className={`min-h-11 px-3 py-2 text-[11px] tracking-[0.14em] uppercase ${
                form.label.trim().toLocaleLowerCase("tr-TR") ===
                preset.toLocaleLowerCase("tr-TR")
                  ? "bg-neutral-950 text-white"
                  : "border border-black/15 text-neutral-700"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          value={form.label}
          onChange={(event) =>
            onChange({
              label: event.target.value.slice(0, TR_CUSTOMER_ADDRESS_LABEL_MAX),
            })
          }
          className={`${inputClassName} mt-2`}
          placeholder="Ev, İş, Annem…"
          maxLength={TR_CUSTOMER_ADDRESS_LABEL_MAX}
          autoComplete="off"
        />
      </div>

      <label className="block">
        <span className={labelClassName}>Alıcı adı soyad</span>
        <input
          required
          value={form.recipientName}
          onChange={(event) => onChange({ recipientName: event.target.value })}
          className={`${inputClassName} mt-2`}
          autoComplete="name"
        />
      </label>

      <label className="block sm:max-w-xs">
        <span className={labelClassName}>Telefon</span>
        <input
          required
          type="tel"
          value={form.phone}
          onChange={(event) =>
            onChange({ phone: normalizeCustomerPhone(event.target.value) })
          }
          className={`${inputClassName} mt-2`}
          autoComplete="tel"
          inputMode="numeric"
          placeholder="05XXXXXXXXX"
        />
      </label>

      <TrTurkeyAddressFields
        city={form.city}
        district={form.district}
        line1={form.line1}
        line2={form.line2}
        postalCode={form.postalCode}
        onChange={(patch) => onChange(patch)}
      />

      {showDefaultToggle ? (
        <label className="flex min-h-11 items-start gap-3 text-[13px] text-neutral-800">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.isDefault}
            onChange={(event) => onChange({ isDefault: event.target.checked })}
          />
          <span>Varsayılan teslimat adresi</span>
        </label>
      ) : null}
    </div>
  );
}
