import Image from "next/image";
import { PLATFORM_CREDIT } from "@/lib/platform/platformCredit";

type CreditVariant = "light" | "dark";

/**
 * Shared “Ekiz Yazılım” platform watermark for every boutique footer.
 * Keep boutique brand primary; this is a quiet company credit.
 */
export function TrPlatformCredit({
  variant = "light",
  className = "",
}: {
  variant?: CreditVariant;
  className?: string;
}) {
  const muted =
    variant === "dark" ? "text-white/45" : "text-neutral-500";

  const mark = (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`text-[10px] tracking-[0.16em] uppercase ${muted}`}
      >
        {PLATFORM_CREDIT.label}
      </span>
      <Image
        src={PLATFORM_CREDIT.watermarkSrc}
        alt={PLATFORM_CREDIT.companyName}
        width={PLATFORM_CREDIT.watermarkWidth}
        height={PLATFORM_CREDIT.watermarkHeight}
        className="h-14 w-auto object-contain sm:h-16"
        unoptimized
      />
    </span>
  );

  return (
    <div
      className={`flex items-center ${className}`}
      aria-label={`${PLATFORM_CREDIT.label}: ${PLATFORM_CREDIT.companyName}`}
    >
      {PLATFORM_CREDIT.href ? (
        <a
          href={PLATFORM_CREDIT.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${PLATFORM_CREDIT.companyName} — yeni sekmede aç`}
          className="cursor-pointer transition-opacity hover:opacity-80"
        >
          {mark}
        </a>
      ) : (
        mark
      )}
    </div>
  );
}
