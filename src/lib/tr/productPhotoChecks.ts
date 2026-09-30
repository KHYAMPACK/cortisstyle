import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";

/** Non-empty image URLs, capped at the product image limit. */
export function compactImageUrls(urls: string[]): string[] {
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, TR_OWNER_PRODUCT_LIMITS.maxImages);
}

/** The manual gallery needs at least one photo. */
export function hasManualGalleryPhoto(images: string[]): boolean {
  return compactImageUrls(images).length > 0;
}

/** The guided upload's required slots (front, back…) are all filled. */
export function hasRequiredProductPhotos(
  images: string[],
  requiredSlots = 2,
): boolean {
  for (let i = 0; i < requiredSlots; i += 1) {
    if (!images[i]?.trim()) return false;
  }
  return true;
}
