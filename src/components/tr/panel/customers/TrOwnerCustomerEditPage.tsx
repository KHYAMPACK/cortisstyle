"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TrCustomerAddressDrawer } from "@/components/tr/panel/customers/TrCustomerAddressDrawer";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelDangerBtnClass,
  panelErrorClass,
  panelFieldClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import {
  TrPanelEditor,
  TrPanelEditorCard,
  TrPanelEditorSave,
} from "@/components/tr/panel/TrPanelEditor";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelPulse } from "@/components/tr/panel/TrPanelMotion";
import { withSingleDefault, CUSTOMER_LIMITS } from "@/lib/tr/customers/customerModel";
import {
  createOwnerCustomer,
  deleteOwnerCustomer,
  fetchOwnerCustomers,
  OwnerCustomerEmailTakenError,
  peekOwnerCustomers,
  updateOwnerCustomer,
  type OwnerCustomerPayload,
} from "@/lib/tr/panel/ownerClient";
import {
  trPanelCustomerPath,
  trPanelCustomersPath,
} from "@/lib/tr/paths";
import type {
  TrBoutiqueCustomer,
  TrBoutiqueCustomerAddress,
} from "@/types/tr-marketplace";

interface FormSnapshot {
  name: string;
  email: string;
  phone: string;
  note: string;
  addresses: TrBoutiqueCustomerAddress[];
}

function snapshotOf(customer: TrBoutiqueCustomer | null): FormSnapshot {
  return {
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    note: customer?.note ?? "",
    addresses: customer?.addresses ?? [],
  };
}

function addressLines(address: TrBoutiqueCustomerAddress): string {
  return [
    address.line1,
    address.line2,
    `${address.district}, ${address.city} ${address.postalCode}`,
  ]
    .filter((part) => part.trim())
    .join(" · ");
}

function CustomerForm({
  boutiqueId,
  initial,
}: {
  boutiqueId: string;
  /** The customer being edited, or null when creating one. */
  initial: TrBoutiqueCustomer | null;
}) {
  const router = useRouter();
  const [baseline, setBaseline] = useState<FormSnapshot>(() => snapshotOf(initial));
  const [name, setName] = useState(baseline.name);
  const [email, setEmail] = useState(baseline.email);
  const [phone, setPhone] = useState(baseline.phone);
  const [note, setNote] = useState(baseline.note);
  const [addresses, setAddresses] = useState(baseline.addresses);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takenBy, setTakenBy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Each open of the address drawer is a new session so it starts fresh.
  const [drawer, setDrawer] = useState<{
    session: number;
    open: boolean;
    editing: TrBoutiqueCustomerAddress | null;
  }>({ session: 0, open: false, editing: null });

  const current = useMemo<FormSnapshot>(
    () => ({ name, email, phone, note, addresses }),
    [name, email, phone, note, addresses],
  );
  const dirty = JSON.stringify(current) !== JSON.stringify(baseline);
  useUnsavedChangesGuard("customer-form", dirty);

  const editing = initial !== null;

  function touch() {
    setSaved(false);
    setError(null);
    setTakenBy(null);
  }

  function openDrawer(address: TrBoutiqueCustomerAddress | null) {
    setDrawer((state) => ({ session: state.session + 1, open: true, editing: address }));
  }

  function submitAddress(address: TrBoutiqueCustomerAddress) {
    touch();
    setAddresses((list) => {
      const exists = list.some((entry) => entry.id === address.id);
      const next = exists
        ? list.map((entry) => (entry.id === address.id ? address : entry))
        : [...list, address];
      // The address just saved keeps the default if it asked for it; otherwise the existing one stays.
      return withSingleDefault(
        address.isDefault
          ? next.map((entry) => ({ ...entry, isDefault: entry.id === address.id }))
          : next,
      );
    });
  }

  function removeAddress(id: string) {
    touch();
    setAddresses((list) => withSingleDefault(list.filter((entry) => entry.id !== id)));
  }

  function makeDefault(id: string) {
    touch();
    setAddresses((list) => list.map((entry) => ({ ...entry, isDefault: entry.id === id })));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    setTakenBy(null);
    const payload: OwnerCustomerPayload = { name, email, phone, note, addresses };
    try {
      const customer = initial
        ? await updateOwnerCustomer(boutiqueId, initial.id, payload)
        : await createOwnerCustomer(boutiqueId, payload);
      const next = snapshotOf(customer);
      setBaseline(next);
      setName(next.name);
      setEmail(next.email);
      setPhone(next.phone);
      setNote(next.note);
      setAddresses(next.addresses);
      setSaved(true);
      if (!initial) router.push(trPanelCustomerPath(customer.id));
    } catch (saveError) {
      if (saveError instanceof OwnerCustomerEmailTakenError) {
        setTakenBy(saveError.existingCustomerId);
      }
      setError(
        saveError instanceof Error ? saveError.message : "Müşteri kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteOwnerCustomer(boutiqueId, initial.id);
      // Nothing left to save: leave without the unsaved-changes prompt.
      setBaseline(current);
      router.push(trPanelCustomersPath());
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Müşteri silinemedi.",
      );
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  return (
    <TrPanelEditor
      backHref={initial ? trPanelCustomerPath(initial.id) : trPanelCustomersPath()}
      parentLabel={initial ? "Müşteri Detayı" : "Müşteriler"}
      title={editing ? "Müşteriyi Düzenle" : "Yeni Müşteri"}
      subject={name.trim() || null}
    >
      <TrPanelEditorSave
        dirty={dirty}
        saving={saving}
        saved={saved}
        requireDirty={editing}
        onSave={() => void save()}
      />

      <div className="space-y-4 pt-1">
        {error ? (
          <p className={panelErrorClass} role="alert">
            {error}
            {takenBy ? (
              <>
                {" "}
                <Link
                  href={trPanelCustomerPath(takenBy)}
                  className="font-semibold underline"
                >
                  Müşteriyi aç
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        <TrPanelEditorCard
          id="bilgiler"
          title="Müşteri Bilgileri"
          hint="E-posta müşteriyi tanımlar: aynı e-posta ile ikinci bir müşteri eklenemez."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="customer-name" className={panelLabelClass}>
                Ad Soyad <span className="text-[color:var(--panel-accent-deep)]">*</span>
              </label>
              <input
                id="customer-name"
                value={name}
                maxLength={CUSTOMER_LIMITS.nameMax}
                onChange={(event) => {
                  touch();
                  setName(event.target.value);
                }}
                className={panelFieldClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-email" className={panelLabelClass}>
                E-Posta <span className="text-[color:var(--panel-accent-deep)]">*</span>
              </label>
              <input
                id="customer-email"
                type="email"
                value={email}
                maxLength={CUSTOMER_LIMITS.emailMax}
                onChange={(event) => {
                  touch();
                  setEmail(event.target.value);
                }}
                placeholder="ornek@eposta.com"
                className={panelFieldClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="customer-phone" className={panelLabelClass}>
                Telefon Numarası
              </label>
              <input
                id="customer-phone"
                type="tel"
                value={phone}
                maxLength={CUSTOMER_LIMITS.phoneMax}
                onChange={(event) => {
                  touch();
                  setPhone(event.target.value);
                }}
                placeholder="+90 5xx xxx xx xx"
                className={panelFieldClass}
              />
            </div>
          </div>
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="adres"
          title="Adres"
          hint="Müşterinin kayıtlı adresleri; sipariş oluştururken teslimat adresi olarak seçilir."
        >
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-400">
                <MapPin className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-neutral-900">
                  Müşteriye ait henüz bir adres yok
                </p>
                <p className="mt-1 text-[13.5px] text-neutral-500">
                  Müşterinize ait birden fazla adres girebilirsiniz
                </p>
              </div>
              <button
                type="button"
                onClick={() => openDrawer(null)}
                className={panelPrimaryBtnClass}
              >
                Adres Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <ul className="space-y-3">
                {addresses.map((address) => (
                  <li
                    key={address.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-neutral-200 p-4"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
                        {address.title}
                        {address.isDefault ? (
                          <span className="rounded bg-[color:var(--panel-accent-soft)] px-1.5 py-0.5 text-[11.5px] font-semibold text-[color:var(--panel-accent-deep)]">
                            Varsayılan
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[13.5px] text-neutral-700">{address.name}</p>
                      <p className="text-[13px] text-neutral-500">{addressLines(address)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {address.isDefault ? null : (
                        <button
                          type="button"
                          onClick={() => makeDefault(address.id)}
                          className="rounded-md px-2 py-1.5 text-[12.5px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
                        >
                          Varsayılan yap
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openDrawer(address)}
                        aria-label={`${address.title} adresini düzenle`}
                        className="grid h-8 w-8 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAddress(address.id)}
                        aria-label={`${address.title} adresini sil`}
                        className="grid h-8 w-8 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {addresses.length < CUSTOMER_LIMITS.maxAddresses ? (
                <button
                  type="button"
                  onClick={() => openDrawer(null)}
                  className={`${panelSecondaryBtnClass} gap-2`}
                >
                  <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Adres Ekle
                </button>
              ) : null}
            </div>
          )}
        </TrPanelEditorCard>

        <TrPanelEditorCard
          id="not"
          title="Müşteri Notları"
          hint="Yalnızca siz görürsünüz; müşteriye gösterilmez."
        >
          <textarea
            value={note}
            maxLength={CUSTOMER_LIMITS.noteMax}
            rows={4}
            onChange={(event) => {
              touch();
              setNote(event.target.value);
            }}
            placeholder="Not ekleyin…"
            aria-label="Müşteri notu"
            className={`${panelFieldClass} resize-y`}
          />
        </TrPanelEditorCard>

        {editing ? (
          <TrPanelEditorCard id="sil" title="Müşteriyi sil" tone="danger">
            <p className="text-[13.5px] text-neutral-600">
              Müşteri kaydı silinir. Siparişleri silinmez; her sipariş kendi müşteri
              bilgisini taşır.
            </p>
            <TrPanelConfirmPopover
              open={confirmDelete}
              message="Bu müşteri silinsin mi? Siparişleri silinmez."
              confirmLabel="Evet, sil"
              cancelLabel="Vazgeç"
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => void remove()}
            >
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(true)}
                className={`${panelDangerBtnClass} gap-2`}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                {deleting ? "Siliniyor…" : "Müşteriyi sil"}
              </button>
            </TrPanelConfirmPopover>
          </TrPanelEditorCard>
        ) : null}
      </div>

      <TrCustomerAddressDrawer
        key={drawer.session}
        open={drawer.open}
        initial={drawer.editing}
        recipient={name.trim()}
        isFirstAddress={addresses.length === 0 && drawer.editing === null}
        onClose={() => setDrawer((state) => ({ ...state, open: false }))}
        onSubmit={submitAddress}
      />
    </TrPanelEditor>
  );
}

/** Create a customer, or edit one. Loads the customer first when editing. */
function CustomerEditLoader({
  boutiqueId,
  customerId,
}: {
  boutiqueId: string;
  customerId: string | null;
}) {
  const [loaded, setLoaded] = useState<TrBoutiqueCustomer | null>(
    () =>
      customerId
        ? (peekOwnerCustomers(boutiqueId)?.find((entry) => entry.id === customerId) ?? null)
        : null,
  );
  const [failure, setFailure] = useState<string | null>(null);

  // The list is cached; this only fetches when the customer is not in it yet.
  useEffect(() => {
    if (!customerId || loaded) return;
    let cancelled = false;
    fetchOwnerCustomers(boutiqueId).then(
      (list) => {
        if (cancelled) return;
        const found = list.find((entry) => entry.id === customerId);
        if (found) setLoaded(found);
        else setFailure("Müşteri bulunamadı.");
      },
      (loadError: unknown) => {
        if (!cancelled) {
          setFailure(
            loadError instanceof Error ? loadError.message : "Müşteri yüklenemedi.",
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, customerId, loaded]);

  if (customerId === null) return <CustomerForm boutiqueId={boutiqueId} initial={null} />;
  if (loaded) return <CustomerForm key={loaded.id} boutiqueId={boutiqueId} initial={loaded} />;

  return (
    <TrPanelEditor
      backHref={trPanelCustomersPath()}
      parentLabel="Müşteriler"
      title="Müşteriyi Düzenle"
    >
      {failure ? (
        <p className={`${panelErrorClass} mt-1`}>{failure}</p>
      ) : (
        <div className="space-y-4 pt-1" role="status" aria-label="Müşteri yükleniyor">
          <TrPanelPulse className="h-44 w-full" />
          <TrPanelPulse className="h-40 w-full" />
        </div>
      )}
    </TrPanelEditor>
  );
}

export function TrOwnerCustomerEditPage({
  customerId,
}: {
  customerId: string | null;
}) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <CustomerEditLoader
          key={`${activeBoutique.id}:${customerId ?? "new"}`}
          boutiqueId={activeBoutique.id}
          customerId={customerId}
        />
      )}
    </TrOwnerPanelGate>
  );
}
