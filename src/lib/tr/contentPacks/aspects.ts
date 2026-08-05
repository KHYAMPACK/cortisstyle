import type {
  TrContentPackAspectId,
  TrContentPackAspectPreset,
  TrContentPackFormat,
} from "@/lib/tr/contentPacks/types";

/** IG still presets — foundation packs export crops via recipes, not server-side resize. */
export const TR_CONTENT_PACK_ASPECTS: readonly TrContentPackAspectPreset[] = [
  {
    id: "feed-square",
    label: "Feed 1:1",
    width: 1080,
    height: 1080,
    aspectRatio: "1 / 1",
    platformHint: "Instagram feed",
  },
  {
    id: "feed-portrait",
    label: "Feed 4:5",
    width: 1080,
    height: 1350,
    aspectRatio: "4 / 5",
    platformHint: "Instagram feed (önerilen)",
  },
  {
    id: "story-reel",
    label: "Story / Reel 9:16",
    width: 1080,
    height: 1920,
    aspectRatio: "9 / 16",
    platformHint: "Story veya Reel kapağı",
  },
] as const;

export function getContentPackAspect(
  id: TrContentPackAspectId,
): TrContentPackAspectPreset {
  const preset = TR_CONTENT_PACK_ASPECTS.find((entry) => entry.id === id);
  if (!preset) {
    throw new Error(`Unknown content pack aspect: ${id}`);
  }
  return preset;
}

/**
 * Map each variant onto all IG aspects (same source URL; crop in-app / on IG).
 * Uses the first N variants cycling if fewer than aspects × variants needed.
 */
export function buildContentPackFormats(
  variantImageUrls: string[],
): TrContentPackFormat[] {
  const urls = variantImageUrls.map((url) => url.trim()).filter(Boolean);
  if (urls.length === 0) return [];

  return TR_CONTENT_PACK_ASPECTS.map((preset, index) => {
    const imageUrl = urls[index % urls.length]!;
    return {
      aspectId: preset.id,
      imageUrl,
      aspectRatio: preset.aspectRatio,
      width: preset.width,
      height: preset.height,
    };
  });
}
