/** Fashion module's typed view of `TrProduct.features` — garment vocabulary only. */

export type TrTakimSetItem = {
  family: "elbise" | "ust-giyim" | "alt-giyim";
  category: string | null;
  chips: {
    neckline?: string | null;
    sleeves?: string | null;
    fit?: string | null;
    length?: string | null;
    decollete?: string | null;
    rise?: string | null;
    hem?: string | null;
  };
};

export type TrFashionProductFeatures = {
  gender?: string;
  fit?: string;
  color?: string;
  neckHem?: string;
  fabric?: string;
  composition?: string;
  /** Elbise chips — stored as Turkish labels. */
  neckline?: string;
  sleeves?: string;
  length?: string;
  decollete?: string;
  /** Alt giyim bel — Yüksek bel / Normal bel / Düşük bel. */
  rise?: string;
  /** Visible ornament for bottoms titles — e.g. İnci işlemeli. Omit when none. */
  ornament?: string;
  zipper?: string;
  stretch?: string;
  silhouette?: string;
  /**
   * Last AI try-on model (`studio:selin`, `boutique:lilabutik`, …).
   * Owner-only — not a PDP feature row.
   */
  aiModelId?: string;
  /**
   * Model id per lifestyle shot (same order as `lifestyleImages`).
   * “Bu kareyi yenile” uses this slot — not the picker default.
   */
  lifestyleModelIds?: string[];
  /**
   * Two-piece set upload. Shop leaf is always `takim`.
   * Item chips live on `setItems` — not the construction slot-3 packshot path.
   */
  uploadKind?: "takim";
  setItems?: TrTakimSetItem[];
  /**
   * Owner bypassed Gemini / FASHN / Photoroom. Photos in `images` are
   * shopper-facing. Can combine with `uploadKind: "takim"`.
   */
  manualListing?: boolean;
  /**
   * Linked color SKUs (one product per color). Same id on every sibling.
   * Restyle / slot-3 still belong to this product only.
   */
  colorGroupId?: string;
  /** All product ids in the color group, including self. */
  colorSiblingIds?: string[];
};
