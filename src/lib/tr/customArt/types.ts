/** Custom-art module's typed view of `TrProduct.features` — print-on-demand only. */

export type TrCustomArtProductFeatures = {
  /** Per canvas size price (kuruş). Keys match `sizes`. */
  sizePricesKurus?: Record<string, number>;
  /** Skip stock checks and inventory decrement. */
  madeToOrder?: boolean;
};
