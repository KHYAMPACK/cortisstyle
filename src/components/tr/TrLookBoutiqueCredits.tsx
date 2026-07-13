import Link from "next/link";
import Image from "next/image";
import type { MouseEvent } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { trBoutiquePath } from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

const MAX_CREDIT_LOGOS = 3;

interface TrLookBoutiqueCreditsProps {
  boutiques: TrBoutiquePublic[];
  placeholderCount?: number;
}

export function TrLookBoutiqueCredits({
  boutiques,
  placeholderCount = 0,
}: TrLookBoutiqueCreditsProps) {
  const unique: TrBoutiquePublic[] = [];
  const seen = new Set<string>();
  for (const boutique of boutiques) {
    if (seen.has(boutique.id)) continue;
    seen.add(boutique.id);
    unique.push(boutique);
  }

  const shown = unique.slice(0, MAX_CREDIT_LOGOS);
  const extra = unique.length - shown.length;

  const stopCard = (event: MouseEvent) => {
    event.stopPropagation();
  };

  if (shown.length === 0 && placeholderCount <= 0) return null;

  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-meta text-[9px] tracking-[0.22em] uppercase">Butik</p>
      <div className="flex items-center gap-2">
        {shown.map((boutique) => {
          const logo = boutique.logoUrl ? (
            <Image
              src={boutique.logoUrl}
              alt=""
              width={32}
              height={32}
              unoptimized
              className={`h-full w-full object-contain p-1 ${
                boutique.logoUrl.includes("cortisstyle-logo-light")
                  ? "invert"
                  : ""
              }`}
            />
          ) : (
            <span className="font-serif text-sm text-neutral-700">
              {boutique.name.trim().charAt(0) || "B"}
            </span>
          );

          return (
            <Link
              key={boutique.id}
              href={trBoutiquePath(boutique.slug)}
              onClick={stopCard}
              title={boutique.name}
              aria-label={`${boutique.name} butiğine git`}
              className="relative flex h-8 w-8 items-center justify-center overflow-hidden border border-blueprint-border bg-ice-floor transition-opacity hover:opacity-80"
            >
              {logo}
            </Link>
          );
        })}
        {Array.from({ length: placeholderCount }, (_, index) => (
          <div
            key={`ph-${index}`}
            className="relative flex h-8 w-8 items-center justify-center overflow-hidden border border-blueprint-border bg-ice-floor"
            aria-hidden
          >
            <BrandLogo variant="onLight" className="h-5 w-auto opacity-50" />
          </div>
        ))}
        {extra > 0 ? (
          <span className="text-meta text-[9px] tracking-[0.18em] uppercase">
            +{extra}
          </span>
        ) : null}
      </div>
    </div>
  );
}
