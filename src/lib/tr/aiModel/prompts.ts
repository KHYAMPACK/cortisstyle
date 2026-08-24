/**
 * Locked prompts for platform studio models + try-on (Zara / product-first).
 *
 * Lighting and pose come from the model plate. Do not restage the room
 * (Lila plates bake blinds / flash). Never invent pockets.
 */

import type { TrAiModelPose } from "@/lib/tr/aiModel/types";

const ROOM_AND_PRODUCT =
  "Keep the model photo's pose, crop, lighting, and background exactly — do not restage the room or change the photography style. Keep the model natural and understated so the garment is the focus. True fabric color, texture, cut, and length from the product image only — do not invent pockets, hand-in-pocket poses, extra buttons, slits, belts, or other details not visible on the product. Photoreal skin and cloth, clean sharp product detail. No beauty retouching, no plastic skin, no heavy makeup. FOOTWEAR LOCK: the model wears closed-toe black fashion pumps/heels from the reference plate. Shoes stay on both feet. Never barefoot, never socks only, never crop the shoes off. If the garment hem ends above the floor, shoes must be fully visible; if maxi/floor length, shoe tips and heels still peek — still never barefoot. Do not replace the shoes with the product.";

/** Default try-on prompt — front view, garment is the hero. */
export const NATURAL_TRYON_PROMPT = `${ROOM_AND_PRODUCT} Keep the plate's pose and arm positions. Calm neutral expression, no dramatic gesture.`;

/** Back try-on — model turned away; use with back packshot as product_image. */
export const NATURAL_TRYON_PROMPT_BACK = `${ROOM_AND_PRODUCT} Full rear view: the model is turned away from the camera so we clearly see the back of the garment. Head may turn slightly; arms relaxed at the sides. Do not invent rear pockets, vents, or hardware missing from the product image.`;

export function tryOnPromptForPose(pose?: TrAiModelPose | null): string {
  if (pose === "standing-back") return NATURAL_TRYON_PROMPT_BACK;
  return NATURAL_TRYON_PROMPT;
}

/** Prompt notes if regenerating Ayla in Cursor (not FASHN). */
export const STUDIO_AYLA_MODEL_CREATE_PROMPT =
  "Full-body fashion e-commerce photo, Zara catalog style. Young woman, slender, natural no-makeup look, short brown bob, relaxed neutral expression. Standing in a very simple room: plain light off-white wall, clean matte floor, soft natural side light, subtle realistic shadow — not an infinite void. Simple fitted black short-sleeve top and high-waisted dark wide-leg trousers. Closed-toe black pointed pumps, never barefoot. Calm elegant standing pose facing camera, arms relaxed at her sides, no hands in pockets. Photoreal skin texture, natural fabric folds, sharp product detail, quiet luxury, not CGI, not airbrushed, not beauty campaign.";

/** Prompt notes if regenerating Deniz in Cursor (not FASHN). */
export const STUDIO_DENIZ_MODEL_CREATE_PROMPT =
  "Full-body fashion e-commerce photo, Zara catalog style. Young man, slender athletic build, natural grooming, short neat hair, relaxed neutral expression. Standing in a very simple room: plain light off-white wall, clean matte floor, soft natural side light, subtle realistic shadow — not an infinite void. Simple fitted black crewneck tee and dark tailored trousers. Closed-toe black leather shoes, never barefoot. Calm elegant standing pose facing camera, arms relaxed at his sides or lightly behind his back, no hands in pockets. Photoreal skin texture, natural fabric folds, sharp product detail, quiet luxury, not CGI, not airbrushed, not beauty campaign.";

/** Prompt notes if regenerating Selin in Cursor (not FASHN). */
export const STUDIO_SELIN_MODEL_CREATE_PROMPT =
  "Full-body fashion e-commerce photo, Zara catalog style. Young woman, slender elegant build, fair complexion, long straight dark brown hair parted in the middle, calm poised closed-mouth expression looking at camera. Standing square to the camera in a bright minimalist studio corner: plain white walls, light grey wood plank floor, even soft studio light. Simple fitted black short-sleeve crew-neck t-shirt tucked into high-waisted dark wide-leg trousers. Closed-toe black pointed pumps clearly visible, never barefoot. No jewelry, no evening gown. Arms relaxed at her sides, no hand on hip, no extraordinary pose. Photoreal skin texture, natural fabric folds, sharp product detail, quiet luxury, not CGI, not airbrushed, not beauty campaign.";

export const STUDIO_MODEL_CREATE_ASPECT_RATIO = "3:4";

/** Public path filenames under /tr/ai-models/ */
export const STUDIO_AYLA_PUBLIC_PATH = "/tr/ai-models/studio-ayla.jpg";
export const STUDIO_DENIZ_PUBLIC_PATH = "/tr/ai-models/studio-deniz.jpg";
export const STUDIO_SELIN_PUBLIC_PATH = "/tr/ai-models/studio-selin.jpg";

/** Elbise try-on plates — light-grey seamless studio, pinned poses. */
export const STUDIO_AYLA_THREE_QUARTER_PATH =
  "/tr/ai-models/studio-ayla-three-quarter.jpg";
export const STUDIO_AYLA_BACK_PATH = "/tr/ai-models/studio-ayla-back.jpg";
export const STUDIO_SELIN_THREE_QUARTER_PATH =
  "/tr/ai-models/studio-selin-three-quarter.jpg";
export const STUDIO_SELIN_BACK_PATH = "/tr/ai-models/studio-selin-back.jpg";
export const LILA_STUDIO_THREE_QUARTER_PATH =
  "/tr/ai-models/lilabutik-lila-studio-three-quarter.jpg";
export const LILA_STUDIO_BACK_PATH =
  "/tr/ai-models/lilabutik-lila-studio-back.jpg";
