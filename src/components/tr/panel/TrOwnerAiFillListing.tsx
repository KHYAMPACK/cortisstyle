"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  requestOwnerListingDraft,
  type OwnerListingDraft,
} from "@/lib/tr/ownerClient";
import {
  clampDescription,
  clampTitle,
} from "@/lib/tr/ownerProductConstraints";

export interface TrOwnerAiFillListingProps {
  boutiqueId: string;
  /** Preferred: front packshot / marketplace cutout */
  sourceImageUrl?: string | null;
  category?: string | null;
  /** Cached draft from step-1 Gemini prepare (optional) */
  cachedDraft?: OwnerListingDraft | null;
  /** True while front photo AI identification is still running */
  awaitingDraft?: boolean;
  onApply: (draft: OwnerListingDraft) => void;
  onError?: (message: string | null) => void;
  disabled?: boolean;
}

/**
 * Optional control: apply Gemini title/description — never auto-fills.
 * When `cachedDraft` exists (from step 1), apply is instant — no network.
 */
export function TrOwnerAiFillListing({
  boutiqueId,
  sourceImageUrl,
  category,
  cachedDraft,
  awaitingDraft = false,
  onApply,
  onError,
  disabled = false,
}: TrOwnerAiFillListingProps) {
  const [loading, setLoading] = useState(false);

  const hasCached = Boolean(cachedDraft?.title?.trim());
  const canFetch = Boolean(sourceImageUrl?.trim());
  const canRun =
    !disabled && !loading && !awaitingDraft && (hasCached || canFetch);

  function applyCached() {
    if (!cachedDraft?.title?.trim()) return;
    onError?.(null);
    onApply({
      title: clampTitle(cachedDraft.title),
      description: clampDescription(cachedDraft.description ?? ""),
      features: cachedDraft.features ?? {},
      category: cachedDraft.category ?? null,
    });
  }

  async function fetchAndApply() {
    const url = sourceImageUrl?.trim();
    if (!url) {
      onError?.("Önce ürün fotoğrafı ekleyin.");
      return;
    }
    onError?.(null);
    setLoading(true);
    try {
      const remote = await requestOwnerListingDraft({
        boutiqueId,
        sourceImageUrl: url,
        category,
      });
      onApply({
        title: clampTitle(remote.title),
        description: clampDescription(remote.description ?? ""),
        features: remote.features ?? {},
        category: remote.category ?? null,
      });
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "AI doldurma başarısız.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFill() {
    if (!canRun) return;
    // Step-1 draft: paste only — never hit the network again
    if (hasCached) {
      applyCached();
      return;
    }
    void fetchAndApply();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border-2 border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            className="text-[16px] font-semibold"
            style={{ color: "var(--panel-accent-deep)" }}
          >
            AI ile ürün metni ve özellikleri
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
            {awaitingDraft
              ? "Ön fotoğraftan ürün tanınıyor — biraz bekleyin."
              : hasCached
                ? `Hazır: “${cachedDraft!.title.trim()}” — isim, açıklama ve özellikleri doldurur.`
                : "Ön adımda taslak yoktu. İsterseniz şimdi yeniden öneri ister (birkaç sn sürebilir)."}
          </p>
        </div>
        <button
          type="button"
          className={`${panelPrimaryBtnClass} min-h-12 shrink-0 px-5 py-3 text-[15px]`}
          disabled={!canRun}
          onClick={handleFill}
        >
          {loading
            ? "Dolduruluyor…"
            : awaitingDraft
              ? "Tanıma bekleniyor…"
              : "AI ile doldur"}
        </button>
      </div>
    </motion.div>
  );
}
