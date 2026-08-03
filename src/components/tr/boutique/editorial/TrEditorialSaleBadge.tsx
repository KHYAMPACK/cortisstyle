"use client";

interface TrEditorialSaleBadgeProps {
  percent: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Animated % off badge for editorial / white-label storefronts.
 */
export function TrEditorialSaleBadge({
  percent,
  className = "",
  size = "sm",
}: TrEditorialSaleBadgeProps) {
  if (percent <= 0) return null;

  const sizeClass =
    size === "lg"
      ? "px-3 py-1.5 text-[13px] tracking-[0.08em]"
      : size === "md"
        ? "px-2.5 py-1 text-[11px] tracking-[0.06em]"
        : "px-1.5 py-0.5 text-[10px] font-medium tracking-[0.04em]";

  return (
    <span
      className={`editorial-sale-badge inline-flex items-center justify-center uppercase ${sizeClass} ${className}`}
      aria-label={`%${percent} indirim`}
    >
      %{percent}
    </span>
  );
}

export function discountPercentFromPrices(
  priceKurus: number,
  compareAtKurus: number,
): number {
  if (compareAtKurus <= priceKurus) return 0;
  return Math.round(((compareAtKurus - priceKurus) / compareAtKurus) * 100);
}
