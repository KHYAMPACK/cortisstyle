"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPageTitleClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelFadeIn,
  TrPanelLoading,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerInvoices,
  updateOwnerInvoice,
} from "@/lib/tr/ownerClient";
import { trPanelOrdersPath, trPanelPath } from "@/lib/tr/paths";
import {
  formatTryFromKurus,
  type TrInvoice,
  type TrInvoiceStatus,
} from "@/types/tr-marketplace";

const STATUS_LABEL: Record<TrInvoiceStatus, string> = {
  draft: "Taslak",
  issued_offline: "Kesildi (manuel)",
  void: "İptal",
};

function InvoicesList({ boutiqueId }: { boutiqueId: string }) {
  const [invoices, setInvoices] = useState<TrInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftNos, setDraftNos] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchOwnerInvoices(boutiqueId);
        if (cancelled) return;
        setInvoices(list);
        setDraftNos((current) => {
          const next = { ...current };
          for (const inv of list) {
            if (next[inv.id] === undefined) {
              next[inv.id] = inv.externalInvoiceNo ?? "";
            }
          }
          return next;
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Faturalar yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const patchInvoice = async (
    invoice: TrInvoice,
    patch: {
      status?: TrInvoiceStatus;
      externalInvoiceNo?: string | null;
    },
  ) => {
    setBusyId(invoice.id);
    setError(null);
    try {
      const updated = await updateOwnerInvoice(invoice.id, {
        boutiqueId,
        ...patch,
      });
      setInvoices((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Fatura güncellenemedi.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <TrPanelLoading label="Faturalar yükleniyor…" />;
  }

  return (
    <TrPanelFadeIn className="space-y-4">
      <p className={panelHintClass}>
        GİB otomatik kesim henüz yok. Ödeme onaylanınca taslak oluşur; faturayı
        kendi sürecinizle kestikten sonra numarayı yazıp “Kesildi” işaretleyin.
      </p>

      {error ? <p className={panelErrorClass}>{error}</p> : null}

      {invoices.length === 0 ? (
        <p className={panelEmptyClass}>
          Henüz fatura kaydı yok. Siparişi “Ödendi” yaptığınızda burada taslak
          görünür.
        </p>
      ) : (
        <ul className="space-y-3">
          {invoices.map((invoice) => (
            <li key={invoice.id} className={panelSectionClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-neutral-950">
                    {invoice.buyerName}
                  </p>
                  <p className="text-[12px] text-neutral-600">
                    {invoice.invoiceType === "corporate"
                      ? `Kurumsal${invoice.buyerTitle ? ` · ${invoice.buyerTitle}` : ""}`
                      : "Bireysel"}
                    {invoice.buyerTaxId ? ` · ${invoice.buyerTaxId}` : ""}
                  </p>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    {formatTryFromKurus(invoice.totalKurus)} ·{" "}
                    {STATUS_LABEL[invoice.status]}
                  </p>
                </div>
                <Link
                  href={`${trPanelOrdersPath()}/${invoice.orderId}`}
                  className="text-[12px] underline underline-offset-2"
                >
                  Sipariş
                </Link>
              </div>

              <div className="mt-3 space-y-2">
                <label className="block space-y-1">
                  <span className="text-[11px] tracking-[0.1em] text-neutral-600 uppercase">
                    Harici fatura no
                  </span>
                  <input
                    value={draftNos[invoice.id] ?? ""}
                    onChange={(event) =>
                      setDraftNos((current) => ({
                        ...current,
                        [invoice.id]: event.target.value,
                      }))
                    }
                    className="w-full border border-black/15 bg-white px-3 py-2 text-[13px] outline-none focus:border-black/40"
                    placeholder="Muhasebe / portal numarası"
                    disabled={busyId === invoice.id}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === invoice.id}
                    onClick={() =>
                      void patchInvoice(invoice, {
                        externalInvoiceNo: draftNos[invoice.id] ?? "",
                        status: "issued_offline",
                      })
                    }
                    className="border border-black/15 bg-neutral-950 px-3 py-2 text-[11px] tracking-[0.12em] text-white uppercase disabled:opacity-50"
                  >
                    Kesildi olarak işaretle
                  </button>
                  {invoice.status !== "void" ? (
                    <button
                      type="button"
                      disabled={busyId === invoice.id}
                      onClick={() =>
                        void patchInvoice(invoice, { status: "void" })
                      }
                      className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.12em] uppercase disabled:opacity-50"
                    >
                      İptal
                    </button>
                  ) : null}
                  {invoice.status === "void" ? (
                    <button
                      type="button"
                      disabled={busyId === invoice.id}
                      onClick={() =>
                        void patchInvoice(invoice, { status: "draft" })
                      }
                      className="border border-black/15 px-3 py-2 text-[11px] tracking-[0.12em] uppercase disabled:opacity-50"
                    >
                      Taslağa al
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </TrPanelFadeIn>
  );
}

/**
 * Offline e-fatura registry — GİB entegrasyonu sonra.
 */
export function TrOwnerInvoicesPage() {
  return (
    <TrOwnerPanelGate>
      {(ctx) => (
        <div className="space-y-4">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Faturalar</h2>
          </div>
          <InvoicesList boutiqueId={ctx.activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
