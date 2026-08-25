import {
  COLOR_GROUP_MANUAL_MAX,
  clearColorGroupFeatures,
  colorGroupIdOf,
  colorSiblingIdsOf,
  sanitizeColorGroupId,
  withColorGroupFeatures,
} from "@/lib/tr/catalog/colorSiblings";
import {
  hasLifestyleModelRecord,
  withCopiedLifestyleModelRecord,
} from "@/lib/tr/catalog/productFeatures";
import {
  getProductByIdAdmin,
  listProductsByIdsAdmin,
  updateProductAdmin,
} from "@/lib/tr/catalog/products";
import type { TrProduct } from "@/types/tr-marketplace";

export class ColorGroupSyncError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ColorGroupSyncError";
    this.status = status;
  }
}

function newColorGroupId(): string {
  return crypto.randomUUID();
}

function lifestyleModelSourceFeatures(
  members: TrProduct[],
): TrProduct["features"] | null {
  const withPhotos = members.find(
    (row) =>
      hasLifestyleModelRecord(row.features) &&
      row.lifestyleImages.some((url) => Boolean(url?.trim())),
  );
  if (withPhotos) return withPhotos.features;
  return (
    members.find((row) => hasLifestyleModelRecord(row.features))?.features ??
    null
  );
}

function featuresWithSharedModelRecord(
  features: TrProduct["features"],
  source: TrProduct["features"] | null,
): TrProduct["features"] {
  if (!source) return features;
  return withCopiedLifestyleModelRecord(features, source);
}

/** Copy the original color's AI model kaydı onto siblings that are missing it. */
export async function ensureColorSiblingLifestyleModelRecord(
  product: TrProduct,
): Promise<TrProduct> {
  const ids = colorSiblingIdsOf(product);
  if (ids.length < 2) return product;
  const siblings = await listProductsByIdsAdmin(ids);
  const group = siblings.filter((row) => row.boutiqueId === product.boutiqueId);
  const source = lifestyleModelSourceFeatures(group);
  if (!source) return product;

  let current = product;
  for (const member of group) {
    if (hasLifestyleModelRecord(member.features)) {
      if (member.id === product.id) current = member;
      continue;
    }
    const updated = await updateProductAdmin(member.id, {
      features: withCopiedLifestyleModelRecord(member.features, source),
    });
    if (updated.id === product.id) current = updated;
  }
  return current;
}

/**
 * Set the full member list of a color group. Anchor is the product being
 * edited. Other members must not already belong to a different group.
 */
export async function syncColorGroupMembers(input: {
  boutiqueId: string;
  anchorProductId: string;
  productIds: string[];
}): Promise<{ products: TrProduct[]; colorGroupId: string | null }> {
  const uniqueIds = [
    ...new Set(input.productIds.map((id) => id.trim()).filter(Boolean)),
  ];
  if (!uniqueIds.includes(input.anchorProductId)) {
    uniqueIds.unshift(input.anchorProductId);
  }
  if (uniqueIds.length > COLOR_GROUP_MANUAL_MAX) {
    throw new ColorGroupSyncError(
      `En fazla ${COLOR_GROUP_MANUAL_MAX} renk bağlanabilir.`,
    );
  }

  const members = await listProductsByIdsAdmin(uniqueIds);
  if (members.length !== uniqueIds.length) {
    throw new ColorGroupSyncError("Bazı ürünler bulunamadı.", 404);
  }
  for (const product of members) {
    if (product.boutiqueId !== input.boutiqueId) {
      throw new ColorGroupSyncError("Bu butik için yetkiniz yok.", 403);
    }
  }

  const anchor =
    members.find((product) => product.id === input.anchorProductId) ??
    (await getProductByIdAdmin(input.anchorProductId));
  if (!anchor || anchor.boutiqueId !== input.boutiqueId) {
    throw new ColorGroupSyncError("Ürün bulunamadı.", 404);
  }

  const previousIds = colorSiblingIdsOf(anchor);
  const previousGroupId = colorGroupIdOf(anchor);

  if (uniqueIds.length < 2) {
    const toClear = new Set([anchor.id, ...previousIds]);
    const leftovers = await listProductsByIdsAdmin([...toClear]);
    const updated: TrProduct[] = [];
    for (const product of leftovers) {
      if (product.boutiqueId !== input.boutiqueId) continue;
      if (
        previousGroupId &&
        colorGroupIdOf(product) &&
        colorGroupIdOf(product) !== previousGroupId
      ) {
        continue;
      }
      updated.push(
        await updateProductAdmin(product.id, {
          features: clearColorGroupFeatures(product.features),
        }),
      );
    }
    return { products: updated, colorGroupId: null };
  }

  const anchorGroup = previousGroupId;
  for (const product of members) {
    if (product.id === input.anchorProductId) continue;
    const otherGroup = colorGroupIdOf(product);
    if (otherGroup && otherGroup !== anchorGroup) {
      throw new ColorGroupSyncError(
        `"${product.title}" başka bir renk grubunda. Önce o üründen bağlantıyı kaldırın.`,
      );
    }
  }

  const groupId = sanitizeColorGroupId(anchorGroup) ?? newColorGroupId();
  const siblingIds = uniqueIds;

  const leaverIds = previousIds.filter((id) => !siblingIds.includes(id));
  const leavers = leaverIds.length
    ? await listProductsByIdsAdmin(leaverIds)
    : [];

  const modelSource = lifestyleModelSourceFeatures(members);
  const updated: TrProduct[] = [];
  for (const product of members) {
    updated.push(
      await updateProductAdmin(product.id, {
        features: featuresWithSharedModelRecord(
          withColorGroupFeatures(product.features, groupId, siblingIds),
          modelSource,
        ),
      }),
    );
  }
  for (const product of leavers) {
    if (product.boutiqueId !== input.boutiqueId) continue;
    if (colorGroupIdOf(product) !== previousGroupId) continue;
    updated.push(
      await updateProductAdmin(product.id, {
        features: clearColorGroupFeatures(product.features),
      }),
    );
  }

  return { products: updated, colorGroupId: groupId };
}
