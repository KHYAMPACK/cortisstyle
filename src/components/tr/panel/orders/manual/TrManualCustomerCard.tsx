"use client";

import { ChevronDown, MapPin, Plus, X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { TrCustomerAddressDrawer } from "@/components/tr/panel/customers/TrCustomerAddressDrawer";
import {
  panelErrorClass,
  panelFieldClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { withSingleDefault } from "@/lib/tr/customers/customerModel";
import { pickCustomers } from "@/lib/tr/orders/customerPick";
import { withPanelOrigin } from "@/lib/tr/panel/panelOrigin";
import { updateOwnerCustomer } from "@/lib/tr/panel/ownerClient";
import { trPanelCustomerPath } from "@/lib/tr/paths";
import type {
  TrBoutiqueCustomer,
  TrBoutiqueCustomerAddress,
} from "@/types/tr-marketplace";

function addressText(address: TrBoutiqueCustomerAddress): string {
  return [address.line1, address.line2, `${address.district}, ${address.city} ${address.postalCode}`]
    .filter((part) => part.trim())
    .join(" · ");
}

/** The search box: type a name, e-mail or phone, pick a customer — or add a new one. */
function CustomerSearch({
  customers,
  onPick,
  onNewCustomer,
}: {
  customers: readonly TrBoutiqueCustomer[] | null;
  onPick: (customer: TrBoutiqueCustomer) => void;
  onNewCustomer: () => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => (customers ? pickCustomers(customers, query) : []), [customers, query]);
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));

  function choose(customer: TrBoutiqueCustomer) {
    setOpen(false);
    setQuery("");
    onPick(customer);
  }

  return (
    <div
      className="relative max-w-md"
      onBlur={(event) => {
        // Closes when focus leaves the whole box, not when it moves to an option.
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(results.length - 1, index + 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(0, index - 1));
          } else if (event.key === "Enter" && open && results[activeIndex]) {
            event.preventDefault();
            choose(results[activeIndex]!);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Müşteri ara"
        aria-label="Müşteri ara"
        className={`${panelFieldClass} pr-9`}
      />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
        strokeWidth={1.75}
        aria-hidden
      />

      {open ? (
        <div className="tr-panel-enter absolute top-full left-0 z-20 mt-1.5 w-full rounded-lg border border-neutral-200 bg-white py-1.5 shadow-lg">
          <button
            type="button"
            onClick={onNewCustomer}
            className="flex min-h-10 w-full items-center gap-2 px-3 text-left text-[13.5px] font-medium text-[color:var(--panel-accent-deep)] hover:bg-[color:var(--panel-accent-soft)]"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Yeni müşteri ekle
          </button>
          <div className="my-1 border-t border-neutral-100" />
          {customers === null ? (
            <p className="px-3 py-3 text-[13px] text-neutral-500" role="status">
              Müşteriler yükleniyor…
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-neutral-500">
              {customers.length === 0 ? "Henüz müşteri yok." : "Aramanıza uyan müşteri yok."}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Müşteriler">
              {results.map((customer, index) => (
                <li key={customer.id} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    onClick={() => choose(customer)}
                    onMouseEnter={() => setActive(index)}
                    className={`block w-full px-3 py-2 text-left ${
                      index === activeIndex ? "bg-[color:var(--panel-accent-soft)]" : ""
                    }`}
                  >
                    <span className="block truncate text-[13.5px] font-medium text-neutral-900">
                      {customer.name}
                    </span>
                    <span className="block truncate text-[12px] text-neutral-500">
                      {customer.email}
                      {customer.phone ? ` · ${customer.phone}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The order's "Müşteri" card: search a customer, or send the owner to the new-customer
 * page; then choose which of the customer's saved addresses it goes to. A customer with
 * no address gets one here, saved onto the customer so the next order has it too.
 */
export function TrManualCustomerCard({
  boutiqueId,
  customers,
  customerId,
  addressId,
  selfPath,
  onSelectCustomer,
  onSelectAddress,
  onNewCustomer,
  onCustomerUpdated,
}: {
  boutiqueId: string;
  /** Null while they load. */
  customers: readonly TrBoutiqueCustomer[] | null;
  customerId: string | null;
  addressId: string | null;
  /** This page, so the customer's page can lead back here. */
  selfPath: string;
  onSelectCustomer: (customer: TrBoutiqueCustomer | null) => void;
  onSelectAddress: (addressId: string) => void;
  onNewCustomer: () => void;
  /** A customer changed (an address was added): replace it in the editor's list. */
  onCustomerUpdated: (customer: TrBoutiqueCustomer) => void;
}) {
  const customer = customerId ? (customers?.find((entry) => entry.id === customerId) ?? null) : null;
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Each open of the address drawer is a new session so it starts fresh.
  const [drawer, setDrawer] = useState({ session: 0, open: false });

  async function addAddress(address: TrBoutiqueCustomerAddress) {
    if (!customer) return;
    setError(null);
    setSaving(true);
    const others = address.isDefault
      ? customer.addresses.map((entry) => ({ ...entry, isDefault: false }))
      : customer.addresses;
    try {
      const updated = await updateOwnerCustomer(boutiqueId, customer.id, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? "",
        note: customer.note ?? "",
        addresses: withSingleDefault([...others, address]),
      });
      onCustomerUpdated(updated);
      onSelectAddress(address.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Adres kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {customerId && customers !== null && !customer ? (
        <p className={panelErrorClass} role="alert">
          Seçili müşteri bulunamadı (silinmiş olabilir). Yeniden seçin.
        </p>
      ) : null}

      {!customer ? (
        <CustomerSearch customers={customers} onPick={onSelectCustomer} onNewCustomer={onNewCustomer} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-4">
            <div className="min-w-0">
              <Link
                href={withPanelOrigin(trPanelCustomerPath(customer.id), selfPath)}
                className="block truncate text-[14.5px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline"
              >
                {customer.name}
              </Link>
              <p className="mt-0.5 truncate text-[13px] text-neutral-600">{customer.email}</p>
              {customer.phone ? (
                <p className="truncate text-[13px] text-neutral-600">{customer.phone}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onSelectCustomer(null)}
              aria-label="Müşteriyi değiştir"
              title="Müşteriyi değiştir"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-medium text-neutral-600">Teslimat adresi</p>
            {customer.addresses.length === 0 ? (
              <p className="rounded-lg bg-neutral-50 px-3 py-3 text-[13px] text-neutral-600">
                Bu müşterinin kayıtlı adresi yok. Sipariş için bir adres ekleyin.
              </p>
            ) : (
              <ul className="space-y-2" role="radiogroup" aria-label="Teslimat adresi">
                {customer.addresses.map((address) => {
                  const selected = address.id === addressId;
                  return (
                    <li key={address.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150 motion-reduce:transition-none ${
                          selected
                            ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-soft)]"
                            : "border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery-address"
                          checked={selected}
                          onChange={() => onSelectAddress(address.id)}
                          className="mt-1 h-4 w-4 accent-[color:var(--panel-accent)]"
                        />
                        <span className="min-w-0 text-[13px]">
                          <span className="flex items-center gap-2 font-semibold text-neutral-900">
                            <MapPin className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} aria-hidden />
                            {address.title}
                            {address.isDefault ? (
                              <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[color:var(--panel-accent-deep)]">
                                Varsayılan
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-neutral-700">{address.name}</span>
                          <span className="block text-neutral-500">{addressText(address)}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => setDrawer((state) => ({ session: state.session + 1, open: true }))}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[color:var(--panel-accent-deep)] hover:underline disabled:opacity-50"
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {saving ? "Kaydediliyor…" : "Adres Ekle"}
            </button>
          </div>
          {error ? <p className={panelErrorClass} role="alert">{error}</p> : null}

          <TrCustomerAddressDrawer
            key={drawer.session}
            open={drawer.open}
            initial={null}
            recipient={customer.name}
            isFirstAddress={customer.addresses.length === 0}
            onClose={() => setDrawer((state) => ({ ...state, open: false }))}
            onSubmit={(address) => void addAddress(address)}
          />
        </>
      )}
    </div>
  );
}
