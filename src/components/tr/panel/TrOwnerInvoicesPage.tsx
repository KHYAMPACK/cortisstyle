"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelBackLinkClass,
  panelEmptyClass,
  panelErrorClass,
  panelPageTitleClass,
} from "@/components/tr/panel/panelUi";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import {
  buildDemoInvoiceHtml,
  demoInvoiceStatusLabel,
  demoInvoiceTypeLabel,
  formatInvoiceDate,
  getDemoInvoices,
  type DemoInvoice,
  type DemoInvoiceStatus,
  type DemoInvoiceType,
} from "@/lib/tr/demoInvoices";
import { printHtmlDocument } from "@/lib/tr/printDocument";
import { trPanelPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";

type TypeFilter = "all" | DemoInvoiceType;
type StatusFilter = "all" | DemoInvoiceStatus;

function statusTone(status: DemoInvoiceStatus): string {
  if (status === "gonderildi") return "bg-emerald-50 text-emerald-900";
  if (status === "kesildi") return "bg-sky-50 text-sky-950";
  return "bg-neutral-100 text-neutral-600";
}

function InvoicesBoard({ boutiqueName }: { boutiqueName: string }) {
  const invoices = useMemo(() => getDemoInvoices(boutiqueName), [boutiqueName]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [printError, setPrintError] = useState<string | null>(null);

  const visible = useMemo(() => {
    return invoices.filter((invoice) => {
      if (typeFilter !== "all" && invoice.type !== typeFilter) return false;
      if (statusFilter !== "all" && invoice.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, statusFilter, typeFilter]);

  const printInvoice = (invoice: DemoInvoice) => {
    setPrintError(null);
    try {
      printHtmlDocument(
        buildDemoInvoiceHtml({ invoice, boutiqueName }),
        invoice.number,
      );
    } catch (error) {
      setPrintError(
        error instanceof Error ? error.message : "Yazdırma başarısız.",
      );
    }
  };

  return (
    <TrPanelFadeIn className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-neutral-700">
          {visible.length}/{invoices.length} fatura · otomatik kesim (demo)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "Tümü"],
              ["e-arsiv", "e-Arşiv"],
              ["e-fatura", "e-Fatura"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTypeFilter(id)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${
                typeFilter === id
                  ? "bg-[color:var(--panel-accent)] text-white"
                  : "bg-white text-neutral-700 ring-1 ring-[color:var(--panel-accent-border)]"
              }`}
            >
              {label}
            </button>
          ))}
          {(
            [
              ["all", "Durum"],
              ["gonderildi", "Gönderildi"],
              ["kesildi", "Kesildi"],
              ["iptal", "İptal"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={`st-${id}`}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${
                statusFilter === id
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700 ring-1 ring-neutral-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {printError ? <p className={panelErrorClass}>{printError}</p> : null}

      {visible.length === 0 ? (
        <p className={panelEmptyClass}>Bu filtrede fatura yok.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[color:var(--panel-accent-border)] bg-white shadow-sm">
          <div className="hidden grid-cols-[7.5rem_6.5rem_minmax(0,1fr)_5.5rem_5.5rem_6rem] gap-2 border-b border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-soft)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 sm:grid">
            <span>Tarih</span>
            <span>No</span>
            <span>Müşteri / sipariş</span>
            <span>Tip</span>
            <span className="text-right">Tutar</span>
            <span className="text-right">İşlem</span>
          </div>
          <ul className="divide-y divide-[color:var(--panel-accent-border)]">
            {visible.map((invoice) => (
              <li
                key={invoice.id}
                className="grid grid-cols-1 gap-2 px-3 py-2.5 sm:grid-cols-[7.5rem_6.5rem_minmax(0,1fr)_5.5rem_5.5rem_6rem] sm:items-center sm:gap-2"
              >
                <div className="text-[13px] tabular-nums text-neutral-800">
                  {formatInvoiceDate(invoice.issuedAt)}
                </div>
                <div className="truncate font-mono text-[12px] font-semibold text-neutral-900">
                  {invoice.number}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-neutral-900">
                    {invoice.customerName}
                  </p>
                  <p className="truncate text-[11px] text-neutral-500">
                    {invoice.orderRef} · {invoice.customerEmail}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-700">
                    {demoInvoiceTypeLabel(invoice.type)}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusTone(invoice.status)}`}
                  >
                    {demoInvoiceStatusLabel(invoice.status)}
                  </span>
                </div>
                <div className="text-[13px] font-semibold tabular-nums text-neutral-950 sm:text-right">
                  {formatTryFromKurus(invoice.totalKurus)}
                </div>
                <div className="sm:text-right">
                  <button
                    type="button"
                    onClick={() => printInvoice(invoice)}
                    className="inline-flex min-h-8 items-center justify-center rounded-lg border border-[color:var(--panel-accent-border)] bg-white px-2.5 py-1 text-[12px] font-semibold text-neutral-800 hover:bg-[color:var(--panel-accent-soft)]"
                  >
                    Yazdır
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[12px] leading-relaxed text-neutral-500">
        Faturalar sipariş kargoya çıkınca arka planda otomatik kesilir. Bu liste
        demo kayıtlarıdır; GİB bağlantısı sonra bağlanır.
      </p>
    </TrPanelFadeIn>
  );
}

export function TrOwnerInvoicesPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-4">
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Ana sayfa
            </Link>
            <h2 className={panelPageTitleClass}>Faturalar</h2>
          </div>
          <InvoicesBoard boutiqueName={activeBoutique.name} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
