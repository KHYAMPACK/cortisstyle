import type { CSSProperties } from "react";

export type TrBoutiqueSkeletonKind =
  | "account"
  | "products"
  | "cart"
  | "product"
  | "home"
  | "generic";

function Bone({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`tr-skeleton-bone ${className}`} style={style} />;
}

function ProductCardBone() {
  return (
    <div className="bg-white">
      <Bone className="aspect-[2/3] w-full" />
      <div className="space-y-2 px-2 py-3">
        <Bone className="h-3 w-3/4" />
        <Bone className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function TrBoutiqueAccountSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl animate-[tr-skeleton-fade_0.28s_ease-out] px-5 py-10 md:px-8 md:py-14"
      role="status"
      aria-live="polite"
      aria-label="Hesap yükleniyor"
    >
      <div className="mb-8 flex flex-col items-center gap-3">
        <Bone className="h-14 w-36 md:h-16 md:w-44" />
      </div>
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <Bone className="h-8 w-48 md:h-9 md:w-56" />
        <Bone className="h-4 w-full max-w-sm" />
        <Bone className="h-4 w-2/3" />
      </div>
      <Bone className="mt-8 h-12 w-full" />
      <div className="mt-8 space-y-2">
        <Bone className="mb-3 h-3 w-28" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Bone key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
      <div className="mt-10 space-y-3">
        <Bone className="h-3 w-24" />
        <div className="grid grid-cols-2 gap-px bg-black/5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <ProductCardBone key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrBoutiqueProductsSkeleton() {
  return (
    <div
      className="animate-[tr-skeleton-fade_0.28s_ease-out] px-4 py-6 md:px-8 md:py-8"
      role="status"
      aria-live="polite"
      aria-label="Ürünler yükleniyor"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Bone className="h-4 w-24" />
        <Bone className="h-9 w-44" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-black/5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardBone key={i} />
        ))}
      </div>
    </div>
  );
}

export function TrBoutiqueCartSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl animate-[tr-skeleton-fade_0.28s_ease-out] px-5 py-10 md:px-8"
      role="status"
      aria-live="polite"
      aria-label="Sepet yükleniyor"
    >
      <Bone className="mb-8 h-8 w-40" />
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-4 border border-black/8 p-3">
            <Bone className="h-24 w-20 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2 py-1">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/3" />
              <Bone className="mt-4 h-8 w-28" />
            </div>
          </div>
        ))}
      </div>
      <Bone className="mt-8 h-12 w-full" />
    </div>
  );
}

export function TrBoutiqueProductSkeleton() {
  return (
    <div
      className="mx-auto grid max-w-7xl animate-[tr-skeleton-fade_0.28s_ease-out] gap-8 px-4 py-6 md:grid-cols-2 md:px-8 md:py-10"
      role="status"
      aria-live="polite"
      aria-label="Ürün yükleniyor"
    >
      <Bone className="aspect-[3/4] w-full" />
      <div className="space-y-4 py-2">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-3/4" />
        <Bone className="h-5 w-28" />
        <div className="flex gap-2 pt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Bone key={i} className="h-10 w-10" />
          ))}
        </div>
        <Bone className="mt-6 h-12 w-full" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function TrBoutiqueHomeSkeleton() {
  return (
    <div
      className="animate-[tr-skeleton-fade_0.28s_ease-out]"
      role="status"
      aria-live="polite"
      aria-label="Sayfa yükleniyor"
    >
      <Bone className="aspect-[16/10] w-full md:aspect-[21/9]" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-8 md:grid-cols-4 md:gap-4 md:px-8">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="aspect-[3/4] w-full" />
        ))}
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
        <Bone className="mb-4 h-4 w-40" />
        <div className="grid grid-cols-2 gap-px bg-black/5 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardBone key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrBoutiqueGenericSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl animate-[tr-skeleton-fade_0.28s_ease-out] space-y-4 px-5 py-12 md:px-8"
      role="status"
      aria-live="polite"
      aria-label="Sayfa yükleniyor"
    >
      <Bone className="h-8 w-48" />
      <Bone className="h-4 w-full" />
      <Bone className="h-4 w-5/6" />
      <Bone className="mt-6 h-40 w-full" />
      <Bone className="h-40 w-full" />
    </div>
  );
}

export function TrBoutiquePageSkeleton({
  kind = "generic",
}: {
  kind?: TrBoutiqueSkeletonKind;
}) {
  switch (kind) {
    case "account":
      return <TrBoutiqueAccountSkeleton />;
    case "products":
      return <TrBoutiqueProductsSkeleton />;
    case "cart":
      return <TrBoutiqueCartSkeleton />;
    case "product":
      return <TrBoutiqueProductSkeleton />;
    case "home":
      return <TrBoutiqueHomeSkeleton />;
    default:
      return <TrBoutiqueGenericSkeleton />;
  }
}

/** Infer skeleton layout from a boutique-relative href. */
export function resolveBoutiqueSkeletonKind(
  href: string,
): TrBoutiqueSkeletonKind {
  const path = (href.split("?")[0] ?? href).replace(/\/$/, "") || "/";
  if (/\/giris$/.test(path) || /\/hesap$/.test(path) || path === "/giris") {
    return "account";
  }
  if (/\/sepet$/.test(path) || /\/cart$/.test(path) || path === "/sepet") {
    return "cart";
  }
  if (/\/favoriler$/.test(path) || path === "/favoriler") {
    return "account";
  }
  if (/\/odeme$/.test(path) || /\/checkout$/.test(path)) return "generic";
  if (/\/urunler$/.test(path) || path === "/urunler") return "products";
  if (/\/urun\//.test(path)) return "product";
  // Boutique home: /tr/{slug} or custom-domain /
  if (/^\/tr\/[^/]+$/.test(path) || path === "/") return "home";
  return "generic";
}
