"use client";

import {
  listTurkeyCities,
  listTurkeyDistricts,
  validateTurkeyPostalCode,
  validateTurkeyStreetLine,
} from "@/lib/tr/geo/turkeyAddress";

const inputClassName =
  "w-full border border-black/10 bg-white px-3 py-3 text-[13px] text-jet-black outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30";

const labelClassName = "text-[10px] tracking-[0.16em] text-neutral-500 uppercase";

const CITIES = listTurkeyCities();

export function TrTurkeyAddressFields({
  city,
  district,
  line1,
  line2,
  postalCode,
  onChange,
  autoFocusStreet,
}: {
  city: string;
  district: string;
  line1: string;
  line2: string;
  postalCode: string;
  onChange: (patch: {
    city?: string;
    district?: string;
    line1?: string;
    line2?: string;
    postalCode?: string;
  }) => void;
  autoFocusStreet?: boolean;
}) {
  const districts = city ? listTurkeyDistricts(city) : [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClassName}>İl</span>
          <select
            required
            value={city}
            onChange={(event) =>
              onChange({ city: event.target.value, district: "" })
            }
            className={`${inputClassName} mt-2`}
            autoComplete="address-level1"
          >
            <option value="">Seçin</option>
            {CITIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClassName}>İlçe</span>
          <select
            required
            value={district}
            disabled={!city}
            onChange={(event) => onChange({ district: event.target.value })}
            className={`${inputClassName} mt-2 disabled:bg-neutral-50`}
            autoComplete="address-level2"
          >
            <option value="">{city ? "Seçin" : "Önce il seçin"}</option>
            {districts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={labelClassName}>Mahalle, sokak, bina no</span>
        <input
          required
          value={line1}
          onChange={(event) => onChange({ line1: event.target.value })}
          className={`${inputClassName} mt-2`}
          autoComplete="address-line1"
          autoFocus={autoFocusStreet}
          placeholder="Örn. Gülistan Mah. 12. Sok. No:4 Daire:2"
        />
      </label>
      <label className="block">
        <span className={labelClassName}>Adres devamı (isteğe bağlı)</span>
        <input
          value={line2}
          onChange={(event) => onChange({ line2: event.target.value })}
          className={`${inputClassName} mt-2`}
          autoComplete="address-line2"
        />
      </label>
      <label className="block sm:max-w-xs">
        <span className={labelClassName}>Posta kodu</span>
        <input
          required
          value={postalCode}
          onChange={(event) =>
            onChange({
              postalCode: event.target.value.replace(/\D/g, "").slice(0, 5),
            })
          }
          className={`${inputClassName} mt-2`}
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder="20100"
        />
      </label>
    </div>
  );
}

export function turkeyAddressClientError(form: {
  city: string;
  district: string;
  line1: string;
  postalCode: string;
}): string | null {
  if (!form.city.trim() || !form.district.trim()) {
    return "İl ve ilçeyi listeden seçin.";
  }
  return (
    validateTurkeyStreetLine(form.line1) ??
    validateTurkeyPostalCode(form.postalCode)
  );
}
