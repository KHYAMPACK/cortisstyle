import type { TrProduct } from "@/types/tr-marketplace";

export function trHomePath(): string {
  return "/tr";
}

export function trBoutiquePath(slug: string): string {
  return `/tr/${encodeURIComponent(slug)}`;
}

export function trProductPath(productId: string): string {
  return `/tr/shop/${encodeURIComponent(productId)}`;
}

export function trCartPath(): string {
  return "/tr/cart";
}

export function trCheckoutPath(): string {
  return "/tr/checkout";
}

export function trOrderConfirmationPath(): string {
  return "/tr/siparis-onay";
}

export function trComingSoonPath(): string {
  return "/tr/yakinda";
}

export function getProductCoverImage(product: Pick<TrProduct, "images" | "title">): string | null {
  return product.images[0] ?? null;
}
