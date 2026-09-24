"use client";

import { Check, Truck } from "lucide-react";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import type { FreeShippingProgress } from "@/lib/tr/shipping/quoteShipping";
import {
  freeShippingNudgeDetail,
  tlLabel,
} from "@/lib/tr/shipping/shippingCopy";
import { formatTryFromKurus } from "@/types/tr-marketplace";

export function TrFreeShippingNudge({
  progress,
  shopHref,
}: {
  progress: FreeShippingProgress;
  shopHref?: string;
}) {
  if (progress.free) {
    return (
      <div
        className="flex items-center gap-3 border border-brand-primary/20 bg-[color:var(--brand-primary-muted)] px-3.5 py-3"
        role="status"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-brand-primary/25 bg-white">
          <Check
            className="h-3.5 w-3.5 text-brand-primary"
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] text-brand-primary uppercase">
            Kargo
          </p>
          <p className="font-serif text-[18px] leading-tight tracking-tight text-neutral-950">
            Ücretsiz
          </p>
        </div>
        <p className="ml-auto max-w-[9rem] text-right text-[10px] leading-snug tracking-[0.12em] text-neutral-500 uppercase">
          Bu siparişte
        </p>
      </div>
    );
  }

  const ratio =
    progress.needed > 0
      ? Math.min(1, Math.max(0, progress.current / progress.needed))
      : 0;
  const detail = freeShippingNudgeDetail(progress);
  const counter =
    progress.unit === "amount"
      ? `${tlLabel(progress.current)}/${tlLabel(progress.needed)}`
      : `${progress.current}/${progress.needed}`;
  const inner = (
    <>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Truck
            className="h-3.5 w-3.5 shrink-0 text-neutral-500"
            strokeWidth={1.5}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
              Kargo {formatTryFromKurus(progress.feeKurus)}
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-neutral-800">
              {detail}
            </p>
          </div>
        </div>
        <p className="shrink-0 text-[10px] tracking-[0.16em] text-neutral-400 uppercase">
          {counter}
        </p>
      </div>
      <div
        className="mt-2.5 h-1 overflow-hidden bg-neutral-200"
        aria-hidden
      >
        <div
          className="h-full bg-brand-primary transition-[width] duration-300 ease-out"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </>
  );

  if (shopHref) {
    return (
      <TrSoftNavLink
        href={shopHref}
        className="block border border-black/10 bg-white px-3.5 py-3 text-left transition-colors hover:border-brand-primary/30 hover:bg-neutral-50"
        aria-label={detail}
      >
        {inner}
      </TrSoftNavLink>
    );
  }

  return (
    <div className="border border-black/10 bg-white px-3.5 py-3">{inner}</div>
  );
}
