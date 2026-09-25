"use client";

import { useState } from "react";
import {
  TrTurkeyAddressFields,
  turkeyAddressClientError,
} from "@/components/tr/commerce/TrTurkeyAddressFields";
import {
  panelErrorClass,
  panelFieldClass,
  panelLabelClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelDrawer } from "@/components/tr/panel/TrPanelDrawer";
import {
  CUSTOMER_LIMITS,
  newCustomerAddressId,
} from "@/lib/tr/customers/customerModel";
import type { TrBoutiqueCustomerAddress } from "@/types/tr-marketplace";

interface AddressForm {
  title: string;
  name: string;
  line1: string;
  line2: string;
  district: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

function formOf(
  initial: TrBoutiqueCustomerAddress | null,
  recipient: string,
  first: boolean,
): AddressForm {
  return {
    title: initial?.title ?? "",
    name: initial?.name ?? recipient,
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    district: initial?.district ?? "",
    city: initial?.city ?? "",
    postalCode: initial?.postalCode ?? "",
    isDefault: initial?.isDefault ?? first,
  };
}

/**
 * Add or edit one of a customer's addresses. It is a small form, so it opens in the
 * shared drawer; Kaydet puts the address on the customer form, which is saved
 * with the rest of the customer.
 *
 * Mount it with a new `key` each time it opens so it starts from `initial` again.
 */
export function TrCustomerAddressDrawer({
  open,
  initial,
  recipient,
  isFirstAddress,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** The address being edited, or null for a new one. */
  initial: TrBoutiqueCustomerAddress | null;
  /** The customer's name, offered as the recipient of a new address. */
  recipient: string;
  /** The customer has no address yet, so this one becomes the default. */
  isFirstAddress: boolean;
  onClose: () => void;
  onSubmit: (address: TrBoutiqueCustomerAddress) => void;
}) {
  const start = formOf(initial, recipient, isFirstAddress);
  const [form, setForm] = useState<AddressForm>(start);
  const [error, setError] = useState<string | null>(null);

  const dirty = (Object.keys(start) as Array<keyof AddressForm>).some(
    (key) => form[key] !== start[key],
  );

  // Editing after a rejected save clears the message, so it never outlives the fix.
  function change(patch: Partial<AddressForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  }

  function save() {
    const title = form.title.trim();
    if (!title) return setError("Adres başlığını yazın.");
    if (form.name.trim().length < CUSTOMER_LIMITS.nameMin) {
      return setError("Alıcının adını ve soyadını yazın.");
    }
    const addressError = turkeyAddressClientError(form);
    if (addressError) return setError(addressError);

    onSubmit({
      id: initial?.id ?? newCustomerAddressId(),
      title,
      name: form.name.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      district: form.district,
      city: form.city,
      postalCode: form.postalCode.trim(),
      country: "TR",
      isDefault: isFirstAddress || form.isDefault,
    });
    onClose();
  }

  return (
    <TrPanelDrawer
      open={open}
      onClose={onClose}
      title={initial ? "Adresi Düzenle" : "Adres Ekle"}
      dirty={dirty}
      saving={false}
      onSave={save}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="address-title" className={panelLabelClass}>
            Başlık <span className="text-[color:var(--panel-accent-deep)]">*</span>
          </label>
          <input
            id="address-title"
            value={form.title}
            maxLength={CUSTOMER_LIMITS.addressTitleMax}
            onChange={(event) => change({ title: event.target.value })}
            placeholder="Ev, İş, Teslimat adresi…"
            className={panelFieldClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address-name" className={panelLabelClass}>
            Alıcı Ad Soyad <span className="text-[color:var(--panel-accent-deep)]">*</span>
          </label>
          <input
            id="address-name"
            value={form.name}
            maxLength={CUSTOMER_LIMITS.nameMax}
            onChange={(event) => change({ name: event.target.value })}
            className={panelFieldClass}
          />
        </div>

        <TrTurkeyAddressFields
          city={form.city}
          district={form.district}
          line1={form.line1}
          line2={form.line2}
          postalCode={form.postalCode}
          fieldClassName={panelFieldClass}
          labelClassName={panelLabelClass}
          onChange={change}
        />

        {isFirstAddress ? null : (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[14px] text-neutral-800">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => change({ isDefault: event.target.checked })}
              className="h-5 w-5 shrink-0 accent-[color:var(--panel-accent)]"
            />
            Varsayılan adres yap
          </label>
        )}

        {error ? <p className={panelErrorClass}>{error}</p> : null}
      </div>
    </TrPanelDrawer>
  );
}
