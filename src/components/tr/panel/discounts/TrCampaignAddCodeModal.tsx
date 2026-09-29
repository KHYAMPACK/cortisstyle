"use client";

import { useState } from "react";
import { TrPanelModal } from "@/components/tr/panel/TrPanelModal";
import {
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { CODE_LIMITS } from "@/lib/tr/discounts/codeRules";
import type { TrDiscountCampaignCode } from "@/lib/tr/discounts/types";
import {
  addOwnerCampaignCode,
  generateOwnerCampaignCodes,
} from "@/lib/tr/ownerClient";
import { toast } from "@/lib/tr/panel/toast";

type Mode = "custom" | "generate";

/** The Limitler fields shared by both modes; blank = sınırsız. */
function LimitFields({
  usageLimitTotal,
  usageLimitPerCustomer,
  onChange,
}: {
  usageLimitTotal: string;
  usageLimitPerCustomer: string;
  onChange: (patch: { usageLimitTotal?: string; usageLimitPerCustomer?: string }) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block space-y-2">
        <span className={panelLabelClass}>Toplam kullanım limiti</span>
        <input
          value={usageLimitTotal}
          onChange={(event) =>
            onChange({ usageLimitTotal: event.target.value.replace(/[^\d]/g, "") })
          }
          inputMode="numeric"
          placeholder="Sınırsız"
          className={panelFieldClass}
        />
      </label>
      <label className="block space-y-2">
        <span className={panelLabelClass}>Müşteri başına kullanım limiti</span>
        <input
          value={usageLimitPerCustomer}
          onChange={(event) =>
            onChange({ usageLimitPerCustomer: event.target.value.replace(/[^\d]/g, "") })
          }
          inputMode="numeric"
          placeholder="Sınırsız"
          className={panelFieldClass}
        />
      </label>
    </div>
  );
}

/**
 * "Kupon Ekle": one typed code (Özel Kupon) or a prefixed batch (Otomatik Kod Üret).
 * Adds instantly through its own API calls — not part of the campaign's Kaydet.
 */
export function TrCampaignAddCodeModal({
  open,
  onClose,
  campaignId,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  onAdded: (codes: TrDiscountCampaignCode[]) => void;
}) {
  return (
    <TrPanelModal open={open} onClose={onClose} title="Kupon Ekle">
      <ModalBody
        key={open ? "open" : "closed"}
        onClose={onClose}
        campaignId={campaignId}
        onAdded={onAdded}
      />
    </TrPanelModal>
  );
}

function ModalBody({
  onClose,
  campaignId,
  onAdded,
}: {
  onClose: () => void;
  campaignId: string;
  onAdded: (codes: TrDiscountCampaignCode[]) => void;
}) {
  const [mode, setMode] = useState<Mode>("custom");
  const [code, setCode] = useState("");
  const [prefix, setPrefix] = useState("");
  const [count, setCount] = useState("20");
  const [usageLimitTotal, setUsageLimitTotal] = useState("");
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState("");
  const [saving, setSaving] = useState(false);

  const limits = { usageLimitTotal, usageLimitPerCustomer };
  const changeLimits = (patch: { usageLimitTotal?: string; usageLimitPerCustomer?: string }) => {
    if (patch.usageLimitTotal !== undefined) setUsageLimitTotal(patch.usageLimitTotal);
    if (patch.usageLimitPerCustomer !== undefined) {
      setUsageLimitPerCustomer(patch.usageLimitPerCustomer);
    }
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const body = {
        usageLimitTotal: usageLimitTotal.trim() ? Number(usageLimitTotal) : null,
        usageLimitPerCustomer: usageLimitPerCustomer.trim()
          ? Number(usageLimitPerCustomer)
          : null,
      };
      if (mode === "custom") {
        const created = await addOwnerCampaignCode(campaignId, { code, ...body });
        toast.success("Kupon eklendi.");
        onAdded([created]);
      } else {
        const created = await generateOwnerCampaignCodes(campaignId, {
          prefix,
          count: Number(count),
          ...body,
        });
        toast.success(`${created.length} kupon eklendi.`);
        onAdded(created);
      }
      onClose();
    } catch (error) {
      toast.error(error, "Kupon eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-5 px-6 py-5">
        <div className="flex gap-2 rounded-lg bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 rounded-md py-2 text-[13.5px] font-semibold transition-colors ${
              mode === "custom"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Özel Kupon
          </button>
          <button
            type="button"
            onClick={() => setMode("generate")}
            className={`flex-1 rounded-md py-2 text-[13.5px] font-semibold transition-colors ${
              mode === "generate"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Otomatik Kod Üret
          </button>
        </div>

        {mode === "custom" ? (
          <label className="block space-y-2">
            <span className={panelLabelClass}>
              Kupon kodu
              <span className="text-[color:var(--panel-accent)]"> *</span>
            </span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.slice(0, CODE_LIMITS.codeMax))}
              placeholder="Örn. YAZ10"
              className={panelFieldClass}
            />
          </label>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className={panelLabelClass}>
                Kod ön eki
                <span className="text-[color:var(--panel-accent)]"> *</span>
              </span>
              <input
                value={prefix}
                onChange={(event) =>
                  setPrefix(event.target.value.slice(0, CODE_LIMITS.prefixMax))
                }
                placeholder="Örn. yaz-"
                className={panelFieldClass}
              />
            </label>
            <label className="block space-y-2">
              <span className={panelLabelClass}>Adet</span>
              <input
                value={count}
                onChange={(event) => setCount(event.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                className={panelFieldClass}
              />
              <span className={panelHintClass}>En fazla {CODE_LIMITS.generateMax}.</span>
            </label>
          </div>
        )}

        <LimitFields
          usageLimitTotal={limits.usageLimitTotal}
          usageLimitPerCustomer={limits.usageLimitPerCustomer}
          onChange={changeLimits}
        />
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4">
        <button type="button" onClick={onClose} className={panelSecondaryBtnClass}>
          İptal Et
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className={panelPrimaryBtnClass}
        >
          {saving ? "Ekleniyor…" : "Ekle"}
        </button>
      </div>
    </>
  );
}
