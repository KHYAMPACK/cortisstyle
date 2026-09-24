export {
  isLookbookPieceImage,
  resolveTrProductImages,
  withLookbookPieceImages,
  TR_LOOKBOOK_PIECE_IMAGES,
} from "@/data/tr/lookbookPieceImages";

import { withLookbookPieceImages } from "@/data/tr/lookbookPieceImages";

/** Apply lookbook cutouts across a product list (public TR surfaces). */
export function mapProductsWithLookbookImages<
  T extends { id: string; images: string[]; marketplaceImages?: string[] },
>(products: T[]): T[] {
  return products.map((product) => withLookbookPieceImages(product));
}
