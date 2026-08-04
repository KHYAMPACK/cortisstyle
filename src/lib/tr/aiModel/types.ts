/** Swappable AI model / try-on backends. */
export type TrAiModelProviderId = "stub" | "fal" | "replicate" | "custom";

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

/**
 * Boutique "house model" — typically the owner, captured once in-shop.
 * Reference images stay private to generation; not public storefront assets.
 */
export interface TrAiModelIdentity {
  boutiqueSlug: string;
  displayName: string;
  /** Full-body / three-quarter reference URLs (studio or phone). */
  referenceImageUrls: string[];
  /** Optional face-close refs for identity lock. */
  faceReferenceUrls?: string[];
  defaultPose?: TrAiModelPose;
  notes?: string;
}

/** Garment input — prefer marketplace cutout when available. */
export interface TrAiModelGarmentInput {
  productId?: string;
  title?: string;
  /** BG-removed / normalized catalog cutout (preferred). */
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
}

export interface TrAiModelGenerateResult {
  status: TrAiModelJobStatus;
  providerId: TrAiModelProviderId;
  /** Public or storage URL when succeeded. */
  imageUrl?: string;
  jobId?: string;
  error?: string;
  /** True when this is a scaffold response (no real provider call). */
  stub?: boolean;
}
