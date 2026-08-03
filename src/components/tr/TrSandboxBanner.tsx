import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { isTrDemoProductId } from "@/lib/tr/looks/demoCatalog";

interface TrSandboxBannerProps {
  className?: string;
  /** Force demo copy (e.g. on a demo PDP). */
  demo?: boolean;
}

export function TrSandboxBanner({
  className = "",
  demo = false,
}: TrSandboxBannerProps) {
  if (!demo && !isTrCheckoutEnabled()) {
    return null;
  }

  return (
    <div
      className={`border border-blueprint-border bg-blueprint-surface px-4 py-3 text-[11px] leading-relaxed text-meta ${className}`}
      role="status"
    >
      {demo
        ? "Demo alışveriş — gerçek ödeme yok. Sepet ve sipariş onayı yalnızca vitrin deneyimi için."
        : "Ödeme altyapısı hazırlanıyor. Sepet çalışıyor — kart ile ödeme yakında açılacak."}
    </div>
  );
}

/** Client helper: cart has any demo line items. */
export function cartHasDemoItems(
  items: Array<{ productId: string }>,
): boolean {
  return items.some(
    (item) =>
      isTrDemoProductId(item.productId) ||
      item.productId.startsWith("demo-wl-"),
  );
}
