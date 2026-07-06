import { isTrCheckoutEnabled } from "@/lib/tr/platform";

interface TrSandboxBannerProps {
  className?: string;
}

export function TrSandboxBanner({ className = "" }: TrSandboxBannerProps) {
  if (!isTrCheckoutEnabled()) {
    return null;
  }

  return (
    <div
      className={`border border-blueprint-border bg-blueprint-surface px-4 py-3 text-[11px] leading-relaxed text-meta ${className}`}
      role="status"
    >
      Ödeme altyapısı hazırlanıyor. Sepet çalışıyor — kart ile ödeme yakında açılacak.
    </div>
  );
}
