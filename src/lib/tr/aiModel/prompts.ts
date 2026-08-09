/**
 * Locked prompts for platform studio models + try-on (Zara / product-first).
 *
 * Room + pose rules (from Zara lookbook refs):
 * - Simple interior: light wall + visible floor, soft side light — not an infinite void.
 * - Elegant standing pose; arms relaxed or lightly behind back — never invent pockets/hands-in-pockets.
 * - Preserve garment exactly; do not add pockets, slits, buttons, or trim not in the product image.
 */

import type { TrAiModelPose } from "@/lib/tr/aiModel/types";

const ROOM_AND_PRODUCT =
  "Zara e-commerce lookbook in a very simple room: plain light off-white wall and a clean matte floor meeting at a clear baseboard line, soft natural side light, gentle realistic shadow. Keep the model natural and understated so the garment is the focus. True fabric color, texture, cut, and length from the product image only — do not invent pockets, hand-in-pocket poses, extra buttons, slits, belts, or other details not visible on the product. Photoreal skin and cloth, clean sharp product detail. No beauty retouching, no plastic skin, no heavy makeup, no busy background, no infinite empty void backdrop.";

/** Default try-on prompt — front view, garment is the hero. */
export const NATURAL_TRYON_PROMPT = `${ROOM_AND_PRODUCT} Simple elegant standing pose facing the camera, arms relaxed at the sides or lightly behind the back, calm neutral expression, no dramatic gesture.`;

/** Back try-on — model turned away; use with back packshot as product_image. */
export const NATURAL_TRYON_PROMPT_BACK = `${ROOM_AND_PRODUCT} Full rear view: the model is turned away from the camera so we clearly see the back of the garment. Head may turn slightly; arms relaxed at the sides. Do not invent rear pockets, vents, or hardware missing from the product image.`;

export function tryOnPromptForPose(pose?: TrAiModelPose | null): string {
  if (pose === "standing-back") return NATURAL_TRYON_PROMPT_BACK;
  return NATURAL_TRYON_PROMPT;
}

/** Ops: generate Ayla reference via FASHN model-create. */
export const STUDIO_AYLA_MODEL_CREATE_PROMPT =
  "Full-body fashion e-commerce photo, Zara catalog style. Young woman, slender, natural no-makeup look, short brown bob, relaxed neutral expression. Standing in a very simple room: plain light off-white wall, clean matte floor, soft natural side light, subtle realistic shadow — not an infinite void. Simple fitted black short-sleeve top and high-waisted dark wide-leg trousers. Calm elegant standing pose facing camera, arms relaxed at her sides, no hands in pockets. Photoreal skin texture, natural fabric folds, sharp product detail, quiet luxury, not CGI, not airbrushed, not beauty campaign.";

/** Ops: generate Deniz reference via FASHN model-create. */
export const STUDIO_DENIZ_MODEL_CREATE_PROMPT =
  "Full-body fashion e-commerce photo, Zara catalog style. Young man, slender athletic build, natural grooming, short neat hair, relaxed neutral expression. Standing in a very simple room: plain light off-white wall, clean matte floor, soft natural side light, subtle realistic shadow — not an infinite void. Simple fitted black crewneck tee and dark tailored trousers. Calm elegant standing pose facing camera, arms relaxed at his sides or lightly behind his back, no hands in pockets. Photoreal skin texture, natural fabric folds, sharp product detail, quiet luxury, not CGI, not airbrushed, not beauty campaign.";

export const STUDIO_MODEL_CREATE_ASPECT_RATIO = "3:4";

/** Public path filenames under /tr/ai-models/ */
export const STUDIO_AYLA_PUBLIC_PATH = "/tr/ai-models/studio-ayla.jpg";
export const STUDIO_DENIZ_PUBLIC_PATH = "/tr/ai-models/studio-deniz.jpg";
