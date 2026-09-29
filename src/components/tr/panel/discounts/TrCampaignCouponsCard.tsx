"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";
import {
  panelEmptyClass,
  panelErrorClass,
  panelHintClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { TrCampaignAddCodeModal } from "@/components/tr/panel/discounts/TrCampaignAddCodeModal";
import type { TrDiscountCampaignCode } from "@/lib/tr/discounts/types";
import { deleteOwnerCampaignCode, fetchOwnerCampaignCodes } from "@/lib/tr/ownerClient";
import { toast } from "@/lib/tr/panel/toast";

function limitsLabel(code: TrDiscountCampaignCode): string {
  const parts: string[] = [];
  if (code.usageLimitTotal != null) parts.push(`${code.usageLimitTotal} toplam`);
  if (code.usageLimitPerCustomer != null) parts.push(`${code.usageLimitPerCustomer}/müşteri`);
  return parts.length > 0 ? parts.join(" · ") : "Sınırsız";
}

/**
 * The Kuponlar tab of a `kind: 'code'` campaign: its redeemable codes, added and
 * removed instantly through their own API calls (not part of the campaign's Kaydet).
 */
export function TrCampaignCouponsCard({ campaignId }: { campaignId: string }) {
  const [codes, setCodes] = useState<TrDiscountCampaignCode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerCampaignCodes(campaignId)
      .then((result) => {
        if (!cancelled) setCodes(result);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Kuponlar yüklenemedi.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const remove = async (code: TrDiscountCampaignCode) => {
    setDeletingId(code.id);
    try {
      await deleteOwnerCampaignCode(campaignId, code.id);
      setCodes((current) => (current ?? []).filter((entry) => entry.id !== code.id));
      toast.success("Kupon silindi.");
    } catch (deleteError) {
      toast.error(deleteError, "Kupon silinemedi.");
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className={panelHintClass}>
          Her kupon kendi kullanım limitleriyle, tek tek veya toplu olarak eklenir.
        </p>
        <button type="button" onClick={() => setAddOpen(true)} className={panelPrimaryBtnClass}>
          Kupon Ekle
        </button>
      </div>

      {error && !codes ? (
        <p className={panelErrorClass}>{error}</p>
      ) : !codes ? (
        <p className="text-[13px] text-neutral-500">Kuponlar yükleniyor…</p>
      ) : codes.length === 0 ? (
        <p className={panelEmptyClass}>Henüz kupon eklemediniz.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white">
          <ul className="divide-y divide-neutral-100">
            {codes.map((code) => (
              <li
                key={code.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[13.5px] font-semibold text-neutral-900">
                    {code.code}
                  </p>
                  <p className="mt-0.5 text-[13px] text-neutral-500">
                    {limitsLabel(code)} · {code.usedCount} kullanım
                  </p>
                </div>
                <TrPanelConfirmPopover
                  open={confirmingId === code.id}
                  onCancel={() => setConfirmingId(null)}
                  onConfirm={() => void remove(code)}
                  message="Bu kupon silinsin mi?"
                  confirmLabel="Evet, sil"
                  align="end"
                >
                  <button
                    type="button"
                    disabled={deletingId === code.id}
                    onClick={() => setConfirmingId(code.id)}
                    aria-label={`${code.code} kuponunu sil`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-red-700"
                  >
                    {deletingId === code.id ? (
                      <TrPanelBusySpinner />
                    ) : (
                      <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    )}
                  </button>
                </TrPanelConfirmPopover>
              </li>
            ))}
          </ul>
        </div>
      )}

      <TrCampaignAddCodeModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        campaignId={campaignId}
        onAdded={(added) => setCodes((current) => [...(current ?? []), ...added])}
      />
    </div>
  );
}
