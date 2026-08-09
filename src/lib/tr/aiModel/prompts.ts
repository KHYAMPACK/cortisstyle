/**
 * Locked prompts for platform studio models + try-on (Zara / product-first).
 */

/** Default try-on prompt — garment is the hero. */
export const NATURAL_TRYON_PROMPT =
  "Zara e-commerce lookbook. Keep the model natural and understated so the garment is the focus. True fabric color, texture, and fit from the product image. Soft diffused studio light, plain light backdrop, photoreal skin and cloth, clean sharp product detail. No beauty retouching, no plastic skin, no heavy makeup, no dramatic pose, no busy background.";

/** Ops: generate Ayla reference via FASHN model-create. */
export const STUDIO_AYLA_MODEL_CREATE_PROMPT =
  "Full-body fashion e-commerce photo, Zara catalog style. Young woman, slender, natural no-makeup look, short brown bob, relaxed neutral expression. Plain off-white studio backdrop, soft diffused front-left light, subtle realistic shadow. Simple fitted black short-sleeve top and high-waisted dark wide-leg trousers, one hand in pocket, calm standing pose facing camera. Photoreal skin texture, natural fabric folds, sharp product detail, quiet luxury, not CGI, not airbrushed, not beauty campaign.";

/** Ops: generate Deniz reference via FASHN model-create. */
export const STUDIO_DENIZ_MODEL_CREATE_PROMPT =
  "Full-body fashion e-commerce photo, Zara catalog style. Young man, slender athletic build, natural grooming, short neat hair, relaxed neutral expression. Plain off-white studio backdrop, soft diffused front-left light, subtle realistic shadow. Simple fitted black crewneck tee and dark tailored trousers, calm standing pose facing camera, arms relaxed. Photoreal skin texture, natural fabric folds, sharp product detail, quiet luxury, not CGI, not airbrushed, not beauty campaign.";

export const STUDIO_MODEL_CREATE_ASPECT_RATIO = "3:4";

/** Public path filenames under /tr/ai-models/ */
export const STUDIO_AYLA_PUBLIC_PATH = "/tr/ai-models/studio-ayla.jpg";
export const STUDIO_DENIZ_PUBLIC_PATH = "/tr/ai-models/studio-deniz.jpg";
