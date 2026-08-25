export {
  createBoutiqueAdmin,
  getBoutiqueByIdAdmin,
  getPublicBoutiqueById,
  getPublicBoutiqueBySlug,
  listAllBoutiquesAdmin,
  listPublicBoutiques,
  setBoutiqueOwnerAdmin,
  updateBoutiqueStatusAdmin,
} from "@/lib/tr/boutiques";

export {
  createProductAdmin,
  getProductByIdAdmin,
  getPublicProductById,
  listProductsByBoutiqueIdAdmin,
  listPublicAvailableProducts,
  listPublicProductsByBoutiqueId,
  listPublicProductsByBoutiqueSlug,
  markProductsSoldAdmin,
  updateProductAdmin,
  updateProductStatusAdmin,
} from "@/lib/tr/products";

export {
  createOrderAdmin,
  getOrderByIdAdmin,
  updateOrderPaymentStatusAdmin,
} from "@/lib/tr/orders";

export { getPublicBoutiqueStorefrontBySlug } from "@/lib/tr/storefront";

export {
  isLookbookPieceImage,
  mapProductsWithLookbookImages,
  withLookbookPieceImages,
} from "@/lib/tr/lookbookImages";

export {
  getBoutiqueProductImages,
  getMarketplaceProductImages,
  getMarketplaceGalleryImages,
  getStorefrontGalleryImages,
  getProductCoverImageFor,
  getProductHoverImage,
  getProductSecondaryImage,
  getPanelProductCover,
  hasRealMarketplaceImagery,
  isCatalogCutoutImage,
} from "@/lib/tr/productImages";
export type { TrProductImageSurface } from "@/lib/tr/productImages";

export {
  listPublishedTrLooks,
  safeGetPublishedTrLookBySlug,
  safeListPublishedTrLooks,
  TR_LOOKS_SECTION_ID,
  TR_HOME_LOOK_TEASER_COUNT,
  caddeLookAnchorId,
  trKombinlerLookHref,
} from "@/lib/tr/looks";
export type {
  TrLookDefinition,
  TrLookStatus,
  TrLookWithProducts,
} from "@/types/tr-look";

export {
  trBoutiquePath,
  trBoutiqueProductPath,
  trBoutiquesPath,
  trCartPath,
  trCheckoutPath,
  trClothPath,
  trComingSoonPath,
  trDevHeroImportPath,
  trFavoritesPath,
  trHomePath,
  trLookPath,
  trKombinlerPath,
  TR_PDP_FROM_CADDE,
  TR_PIECES_SECTION_ID,
  trOrderConfirmationPath,
  trProductsPath,
  trSearchPath,
  trPanelCustomersPath,
  trPanelDiscountsPath,
  trPanelEditProductPath,
  trPanelNewProductPath,
  trPanelOrdersPath,
  trPanelPath,
  trPanelProductsPath,
  trPanelSettingsPath,
  trPanelOriginalsPath,
  trPanelStockPath,
  trPanelTakimNewProductPath,
  trProductPath,
} from "@/lib/tr/paths";

export { formatTryFromKurus, parseTryToKurus } from "@/types/tr-marketplace";

export { getTrUserFirstName } from "@/lib/tr/userDisplayName";

export {
  HERO_OUTFIT_PUBLIC_BASE,
  OUTFIT_FRAME_HEIGHT,
  OUTFIT_FRAME_WIDTH,
  OUTFIT_LANDMARKS,
  OUTFIT_ROLE_PLACEMENTS,
  heroOutfitPublicPath,
  listHeroSlotPublicPaths,
  normalizeOutfitCutout,
  rewriteHeroSlotPiecesFromDisk,
  writeNormalizedHeroSlot,
} from "@/lib/tr/outfitFrame";
export type {
  OutfitAnchorEdge,
  OutfitFrameRole,
  OutfitRolePlacement,
} from "@/lib/tr/outfitFrame";
