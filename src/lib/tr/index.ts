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
  trBoutiquePath,
  trBoutiqueProductPath,
  trCartPath,
  trOrderConfirmationPath,
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
  trProductPath,
} from "@/lib/tr/paths";

export { formatTryFromKurus, parseTryToKurus } from "@/types/tr-marketplace";

export { getTrUserFirstName } from "@/lib/tr/userDisplayName";
