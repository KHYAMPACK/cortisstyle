/** Swappable AI model / try-on backends. */
export type TrAiModelProviderId = "stub" | "fashn" | "fal" | "replicate" | "custom";

/** Pose / framing hints for generation. */
export type TrAiModelPose =
  | "standing-front"
  | "standing-three-quarter"
  | "full-body"
  | "waist-up";

export type TrAiModelJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "not_configured";

export type TrAiModelGender = "woman" | "man";

/**
 * Boutique "house model" — typically the owner, captured once in-shop.
 * Reference images stay private to generation; not public storefront assets.
 * Add rows manually in the registry — no owner upload UI.
 */
export interface TrAiModelIdentity {
  boutiqueSlug: string;
  displayName: string;
  gender?: TrAiModelGender;
  /** Full-body / three-quarter reference URLs (studio or phone). */
  referenceImageUrls: string[];
  /** Optional face-close refs for identity lock. */
  faceReferenceUrls?: string[];
  defaultPose?: TrAiModelPose;
  notes?: string;
}

/** Platform studio model (Ayla / Deniz) or boutique house model. */
export interface TrAiModelOption {
  id: string;
  label: string;
  hint: string;
  ready: boolean;
  kind: "boutique" | "studio";
  gender?: TrAiModelGender;
  referenceImageUrls: string[];
  faceReferenceUrls: string[];
  defaultPose?: TrAiModelPose;
}

/** Garment input — prefer marketplace cutout / packshot when available. */
export interface TrAiModelGarmentInput {
  productId?: string;
  title?: string;
  /** BG-removed / packshot catalog image (preferred). */
  cutoutImageUrl: string;
  /** Original flat-lay fallback. */
  originalImageUrl?: string;
  category?: string | null;
}

export interface TrAiModelGenerateRequest {
  boutiqueSlug: string;
  garment: TrAiModelGarmentInput;
  pose?: TrAiModelPose;
  /** Force a provider; otherwise env / default stub. */
  providerId?: TrAiModelProviderId;
  /**
   * Model picker id: `boutique:{slug}` or `studio:ayla` / `studio:deniz`.
   * When omitted, falls back to boutique house model for boutiqueSlug.
   */
  modelId?: string;
  /**
   * Optional try-on styling prompt. Providers default to NATURAL_TRYON_PROMPT
   * (product-first Zara lookbook) when omitted.
   */
  prompt?: string;
  /** Storage context for re-hosting FASHN CDN outputs. */
  userId?: string;
  boutiqueId?: string;
}

export interface TrAiModelGenerateResult {
  status: TrAiModelJobStatus;
  providerId: TrAiModelProviderId;
  /** Public or storage URL when succeeded. */
  imageUrl?: string;
  jobId?: string;
  creditsUsed?: number | null;
  error?: string;
  /** True when this is a scaffold response (no real provider call). */
  stub?: boolean;
}
