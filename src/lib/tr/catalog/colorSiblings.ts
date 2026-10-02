import { DEFAULT_COLOR_PRESETS } from "@/lib/tr/catalog/productOptions";
import { getProductCoverImageFor } from "@/lib/tr/catalog/productImages";
import type {
  TrProduct,
  TrProductColor,
  TrProductFeatures,
} from "@/types/tr-marketplace";

/** Manual editor linking. */
export const COLOR_GROUP_MANUAL_MAX = 6;

export const COLOR_GROUP_NEUTRAL_HEX = "#C4C0B8";

const COLOR_NAME_ALIASES: Record<string, string> = {
  siyah: "#1A1A1A",
  beyaz: "#F5F5F5",
  ekru: "#F3EDE3",
  krem: "#F3EDE3",
  lacivert: "#1E3A5F",
  mavi: "#3B6FA0",
  acikmavi: "#8BB4D4",
  kahverengi: "#6B4423",
  vizon: "#8B7355",
  bej: "#D4C4A8",
  kirmizi: "#B71C1C",
  kırmızı: "#B71C1C",
  pembe: "#C2185B",
  yesil: "#2E5A3C",
  yeşil: "#2E5A3C",
  haki: "#5C6B3A",
  gri: "#8A8680",
  antrasit: "#3A3A3A",
  mor: "#5C3D6E",
  sari: "#C9A227",
  sarı: "#C9A227",
  turuncu: "#C45C26",
  bordo: "#6E1F2A",
};

export function sanitizeColorGroupId(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim();
  if (!id || id.length > 80) return undefined;
  if (!/^[a-z0-9-]{8,80}$/i.test(id)) return undefined;
  return id;
}

export function sanitizeColorSiblingIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const ids = [
    ...new Set(
      raw.flatMap((entry) => {
        const id = typeof entry === "string" ? entry.trim() : "";
        return id && id.length <= 80 ? [id] : [];
      }),
    ),
  ].slice(0, COLOR_GROUP_MANUAL_MAX);
  return ids.length >= 2 ? ids : undefined;
}

export function colorGroupIdOf(
  product: Pick<TrProduct, "features"> | { features?: TrProductFeatures | null },
): string | undefined {
  return sanitizeColorGroupId(product.features?.colorGroupId);
}

export function colorSiblingIdsOf(
  product: Pick<TrProduct, "features"> | { features?: TrProductFeatures | null },
): string[] {
  return sanitizeColorSiblingIds(product.features?.colorSiblingIds) ?? [];
}

export function hasColorGroup(
  product: Pick<TrProduct, "features"> | { features?: TrProductFeatures | null },
): boolean {
  return colorSiblingIdsOf(product).length >= 2;
}

export function withColorGroupFeatures(
  features: TrProductFeatures | null | undefined,
  groupId: string,
  siblingIds: string[],
): TrProductFeatures {
  const next: TrProductFeatures = { ...(features ?? {}) };
  const id = sanitizeColorGroupId(groupId);
  const ids = sanitizeColorSiblingIds(siblingIds);
  if (!id || !ids) {
    delete next.colorGroupId;
    delete next.colorSiblingIds;
    return next;
  }
  next.colorGroupId = id;
  next.colorSiblingIds = ids;
  return next;
}

export function clearColorGroupFeatures(
  features: TrProductFeatures | null | undefined,
): TrProductFeatures {
  const next: TrProductFeatures = { ...(features ?? {}) };
  delete next.colorGroupId;
  delete next.colorSiblingIds;
  return next;
}

function foldTurkishColorKey(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, "")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function hexFromTurkishColorName(name: string): string {
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (!trimmed) return COLOR_GROUP_NEUTRAL_HEX;
  const folded = foldTurkishColorKey(trimmed);
  const preset = DEFAULT_COLOR_PRESETS.find(
    (entry) => foldTurkishColorKey(entry.name) === folded,
  );
  if (preset) return preset.hex;
  if (COLOR_NAME_ALIASES[folded]) return COLOR_NAME_ALIASES[folded]!;
  const aliasHit = Object.entries(COLOR_NAME_ALIASES).find(([key]) =>
    folded.includes(key),
  );
  if (aliasHit) return aliasHit[1];
  const presetHit = DEFAULT_COLOR_PRESETS.find((entry) =>
    folded.includes(foldTurkishColorKey(entry.name)),
  );
  if (presetHit) return presetHit.hex;
  return COLOR_GROUP_NEUTRAL_HEX;
}

export function colorSwatchFromName(name: string): TrProductColor {
  const trimmed = name.replace(/\s+/g, " ").trim() || "Renk";
  return { name: trimmed, hex: hexFromTurkishColorName(trimmed) };
}

export function resolveColorSiblings<T extends Pick<TrProduct, "id" | "features">>(
  product: T,
  catalog: T[],
): T[] {
  const ids = colorSiblingIdsOf(product);
  if (ids.length < 2) return [];
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const ordered = ids
    .map((id) => (id === product.id ? product : byId.get(id)))
    .filter((entry): entry is T => Boolean(entry));
  if (ordered.length < 2) return [];
  return ordered;
}

export function colorSiblingCoverUrl(
  product: Pick<
    TrProduct,
    "images" | "marketplaceImages" | "lifestyleImages" | "features"
  >,
  surface: "boutique" | "marketplace" = "boutique",
): string | null {
  return getProductCoverImageFor(surface, product);
}

export function excludeColorSiblingIds(
  product: Pick<TrProduct, "id" | "features">,
): string[] {
  const ids = colorSiblingIdsOf(product);
  if (ids.length >= 2) return ids;
  return [product.id];
}

