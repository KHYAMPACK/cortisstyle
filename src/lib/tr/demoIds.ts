/** Demo/test product and boutique ids never appear in the live catalog — kept only for sandbox tooling. */
export function isTrDemoProductId(productId: string): boolean {
  return (
    productId.startsWith("demo-product-") || productId.startsWith("demo-wl-")
  );
}

export function isTrDemoBoutiqueSlug(slug: string): boolean {
  return slug.startsWith("demo-");
}

export function isTrDemoProduct(product: {
  id?: string;
  boutique: { slug: string };
}): boolean {
  if (product.id && isTrDemoProductId(product.id)) return true;
  return isTrDemoBoutiqueSlug(product.boutique.slug);
}
