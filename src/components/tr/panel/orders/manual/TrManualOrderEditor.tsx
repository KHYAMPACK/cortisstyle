"use client";

import { Ellipsis, MessageCircle, PackageOpen, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TrManualCustomerCard } from "@/components/tr/panel/orders/manual/TrManualCustomerCard";
import {
  TrManualOrderLines,
  manualLineProblem,
  type ManualLineRow,
} from "@/components/tr/panel/orders/manual/TrManualOrderLines";
import {
  TrManualAdjustmentModal,
  TrManualOrderSummary,
  TrManualShippingModal,
} from "@/components/tr/panel/orders/manual/TrManualOrderSummary";
import { TrManualProductPicker } from "@/components/tr/panel/orders/manual/TrManualProductPicker";
import {
  saveManualOrderStash,
  takeManualOrderStash,
} from "@/components/tr/panel/orders/manual/manualOrderStash";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { toast } from "@/lib/tr/panel/toast";
import {
  panelCardShellClass,
  panelErrorClass,
  panelFieldClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import {
  TrPanelEditor,
  TrPanelEditorActions,
  TrPanelEditorSave,
  TrPanelInfoTip,
} from "@/components/tr/panel/TrPanelEditor";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import { TrPanelPulse } from "@/components/tr/panel/TrPanelMotion";
import {
  usePanelBackTarget,
  usePanelSelfPath,
} from "@/components/tr/panel/usePanelOrigin";
import { preferredAddressId } from "@/lib/tr/orders/customerPick";
import {
  computeManualTotals,
  EMPTY_MANUAL_ORDER,
  isManualOrderBlank,
  manualLineKey,
  manualOrderReadyError,
  MANUAL_ORDER_LIMITS,
  mergeManualLines,
  sameManualOrder,
  type ManualLine,
  type ManualOrderDraft,
} from "@/lib/tr/orders/manualOrder";
import {
  NEW_CUSTOMER_PARAM,
  withoutNewCustomer,
} from "@/lib/tr/orders/orderEditorReturn";
import { orderDraftReference, type TrOrderDraft } from "@/lib/tr/orders/orderDraft";
import {
  sellableUnitsOfCatalog,
  type SellableUnit,
} from "@/lib/tr/orders/sellableUnits";
import { withPanelOrigin } from "@/lib/tr/panel/panelOrigin";
import {
  createOwnerOrder,
  createOwnerOrderDraft,
  deleteOwnerOrderDraft,
  fetchOwnerCustomers,
  fetchOwnerProducts,
  fetchOwnerProductVariants,
  peekOwnerCustomers,
  peekOwnerProducts,
  peekOwnerProductVariants,
  updateOwnerOrderDraft,
  type OwnerProductVariants,
} from "@/lib/tr/panel/ownerClient";
import {
  trPanelDraftPath,
  trPanelDraftsPath,
  trPanelNewCustomerPath,
  trPanelOrderPath,
} from "@/lib/tr/paths";
import type { TrBoutiqueCustomer, TrProduct } from "@/types/tr-marketplace";

const EMPTY_VARIANTS: OwnerProductVariants = { variants: {}, labels: {} };

function CardShell({
  title,
  hint,
  aside,
  icon,
  children,
}: {
  title: string;
  hint?: string;
  aside?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={panelCardShellClass}>
      <header className="flex items-center gap-2 border-b border-neutral-200/80 px-4 py-3.5 sm:px-6 sm:py-4">
        {icon}
        <h2 className="text-[16px] font-semibold text-neutral-900 sm:text-[17px]">{title}</h2>
        {aside}
        {hint ? <TrPanelInfoTip text={hint} /> : null}
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function EmptyLines() {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]">
        <PackageOpen className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-neutral-900">Siparişleriniz burada gösterilecek</p>
      <p className="mt-1 max-w-xs text-[13.5px] text-neutral-500">
        Müşterilerden sipariş almak ve ödeme kabul etmek için bu alanı kullanabilirsiniz
      </p>
    </div>
  );
}

/**
 * The order editor: builds an order by hand (Sipariş Oluştur) and is also a draft's
 * editor. "Taslak olarak kaydet" keeps it as a draft; the ⋮ menu creates the order
 * (Kaydet ve Oluştur) or deletes the draft. Nothing is saved until one of those.
 */
export function TrManualOrderEditor({
  boutique,
  draft,
}: {
  boutique: { id: string; name: string };
  /** The draft being edited; null for a new order. */
  draft: TrOrderDraft | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selfPath = usePanelSelfPath();
  const back = usePanelBackTarget({ href: trPanelDraftsPath(), label: "Taslaklar" });

  // What was saved (a draft's order, or nothing) and what is on screen: a customer
  // detour may have left a newer, unsaved version in this tab.
  const [saved, setSaved] = useState<ManualOrderDraft>(draft?.order ?? EMPTY_MANUAL_ORDER);
  const [draftId, setDraftId] = useState<string | null>(draft?.id ?? null);
  const [order, setOrder] = useState<ManualOrderDraft>(
    () => takeManualOrderStash(pathname, boutique.id) ?? draft?.order ?? EMPTY_MANUAL_ORDER,
  );

  const [products, setProducts] = useState<TrProduct[] | null>(
    () => peekOwnerProducts(boutique.id)?.products ?? null,
  );
  const [variantData, setVariantData] = useState<OwnerProductVariants | null>(
    () => peekOwnerProductVariants(boutique.id) ?? null,
  );
  const [customers, setCustomers] = useState<TrBoutiqueCustomer[] | null>(
    () => peekOwnerCustomers(boutique.id) ?? null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [picker, setPicker] = useState({ session: 0, open: false, query: "" });
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [busy, setBusy] = useState<"draft" | "create" | "delete" | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [appliedNewCustomer, setAppliedNewCustomer] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerProducts(boutique.id).then(
      (result) => {
        if (!cancelled) setProducts(result.products);
      },
      (loadFailure: unknown) => {
        if (!cancelled) {
          setLoadError(loadFailure instanceof Error ? loadFailure.message : "Ürünler yüklenemedi.");
        }
      },
    );
    // Variants only matter for Gelişmiş products; if they can't be read the rest still works.
    fetchOwnerProductVariants(boutique.id).then(
      (result) => {
        if (!cancelled) setVariantData(result);
      },
      () => {
        if (!cancelled) setVariantData(EMPTY_VARIANTS);
      },
    );
    fetchOwnerCustomers(boutique.id).then(
      (result) => {
        if (!cancelled) setCustomers(result);
      },
      (loadFailure: unknown) => {
        if (!cancelled) {
          setLoadError(loadFailure instanceof Error ? loadFailure.message : "Müşteriler yüklenemedi.");
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [boutique.id]);

  // A customer just added on the new-customer page comes back as ?musteri=<id>.
  const returnedCustomerId = searchParams.get(NEW_CUSTOMER_PARAM);
  if (returnedCustomerId && customers && appliedNewCustomer !== returnedCustomerId) {
    setAppliedNewCustomer(returnedCustomerId);
    const found = customers.find((entry) => entry.id === returnedCustomerId);
    if (found) {
      setOrder((current) => ({
        ...current,
        customerId: found.id,
        addressId: preferredAddressId(found.addresses),
      }));
    }
  }
  useEffect(() => {
    if (appliedNewCustomer) router.replace(withoutNewCustomer(selfPath));
    // Once per returned customer; selfPath still carries the param at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedNewCustomer]);

  const dirty = !sameManualOrder(order, saved);
  useUnsavedChangesGuard("manual-order", dirty);

  const catalogReady = products !== null && variantData !== null;
  const units = useMemo<SellableUnit[]>(() => {
    if (!products || !variantData) return [];
    return sellableUnitsOfCatalog(
      products,
      new Map(Object.entries(variantData.variants)),
      (valueId) => variantData.labels[valueId] ?? "?",
    );
  }, [products, variantData]);
  const unitByKey = useMemo(() => new Map(units.map((unit) => [unit.key, unit])), [units]);

  const rows = useMemo<ManualLineRow[]>(
    () =>
      order.lines.map((line) => {
        const unit = unitByKey.get(manualLineKey(line)) ?? null;
        const title =
          unit?.title ??
          products?.find((product) => product.id === line.productId)?.title ??
          "Silinmiş ürün";
        return { line, unit, title };
      }),
    [order.lines, unitByKey, products],
  );

  const totals = useMemo(
    () =>
      computeManualTotals({
        lines: rows.flatMap((row) =>
          row.unit ? [{ priceKurus: row.unit.priceKurus, quantity: row.line.quantity }] : [],
        ),
        adjustment: order.adjustment,
        shippingFeeKurus: order.shippingFeeKurus,
      }),
    [rows, order.adjustment, order.shippingFeeKurus],
  );

  const customer = order.customerId
    ? (customers?.find((entry) => entry.id === order.customerId) ?? null)
    : null;

  /** Why "Kaydet ve Oluştur" can't go ahead yet, or null. */
  function createProblem(): string | null {
    const missing = manualOrderReadyError(order);
    if (missing) return missing;
    if (!catalogReady || customers === null) return "Ürün ve müşteri bilgileri yükleniyor.";
    const rowProblem = rows.map(manualLineProblem).find(Boolean);
    if (rowProblem) return rowProblem;
    if (!customer) return "Seçili müşteri bulunamadı. Yeniden seçin.";
    if (!customer.addresses.some((address) => address.id === order.addressId)) {
      return "Teslimat adresi seçin.";
    }
    return null;
  }

  function change(patch: Partial<ManualOrderDraft>) {
    setOrder((current) => ({ ...current, ...patch }));
    setSavedFlag(false);
  }

  function addUnits(added: SellableUnit[]) {
    change({
      lines: mergeManualLines([
        ...order.lines,
        ...added.map((unit) => ({
          productId: unit.productId,
          size: unit.size,
          variantId: unit.variantId,
          quantity: 1,
        })),
      ]),
    });
  }

  function setQuantity(line: ManualLine, quantity: number) {
    const key = manualLineKey(line);
    change({
      lines: order.lines.map((entry) =>
        manualLineKey(entry) === key ? { ...entry, quantity } : entry,
      ),
    });
  }

  function removeLine(line: ManualLine) {
    const key = manualLineKey(line);
    change({ lines: order.lines.filter((entry) => manualLineKey(entry) !== key) });
  }

  function selectCustomer(next: TrBoutiqueCustomer | null) {
    change({
      customerId: next?.id ?? null,
      addressId: next ? preferredAddressId(next.addresses) : null,
    });
  }

  function newCustomer() {
    // The page is left for the customer form; keep what is on screen for the way back.
    saveManualOrderStash({ pathname, boutiqueId: boutique.id, order });
    router.push(withPanelOrigin(trPanelNewCustomerPath(), withoutNewCustomer(selfPath)));
  }

  function openPicker(query: string) {
    setPicker((state) => ({ session: state.session + 1, open: true, query }));
  }

  async function saveDraft() {
    if (busy) return;
    if (isManualOrderBlank(order)) {
      toast.error("Taslağa kaydetmek için ürün veya müşteri ekleyin.");
      return;
    }
    setBusy("draft");
    try {
      const result = draftId
        ? await updateOwnerOrderDraft(boutique.id, draftId, order)
        : await createOwnerOrderDraft(boutique.id, order);
      setSaved(order);
      setSavedFlag(true);
      toast.success("Taslak kaydedildi.");
      if (!draftId) {
        setDraftId(result.id);
        // This becomes the draft's own page; the way back stays where it was.
        const from = searchParams.get("from");
        router.replace(
          from ? withPanelOrigin(trPanelDraftPath(result.id), from) : trPanelDraftPath(result.id),
        );
      }
    } catch (saveError) {
      toast.error(saveError, "Taslak kaydedilemedi.");
    } finally {
      setBusy(null);
    }
  }

  async function createOrder() {
    if (busy) return;
    const problem = createProblem();
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy("create");
    try {
      const created = await createOwnerOrder(boutique.id, order, draftId);
      // The order exists; nothing is left unsaved.
      setSaved(order);
      toast.success("Sipariş oluşturuldu.");
      router.push(trPanelOrderPath(created.id));
    } catch (createFailure) {
      toast.error(createFailure, "Sipariş oluşturulamadı.");
      setBusy(null);
    }
  }

  async function deleteDraft() {
    if (busy || !draftId) return;
    setBusy("delete");
    try {
      await deleteOwnerOrderDraft(boutique.id, draftId);
      setSaved(order);
      toast.success("Taslak silindi.");
      router.push(trPanelDraftsPath());
    } catch (deleteFailure) {
      toast.error(deleteFailure, "Taslak silinemedi.");
      setBusy(null);
    }
  }

  const addedKeys = useMemo(() => new Set(order.lines.map(manualLineKey)), [order.lines]);
  const lineCount = order.lines.length;

  return (
    <TrPanelEditor
      backHref={back.href}
      parentLabel={back.label}
      title={draftId ? "Taslak Sipariş" : "Yeni Sipariş Ekle"}
      subject={draftId ? `#${orderDraftReference(draftId)}` : null}
      width="wide"
    >
      <TrPanelEditorSave
        dirty={dirty}
        saving={busy === "draft"}
        saved={savedFlag}
        requireDirty={draftId !== null}
        disabled={busy !== null && busy !== "draft"}
        label="Taslak olarak kaydet"
        onSave={() => void saveDraft()}
      />
      <TrPanelEditorActions>
        <TrPanelConfirmPopover
          open={confirmDelete}
          side="bottom"
          align="end"
          message="Bu taslak silinsin mi?"
          confirmLabel="Evet, sil"
          cancelLabel="Vazgeç"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            void deleteDraft();
          }}
        >
          <TrPanelPopover
            label="Diğer işlemler"
            align="end"
            panelClassName="min-w-[170px]"
            trigger={({ open, ...trigger }) => (
              <button
                type="button"
                {...trigger}
                disabled={busy !== null}
                aria-label="Diğer işlemler"
                className={`grid h-9 w-9 place-items-center rounded-lg border border-white/15 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 disabled:opacity-50 motion-reduce:transition-none ${
                  open ? "bg-white/10 text-white" : "text-white/85"
                }`}
              >
                <Ellipsis className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </button>
            )}
          >
            {(close) => (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    void createOrder();
                  }}
                  className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-[13.5px] font-medium text-[color:var(--panel-accent-deep)] transition-colors duration-150 hover:bg-[color:var(--panel-accent-soft)]"
                >
                  {busy === "create" ? "Oluşturuluyor…" : "Kaydet ve Oluştur"}
                </button>
                {draftId ? (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setConfirmDelete(true);
                    }}
                    className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-[13.5px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50"
                  >
                    Sil
                  </button>
                ) : null}
              </div>
            )}
          </TrPanelPopover>
        </TrPanelConfirmPopover>
      </TrPanelEditorActions>

      <div className="grid gap-4 pt-1 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-4">
          {loadError ? (
            <p className={panelErrorClass} role="alert">
              {loadError}
            </p>
          ) : null}

          <CardShell
            title="Sipariş Detayı"
            hint="Siparişe eklediğiniz ürünler. Stok, sipariş oluşturulduğunda düşer."
            aside={
              lineCount > 0 ? (
                <span className="text-[13px] text-neutral-500">{lineCount} Ürün</span>
              ) : null
            }
          >
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                type="search"
                value=""
                onChange={(event) => openPicker(event.target.value)}
                // Not on focus: closing the picker returns focus here, which would reopen it.
                onClick={() => openPicker("")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "ArrowDown") {
                    event.preventDefault();
                    openPicker("");
                  }
                }}
                placeholder="Ürün ara.."
                aria-label="Ürün ara"
                className={`${panelFieldClass} pl-9`}
              />
            </div>

            <div className="mt-5">
              {lineCount === 0 ? (
                <EmptyLines />
              ) : !catalogReady ? (
                <div className="space-y-3" role="status" aria-label="Ürünler yükleniyor">
                  <TrPanelPulse className="h-14 w-full" />
                  <TrPanelPulse className="h-14 w-full" />
                </div>
              ) : (
                <TrManualOrderLines rows={rows} onQuantity={setQuantity} onRemove={removeLine} />
              )}
            </div>
          </CardShell>

          <CardShell title="Müşteri" hint="Siparişin kime gideceği. Müşteri kaydınız ve adresleri buradan seçilir.">
            <TrManualCustomerCard
              boutiqueId={boutique.id}
              customers={customers}
              customerId={order.customerId}
              addressId={order.addressId}
              selfPath={selfPath}
              onSelectCustomer={selectCustomer}
              onSelectAddress={(addressId) => change({ addressId })}
              onNewCustomer={newCustomer}
              onCustomerUpdated={(updated) =>
                setCustomers((list) =>
                  list ? list.map((entry) => (entry.id === updated.id ? updated : entry)) : list,
                )
              }
            />
          </CardShell>
        </div>

        <div className="min-w-0 space-y-4">
          <TrManualOrderSummary
            totals={totals}
            adjustment={order.adjustment}
            shippingFeeKurus={order.shippingFeeKurus}
            canAdjust={totals.subtotalKurus > 0}
            onEditAdjustment={() => setAdjustOpen(true)}
            onEditShipping={() => setShippingOpen(true)}
          />

          <CardShell
            title="Müşteri Notu"
            icon={<MessageCircle className="h-[18px] w-[18px] text-neutral-700" strokeWidth={1.75} aria-hidden />}
            hint="Siparişle birlikte saklanır; sipariş sayfasında görünür."
          >
            <textarea
              value={order.customerNote}
              maxLength={MANUAL_ORDER_LIMITS.noteMax}
              rows={4}
              onChange={(event) => change({ customerNote: event.target.value })}
              aria-label="Müşteri notu"
              className={`${panelFieldClass} resize-y`}
            />
          </CardShell>

          <CardShell
            title="Ödeme"
            hint="Ödemeyi şimdi aldıysanız işaretleyin; aksi halde sipariş sayfasından sonra “Ödendi” işaretleyebilirsiniz."
          >
            <div className="space-y-2" role="radiogroup" aria-label="Ödeme durumu">
              {(
                [
                  ["pending", "Ödeme bekleniyor"],
                  ["paid", "Ödeme alındı"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-[13.5px] transition-colors duration-150 motion-reduce:transition-none ${
                    order.paymentStatus === value
                      ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-soft)] font-medium text-neutral-900"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-status"
                    checked={order.paymentStatus === value}
                    onChange={() => change({ paymentStatus: value })}
                    className="h-4 w-4 accent-[color:var(--panel-accent)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </CardShell>
        </div>
      </div>

      <TrManualProductPicker
        key={picker.session}
        open={picker.open}
        onClose={() => setPicker((state) => ({ ...state, open: false }))}
        units={units}
        loading={!catalogReady}
        addedKeys={addedKeys}
        initialQuery={picker.query}
        onAdd={addUnits}
      />
      <TrManualAdjustmentModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        adjustment={order.adjustment}
        subtotalKurus={totals.subtotalKurus}
        onSave={(adjustment) => change({ adjustment })}
      />
      <TrManualShippingModal
        open={shippingOpen}
        onClose={() => setShippingOpen(false)}
        shippingFeeKurus={order.shippingFeeKurus}
        onSave={(shippingFeeKurus) => change({ shippingFeeKurus })}
      />
    </TrPanelEditor>
  );
}
