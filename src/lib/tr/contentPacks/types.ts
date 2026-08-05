/** Instagram-ready content pack for boutique sell-enablement. */

export type TrContentPackStatus = "queued" | "ready" | "failed";

/** Aspect presets for IG feed / story / reels stills (not video). */
export type TrContentPackAspectId =
  | "feed-square"
  | "feed-portrait"
  | "story-reel";

export interface TrContentPackAspectPreset {
  id: TrContentPackAspectId;
  label: string;
  width: number;
  height: number;
  /** CSS aspect-ratio value, e.g. "1 / 1". */
  aspectRatio: string;
  platformHint: string;
}

/**
 * One export slot in a pack. Image is the source URL;
 * crop to aspect in Instagram (or preview via object-fit).
 */
export interface TrContentPackFormat {
  aspectId: TrContentPackAspectId;
  imageUrl: string;
  aspectRatio: string;
  width: number;
  height: number;
}

export interface TrContentPack {
  id: string;
  boutiqueId: string;
  productId: string;
  status: TrContentPackStatus;
  variantImageUrls: string[];
  formats: TrContentPackFormat[];
  caption: string;
  deepLink: string;
  /** True when at least one variant came from AI on-model generation. */
  usedAiLifestyle: boolean;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrContentPackCaptionInput {
  title: string;
  boutiqueName: string;
  priceLabel: string;
  deepLink: string;
  category?: string | null;
}

export interface BuildTrContentPackPayloadInput {
  boutiqueId: string;
  productId: string;
  boutiqueSlug: string;
  boutiqueName: string;
  productTitle: string;
  priceKurus: number;
  category?: string | null;
  variantImageUrls: string[];
  usedAiLifestyle: boolean;
  /** Optional stable campaign id for UTMs (defaults to product id). */
  campaignKey?: string;
  status?: TrContentPackStatus;
  error?: string | null;
}

export interface CreateTrContentPackInput {
  boutiqueId: string;
  productId: string;
  status: TrContentPackStatus;
  variantImageUrls: string[];
  formats: TrContentPackFormat[];
  caption: string;
  deepLink: string;
  usedAiLifestyle: boolean;
  error?: string | null;
}
