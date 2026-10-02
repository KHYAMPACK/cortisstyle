import { ALL_NUMERIC_SIZES, DEFAULT_LETTER_SIZES } from "@/lib/tr/catalog/productOptions";
import { shopperGalleryUrls } from "@/lib/tr/catalog/productImages";
import { withManualListing } from "@/lib/tr/catalog/productFeatures";
import { TR_OWNER_PRODUCT_LIMITS } from "@/lib/tr/ownerProductConstraints";
import type { TrProductFeatures } from "@/types/tr-marketplace";

/**
 * F6: a boutique's sizes and colour groups become variants. Pure: the generator script
 * (`scripts/f6-size-variants.mts`) reads a snapshot of the boutique, calls `planSizeMigration`
 * and turns the plan into SQL (`sizeMigrationSql`) that Mert applies by hand.
 *
 * - Every product with sizes becomes a Gelişmiş ürün with a size option (Beden for
 *   letter sizes, Pantolon bedeni for numbers) and one variant per size, holding that
 *   size's stock.
 * - A colour group the answers say to merge becomes one product: the oldest member
 *   survives (its address stays), a Renk option is added, and there is one variant per
 *   colour × size that existed. Each colour's photos become its variants' photos and
 *   the survivor's gallery is all of them, as a plain photo list.
 * - The other members are hidden, not deleted, and point at the survivor (`merged_into`).
 * - `sizes` stays as it was (the shop's size filter reads it); `size_stocks` is emptied,
 *   since the stock now lives on the variants.
 */

export interface MigrationProduct {
  id: string;
  title: string;
  description: string | null;
  descriptionHtml: string | null;
  status: string;
  createdAt: string;
  productType: string;
  stock: number;
  sizes: string[];
  sizeStocks: Record<string, number>;
  features: TrProductFeatures;
  images: string[];
  marketplaceImages: string[];
  lifestyleImages: string[];
}

export interface MigrationGroupAnswer {
  /** Merge the group into one product; `false` keeps its members apart. */
  merge: boolean;
  /** The product that survives; default the oldest. */
  survivorId?: string;
  /** The merged product's title, without a colour word. */
  title?: string;
  /** Whose description the merged product keeps; default the survivor's. */
  descriptionFrom?: string;
}

export interface MigrationAnswers {
  /** Colour per product id, for members without `features.color` (or to correct it). */
  colors?: Record<string, string>;
  /** Per colour group id. Every group with two or more members needs an answer. */
  groups?: Record<string, MigrationGroupAnswer>;
}

export interface PlannedTypeValue {
  id: string;
  label: string;
  sortOrder: number;
}

export interface PlannedType {
  id: string;
  name: string;
  role: "size" | "color";
  sortOrder: number;
  values: PlannedTypeValue[];
}

export interface PlannedVariant {
  id: string;
  optionValueIds: string[];
  stock: number;
  images: string[];
  sortOrder: number;
  /** "Kırmızı / M", for the report. */
  label: string;
}

export interface PlannedProduct {
  productId: string;
  typeIds: string[];
  variants: PlannedVariant[];
  /** Sum of the variants' stock (all active). */
  stock: number;
  /** `sizes` after the migration: for a merged product, every member's sizes. */
  sizes: string[];
  /** Fields a merge changes; absent for a product that only moves to variants. */
  merge?: {
    memberIds: string[];
    title: string;
    description: string | null;
    descriptionHtml: string | null;
    images: string[];
    features: TrProductFeatures;
  };
  /** The product's own features without its colour group, when it had one. */
  features?: TrProductFeatures;
}

export interface PlannedMerge {
  productId: string;
  intoId: string;
  /** The colour it became (`features.color` is set to it). */
  color: string;
  features: TrProductFeatures;
}

export interface MigrationProblem {
  level: "block" | "warn";
  message: string;
  productId?: string;
  groupId?: string;
}

export interface SizeMigrationPlan {
  types: PlannedType[];
  products: PlannedProduct[];
  merges: PlannedMerge[];
  problems: MigrationProblem[];
  /** Products left as they are (no sizes). */
  untouched: string[];
}

const SIZE_TYPES = [
  { name: "Beden", labels: DEFAULT_LETTER_SIZES as readonly string[] },
  { name: "Pantolon bedeni", labels: ALL_NUMERIC_SIZES as readonly string[] },
] as const;

function labelKey(label: string): string {
  return label.trim().toLocaleLowerCase("tr");
}

function colorGroupOf(product: MigrationProduct): string | null {
  const id = product.features.colorGroupId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

/** Features without the colour-group link (`colorGroupId` and the sibling ids it names). */
function withoutColorGroup(features: TrProductFeatures): TrProductFeatures {
  const next = { ...features };
  delete next.colorGroupId;
  delete next.colorSiblingIds;
  return next;
}

/** The product's sizes, plus any size that only has a stock entry. */
function sizesOf(product: MigrationProduct): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (size: string) => {
    const trimmed = size.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };
  for (const size of product.sizes) push(size);
  for (const [size, stock] of Object.entries(product.sizeStocks)) {
    if (stock > 0) push(size);
  }
  return out;
}

function sizeStock(product: MigrationProduct, size: string): number {
  const value = product.sizeStocks[size];
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function sizeTypeFor(sizes: readonly string[]): (typeof SIZE_TYPES)[number] | null {
  return SIZE_TYPES.find((type) => sizes.every((size) => type.labels.includes(size))) ?? null;
}

/** The size type's planned values, in the built-in order. */
function sortSizes(type: (typeof SIZE_TYPES)[number], sizes: Iterable<string>): string[] {
  return [...new Set(sizes)].sort((a, b) => type.labels.indexOf(a) - type.labels.indexOf(b));
}

export function planSizeMigration(input: {
  products: readonly MigrationProduct[];
  answers: MigrationAnswers;
  /** The boutique's variant types today; the plan expects none. */
  existingTypeNames: readonly string[];
  newId: () => string;
}): SizeMigrationPlan {
  const { products, answers, newId } = input;
  const problems: MigrationProblem[] = [];
  const block = (message: string, at: { productId?: string; groupId?: string | null } = {}) =>
    problems.push({ level: "block", message, productId: at.productId, groupId: at.groupId ?? undefined });
  const warn = (message: string, at: { productId?: string; groupId?: string | null } = {}) =>
    problems.push({ level: "warn", message, productId: at.productId, groupId: at.groupId ?? undefined });

  if (input.existingTypeNames.length > 0) {
    block(
      `Butikte zaten varyant türü var (${input.existingTypeNames.join(", ")}); plan boş bir başlangıç bekliyor.`,
    );
  }

  const byId = new Map(products.map((product) => [product.id, product]));
  const groups = new Map<string, MigrationProduct[]>();
  for (const product of products) {
    const group = colorGroupOf(product);
    if (!group) continue;
    groups.set(group, [...(groups.get(group) ?? []), product]);
  }
  for (const members of groups.values()) {
    members.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  }

  const colorOf = (product: MigrationProduct): string | null => {
    const answered = answers.colors?.[product.id]?.trim();
    if (answered) return answered;
    const stored = product.features.color;
    return typeof stored === "string" && stored.trim() ? stored.trim() : null;
  };

  // Which groups merge, and that they can.
  const merging = new Map<string, { survivor: MigrationProduct; members: MigrationProduct[]; answer: MigrationGroupAnswer }>();
  for (const [groupId, members] of groups) {
    if (members.length < 2) continue;
    const answer = answers.groups?.[groupId];
    if (!answer) {
      block(
        `Renk grubu için karar yok: ${members.map((member) => member.title).join(" / ")}.`,
        { groupId },
      );
      continue;
    }
    if (!answer.merge) continue;
    const survivor = answer.survivorId ? byId.get(answer.survivorId) : members[0];
    if (!survivor || !members.includes(survivor)) {
      block("Kalacak ürün grubun üyesi değil.", { groupId });
      continue;
    }
    if (answer.descriptionFrom && !members.some((member) => member.id === answer.descriptionFrom)) {
      block("Açıklaması alınacak ürün grubun üyesi değil.", { groupId });
      continue;
    }
    let ok = true;
    const colors = new Map<string, string>();
    for (const member of members) {
      const color = colorOf(member);
      if (!color) {
        block(`Renk adı yok: ${member.title}.`, { groupId, productId: member.id });
        ok = false;
        continue;
      }
      const other = colors.get(labelKey(color));
      if (other) {
        block(`İki üye aynı renkte (${color}): ${other} ve ${member.title}.`, { groupId });
        ok = false;
      }
      colors.set(labelKey(color), member.title);
    }
    const types = new Set(members.map((member) => sizeTypeFor(sizesOf(member))?.name ?? "?"));
    if (types.size > 1 || types.has("?")) {
      block("Grubun üyeleri farklı beden listeleri kullanıyor.", { groupId });
      ok = false;
    }
    const sizeSets = new Set(members.map((member) => sizesOf(member).join(",")));
    if (sizeSets.size > 1) {
      warn("Üyelerin bedenleri farklı: yalnızca var olan renk × beden kombinasyonları oluşturulur.", {
        groupId,
      });
    }
    const descriptions = new Set(members.map((member) => member.description?.trim() ?? ""));
    if (descriptions.size > 1 && !answer.descriptionFrom) {
      warn(`Açıklamalar farklı; kalan ürünün açıklaması (${survivor.title}) kullanılacak.`, { groupId });
    }
    if (new Set(members.map((member) => member.status)).size > 1) {
      warn("Üyelerin bir kısmı gizli; birleşen ürün kalan ürünün durumunu alır.", { groupId });
    }
    if (ok) merging.set(groupId, { survivor, members, answer });
  }

  // Types: only those some product uses, values in the built-in order.
  const sizeUse = new Map<string, Set<string>>();
  const colorLabels: string[] = [];
  for (const product of products) {
    const sizes = sizesOf(product);
    if (sizes.length === 0) continue;
    const type = sizeTypeFor(sizes);
    if (!type) {
      block(`Bedenler hazır listelerin hiçbirine uymuyor: ${sizes.join(", ")}.`, {
        productId: product.id,
      });
      continue;
    }
    const used = sizeUse.get(type.name) ?? new Set<string>();
    for (const size of sizes) used.add(size);
    sizeUse.set(type.name, used);
  }
  for (const { members } of merging.values()) {
    for (const member of members) {
      const color = colorOf(member)!;
      if (!colorLabels.some((label) => labelKey(label) === labelKey(color))) colorLabels.push(color);
    }
  }

  const types: PlannedType[] = [];
  for (const sizeType of SIZE_TYPES) {
    const used = sizeUse.get(sizeType.name);
    if (!used) continue;
    types.push({
      id: newId(),
      name: sizeType.name,
      role: "size",
      sortOrder: types.length,
      values: sortSizes(sizeType, used).map((label, sortOrder) => ({ id: newId(), label, sortOrder })),
    });
  }
  const colorType: PlannedType | null =
    colorLabels.length > 0
      ? {
          id: newId(),
          name: "Renk",
          role: "color",
          sortOrder: types.length,
          values: colorLabels.map((label, sortOrder) => ({ id: newId(), label, sortOrder })),
        }
      : null;
  if (colorType) types.push(colorType);

  const typeByName = new Map(types.map((type) => [type.name, type]));
  const valueId = (type: PlannedType, label: string) =>
    type.values.find((value) => labelKey(value.label) === labelKey(label))!.id;

  const planned: PlannedProduct[] = [];
  const merges: PlannedMerge[] = [];
  const untouched: string[] = [];
  const mergedAway = new Set<string>();
  for (const { survivor, members } of merging.values()) {
    for (const member of members) if (member !== survivor) mergedAway.add(member.id);
  }

  for (const product of products) {
    if (mergedAway.has(product.id)) continue;
    const sizes = sizesOf(product);
    const sizeType = sizeTypeFor(sizes);
    const groupId = colorGroupOf(product);
    const merge = groupId ? merging.get(groupId) : undefined;

    if (merge && merge.survivor === product && colorType && sizeType) {
      const type = typeByName.get(sizeType.name)!;
      const variants: PlannedVariant[] = [];
      const galleries: string[] = [];
      for (const member of merge.members) {
        const color = colorOf(member)!;
        const gallery = shopperGalleryUrls({
          images: member.images,
          marketplaceImages: member.marketplaceImages,
          lifestyleImages: member.lifestyleImages,
          features: member.features,
        });
        if (gallery.length === 0) warn(`Fotoğrafı yok: ${member.title}.`, { groupId, productId: member.id });
        for (const url of gallery) if (!galleries.includes(url)) galleries.push(url);
        for (const size of sortSizes(sizeType, sizesOf(member))) {
          variants.push({
            id: newId(),
            optionValueIds: [valueId(colorType, color), valueId(type, size)],
            stock: sizeStock(member, size),
            images: gallery,
            sortOrder: variants.length,
            label: `${color} / ${size}`,
          });
        }
        if (member !== product) {
          merges.push({
            productId: member.id,
            intoId: product.id,
            color,
            features: { ...withoutColorGroup(member.features), color },
          });
        }
      }
      if (galleries.length > TR_OWNER_PRODUCT_LIMITS.maxImagesAdvanced) {
        block(`Birleşen üründe ${galleries.length} fotoğraf olur (en fazla ${TR_OWNER_PRODUCT_LIMITS.maxImagesAdvanced}).`, {
          groupId,
        });
      }
      if (variants.some((variant) => variant.images.length > TR_OWNER_PRODUCT_LIMITS.maxImages)) {
        warn(`Bir rengin ${TR_OWNER_PRODUCT_LIMITS.maxImages}'den fazla fotoğrafı var; varyantlara ilk ${TR_OWNER_PRODUCT_LIMITS.maxImages} tanesi atanır.`, { groupId });
      }
      const descriptionSource =
        merge.members.find((member) => member.id === merge.answer.descriptionFrom) ?? product;
      const features = withManualListing(
        { ...withoutColorGroup(product.features), color: colorOf(product)! },
        true,
      );
      planned.push({
        productId: product.id,
        typeIds: [colorType.id, type.id],
        variants,
        stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
        sizes: sortSizes(sizeType, merge.members.flatMap((member) => sizesOf(member))),
        merge: {
          memberIds: merge.members.map((member) => member.id),
          title: merge.answer.title?.trim() || product.title,
          description: descriptionSource.description,
          descriptionHtml: descriptionSource.descriptionHtml,
          images: galleries,
          features,
        },
      });
      continue;
    }

    if (sizes.length === 0 || !sizeType) {
      untouched.push(product.id);
      continue;
    }
    const type = typeByName.get(sizeType.name)!;
    const variants = sortSizes(sizeType, sizes).map((size, sortOrder) => ({
      id: newId(),
      optionValueIds: [valueId(type, size)],
      stock: sizeStock(product, size),
      images: [],
      sortOrder,
      label: size,
    }));
    planned.push({
      productId: product.id,
      typeIds: [type.id],
      variants,
      stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
      sizes: product.sizes,
      // A colour group that isn't merged: its members no longer link to each other.
      ...(groupId ? { features: withoutColorGroup(product.features) } : {}),
    });
  }

  return { types, products: planned, merges, problems, untouched };
}

/**
 * The checks the dry run prints: stock before and after, per product (and merged
 * group), and that every size with stock landed on a variant. Each mismatch is a
 * blocking problem.
 */
export function checkSizeMigration(
  plan: SizeMigrationPlan,
  products: readonly MigrationProduct[],
): MigrationProblem[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const problems: MigrationProblem[] = [];
  for (const entry of plan.products) {
    const members = entry.merge?.memberIds ?? [entry.productId];
    const before = members.reduce((sum, id) => {
      const product = byId.get(id)!;
      return sum + Object.values(product.sizeStocks).reduce((acc, n) => acc + Math.max(0, n || 0), 0);
    }, 0);
    if (before !== entry.stock) {
      problems.push({
        level: "block",
        productId: entry.productId,
        message: `Stok tutmuyor: önce ${before}, sonra ${entry.stock}.`,
      });
    }
    const combos = new Set(entry.variants.map((variant) => variant.optionValueIds.join(",")));
    if (combos.size !== entry.variants.length) {
      problems.push({ level: "block", productId: entry.productId, message: "Aynı varyant iki kez." });
    }
    if (entry.merge) {
      const own = new Set(entry.merge.images);
      if (entry.variants.some((variant) => variant.images.some((url) => !own.has(url)))) {
        problems.push({
          level: "block",
          productId: entry.productId,
          message: "Bir varyant fotoğrafı ürünün fotoğraflarında yok.",
        });
      }
    }
  }
  return problems;
}

// ------------------------------------------------------------------ SQL

function sqlText(value: string | null): string {
  return value == null ? "null" : `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  return `${sqlText(JSON.stringify(value))}::jsonb`;
}

function sqlUuid(id: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error(`Geçersiz id: ${id}`);
  return `'${id}'::uuid`;
}

function sqlUuidArray(ids: readonly string[]): string {
  return `array[${ids.map(sqlUuid).join(", ")}]::uuid[]`;
}

/** The columns the migration writes, as they are in the snapshot. */
function snapshotRow(product: MigrationProduct): string {
  return `(${[
    sqlUuid(product.id),
    sqlText(product.title),
    sqlText(product.description),
    sqlText(product.descriptionHtml),
    sqlText(product.status),
    sqlText(product.productType),
    String(product.stock),
    sqlJson(product.sizes),
    sqlJson(product.sizeStocks),
    sqlJson(product.features),
    sqlJson(product.images),
    sqlJson(product.marketplaceImages),
    sqlJson(product.lifestyleImages),
  ].join(", ")})`;
}

const SNAPSHOT_COLUMNS =
  "id, title, description, description_html, status, product_type, stock, sizes, size_stocks, features, images, marketplace_images, lifestyle_images";

/**
 * The SQL Mert applies (`apply`) and its undo (`rollback`), both one transaction.
 * `apply` first checks that every product it touches is still exactly as in the
 * snapshot (a sale since then changes its stock) and stops if not.
 */
export function sizeMigrationSql(input: {
  plan: SizeMigrationPlan;
  products: readonly MigrationProduct[];
  boutiqueId: string;
  boutiqueSlug: string;
  snapshotAt: string;
}): { apply: string; rollback: string } {
  const { plan, products, boutiqueId, boutiqueSlug, snapshotAt } = input;
  if (plan.problems.some((problem) => problem.level === "block")) {
    throw new Error("Plan has blocking problems; fix them before writing SQL.");
  }
  const byId = new Map(products.map((product) => [product.id, product]));
  const touched = [
    ...plan.products.map((entry) => entry.productId),
    ...plan.merges.map((entry) => entry.productId),
  ];
  const snapshot = touched.map((id) => byId.get(id)!);

  const apply: string[] = [];
  apply.push(`-- F6: ${boutiqueSlug} sizes and colour groups become variants.`);
  apply.push(`-- Generated by scripts/f6-size-variants.mts from a snapshot taken ${snapshotAt}.`);
  apply.push("-- Needs patch_product_variants.sql, patch_variant_type_roles.sql and");
  apply.push("-- patch_product_merged_into.sql. One transaction: it applies fully or not at all.");
  apply.push(`-- ${plan.products.length} products move to variants; ${plan.merges.length} are merged into another.`);
  apply.push("");
  apply.push("begin;");
  apply.push("");
  apply.push("-- Stop if anything changed since the snapshot (a sale, an edit): re-run the script.");
  apply.push("do $f6$");
  apply.push("declare changed integer;");
  apply.push("begin");
  apply.push(
    `  if exists (select 1 from public.tr_variant_types where boutique_id = ${sqlUuid(boutiqueId)}) then`,
  );
  apply.push("    raise exception 'F6: the boutique already has variant types';");
  apply.push("  end if;");
  apply.push("  select count(*) into changed");
  apply.push(`  from (values\n    ${snapshot.map(snapshotRow).join(",\n    ")}\n  ) as s(${SNAPSHOT_COLUMNS})`);
  apply.push("  left join public.tr_products p on p.id = s.id");
  apply.push("  where p.id is null");
  for (const column of SNAPSHOT_COLUMNS.split(", ").slice(1)) {
    const left = column === "status" ? "p.status::text" : `p.${column}`;
    apply.push(`     or ${left} is distinct from s.${column}`);
  }
  apply.push("     or p.merged_into is not null;");
  apply.push("  if changed > 0 then");
  apply.push("    raise exception 'F6: % product(s) changed since the snapshot; re-run the script', changed;");
  apply.push("  end if;");
  apply.push("end");
  apply.push("$f6$;");
  apply.push("");

  apply.push("-- Variant types and their values.");
  for (const type of plan.types) {
    apply.push(
      `insert into public.tr_variant_types (id, boutique_id, name, selection_style, role, sort_order) values (${sqlUuid(type.id)}, ${sqlUuid(boutiqueId)}, ${sqlText(type.name)}, 'list', ${sqlText(type.role)}, ${type.sortOrder});`,
    );
    apply.push(
      `insert into public.tr_variant_type_values (id, type_id, label, sort_order) values\n  ${type.values
        .map((value) => `(${sqlUuid(value.id)}, ${sqlUuid(type.id)}, ${sqlText(value.label)}, ${value.sortOrder})`)
        .join(",\n  ")};`,
    );
  }
  apply.push("");

  for (const entry of plan.products) {
    const product = byId.get(entry.productId)!;
    apply.push(`-- ${entry.merge ? `${entry.merge.title} (merged: ${entry.merge.memberIds.length} colours)` : product.title}`);
    apply.push(
      `insert into public.tr_product_options (product_id, type_id, sort_order) values ${entry.typeIds
        .map((typeId, index) => `(${sqlUuid(entry.productId)}, ${sqlUuid(typeId)}, ${index})`)
        .join(", ")};`,
    );
    apply.push(
      `insert into public.tr_product_variants (id, product_id, option_value_ids, stock, images, active, sort_order) values\n  ${entry.variants
        .map(
          (variant) =>
            `(${sqlUuid(variant.id)}, ${sqlUuid(entry.productId)}, ${sqlUuidArray(variant.optionValueIds)}, ${variant.stock}, ${sqlJson(variant.images.slice(0, 8))}, true, ${variant.sortOrder})`,
        )
        .join(",\n  ")};`,
    );
    const sets = [
      "product_type = 'advanced'",
      `stock = ${entry.stock}`,
      `sizes = ${sqlJson(entry.sizes)}`,
      "size_stocks = '{}'::jsonb",
    ];
    if (entry.merge) {
      sets.push(
        `title = ${sqlText(entry.merge.title)}`,
        `description = ${sqlText(entry.merge.description)}`,
        `description_html = ${sqlText(entry.merge.descriptionHtml)}`,
        `images = ${sqlJson(entry.merge.images)}`,
        "marketplace_images = '[]'::jsonb",
        "lifestyle_images = '[]'::jsonb",
        `features = ${sqlJson(entry.merge.features)}`,
      );
    } else if (entry.features) {
      sets.push(`features = ${sqlJson(entry.features)}`);
    }
    sets.push("updated_at = timezone('utc'::text, now())");
    apply.push(`update public.tr_products set\n  ${sets.join(",\n  ")}\nwhere id = ${sqlUuid(entry.productId)};`);
    apply.push("");
  }

  if (plan.merges.length > 0) {
    apply.push("-- Merged colours: hidden, pointing at the product that took them in.");
    for (const merge of plan.merges) {
      apply.push(
        `update public.tr_products set status = 'hidden', merged_into = ${sqlUuid(merge.intoId)}, features = ${sqlJson(merge.features)}, updated_at = timezone('utc'::text, now()) where id = ${sqlUuid(merge.productId)};`,
      );
    }
    apply.push("");
  }
  apply.push("commit;");

  const rollback: string[] = [];
  rollback.push(`-- Undo of patch for F6 (${boutiqueSlug}), snapshot ${snapshotAt}.`);
  rollback.push("-- Puts every product back exactly as in the snapshot, stock included: run it only");
  rollback.push("-- right after the patch, before the shop sells anything. It stops (and changes");
  rollback.push("-- nothing) once an order line points at one of the new variants.");
  rollback.push("");
  rollback.push("begin;");
  rollback.push(rollbackOrderGuard(plan.products.map((entry) => entry.productId)));
  rollback.push(
    `delete from public.tr_product_variants where product_id = any(${sqlUuidArray(plan.products.map((entry) => entry.productId))});`,
  );
  rollback.push(
    `delete from public.tr_product_options where product_id = any(${sqlUuidArray(plan.products.map((entry) => entry.productId))});`,
  );
  if (plan.types.length > 0) {
    rollback.push(
      `delete from public.tr_variant_type_values where type_id = any(${sqlUuidArray(plan.types.map((type) => type.id))});`,
    );
    rollback.push(
      `delete from public.tr_variant_types where id = any(${sqlUuidArray(plan.types.map((type) => type.id))});`,
    );
  }
  rollback.push("update public.tr_products p set");
  rollback.push(
    `  ${SNAPSHOT_COLUMNS.split(", ")
      .slice(1)
      .map((column) => (column === "status" ? "status = s.status::public.tr_product_status" : `${column} = s.${column}`))
      .join(",\n  ")},`,
  );
  rollback.push("  merged_into = null,");
  rollback.push("  updated_at = timezone('utc'::text, now())");
  rollback.push(`from (values\n  ${snapshot.map(snapshotRow).join(",\n  ")}\n) as s(${SNAPSHOT_COLUMNS})`);
  rollback.push("where p.id = s.id;");
  rollback.push("commit;");

  return { apply: `${apply.join("\n")}\n`, rollback: `${rollback.join("\n")}\n` };
}

/** Stops a rollback once an order line points at a variant it would delete. */
function rollbackOrderGuard(productIds: readonly string[]): string {
  return [
    "do $f6$",
    "begin",
    "  if exists (",
    "    select 1 from public.tr_order_items i",
    "    join public.tr_product_variants v on v.id = i.variant_id",
    `    where v.product_id = any(${sqlUuidArray(productIds)})`,
    "  ) then",
    "    raise exception 'F6 rollback: orders already use the new variants; undo by hand';",
    "  end if;",
    "end",
    "$f6$;",
  ].join("\n");
}

/**
 * The fingerprint of the columns the migration writes, computed the same way when the
 * snapshot is read and when the compact patch checks that nothing changed since.
 */
export const SIZE_MIGRATION_HASH_SQL =
  "md5(jsonb_build_array(p.title, p.description, p.description_html, p.status::text, p.product_type, p.stock, p.sizes, p.size_stocks, p.features, p.images, p.marketplace_images, p.lifestyle_images)::text)";

/**
 * The same migration as `sizeMigrationSql`, small enough to send in one database call:
 * the snapshot check compares fingerprints (`hashes`, read with SIZE_MIGRATION_HASH_SQL)
 * instead of whole rows; per-size variants are built in SQL from each product's own
 * `sizes` / `size_stocks`; the products are copied to `tr_f6_products_backup` (RLS on,
 * no policies) and the rollback restores from that copy.
 */
export function sizeMigrationCompactSql(input: {
  plan: SizeMigrationPlan;
  products: readonly MigrationProduct[];
  hashes: ReadonlyMap<string, string>;
  boutiqueId: string;
  boutiqueSlug: string;
  snapshotAt: string;
}): { apply: string; rollback: string } {
  const { plan, products, hashes, boutiqueId, boutiqueSlug, snapshotAt } = input;
  if (plan.problems.some((problem) => problem.level === "block")) {
    throw new Error("Plan has blocking problems; fix them before writing SQL.");
  }
  const byId = new Map(products.map((product) => [product.id, product]));
  const touched = [
    ...plan.products.map((entry) => entry.productId),
    ...plan.merges.map((entry) => entry.productId),
  ];
  for (const id of touched) {
    if (!hashes.get(id)) throw new Error(`No fingerprint for ${id}.`);
  }
  const prefix = commonUrlPrefix(plan);
  const colorType = plan.types.find((type) => type.role === "color") ?? null;
  const colorValueLabel = (color: string) =>
    colorType!.values.find((value) => labelKey(value.label) === labelKey(color))!.label;

  const out: string[] = [];
  out.push(`-- F6 (compact): ${boutiqueSlug} sizes and colour groups become variants.`);
  out.push(`-- Generated by scripts/f6-size-variants.mts from a snapshot taken ${snapshotAt}.`);
  out.push("-- Needs patch_product_variants.sql, patch_variant_type_roles.sql and patch_product_merged_into.sql.");
  out.push(`-- ${plan.products.length} products move to variants; ${plan.merges.length} are merged into another.`);
  out.push("begin;");
  out.push("create temp table f6_hash (id uuid primary key, h text not null) on commit drop;");
  out.push(`insert into f6_hash values ${touched.map((id) => `(${lit(id)}, ${sqlText(hashes.get(id)!)})`).join(",")};`);
  out.push("do $f6$");
  out.push("declare changed integer;");
  out.push("begin");
  out.push(`  if exists (select 1 from public.tr_variant_types where boutique_id = ${sqlUuid(boutiqueId)}) then`);
  out.push("    raise exception 'F6: the boutique already has variant types';");
  out.push("  end if;");
  out.push("  select count(*) into changed");
  out.push("  from f6_hash s left join public.tr_products p on p.id = s.id");
  out.push(`  where p.id is null or p.merged_into is not null or ${SIZE_MIGRATION_HASH_SQL} <> s.h;`);
  out.push("  if changed > 0 then");
  out.push("    raise exception 'F6: % product(s) changed since the snapshot; re-run the script', changed;");
  out.push("  end if;");
  out.push("end");
  out.push("$f6$;");

  out.push("create table public.tr_f6_products_backup as");
  out.push("  select timezone('utc'::text, now()) as backed_up_at, p.* from public.tr_products p");
  out.push("  where p.id in (select id from f6_hash);");
  out.push("alter table public.tr_f6_products_backup enable row level security;");

  for (const type of plan.types) {
    out.push(
      `insert into public.tr_variant_types (id, boutique_id, name, selection_style, role, sort_order) values (${sqlUuid(type.id)}, ${sqlUuid(boutiqueId)}, ${sqlText(type.name)}, 'list', ${sqlText(type.role)}, ${type.sortOrder});`,
    );
    out.push(
      `insert into public.tr_variant_type_values (id, type_id, label, sort_order) values ${type.values
        .map((value) => `(${sqlUuid(value.id)}, ${sqlUuid(type.id)}, ${sqlText(value.label)}, ${value.sortOrder})`)
        .join(", ")};`,
    );
  }

  // Each product's options: a size type, and Renk first for a merged product.
  out.push("create temp table f6_options (product_id uuid primary key, color_type uuid, size_type uuid not null) on commit drop;");
  out.push(
    `insert into f6_options values ${plan.products
      .map((entry) => {
        const [first, second] = entry.typeIds;
        return entry.typeIds.length === 2
          ? `(${lit(entry.productId)},${lit(first!)},${lit(second!)})`
          : `(${lit(entry.productId)},null,${lit(first!)})`;
      })
      .join(",")};`,
  );
  out.push("insert into public.tr_product_options (product_id, type_id, sort_order)");
  out.push("  select product_id, color_type, 0 from f6_options where color_type is not null");
  out.push("  union all");
  out.push("  select product_id, size_type, case when color_type is null then 0 else 1 end from f6_options;");

  // Products that keep one colour: a variant per size of their own.
  out.push("insert into public.tr_product_variants (product_id, option_value_ids, stock, images, active, sort_order)");
  out.push("  select o.product_id, array[v.id],");
  out.push("    greatest(0, coalesce(round((p.size_stocks ->> v.label)::numeric), 0))::integer,");
  out.push("    '[]'::jsonb, true,");
  out.push("    (row_number() over (partition by o.product_id order by v.sort_order) - 1)::integer");
  out.push("  from f6_options o");
  out.push("  join public.tr_products p on p.id = o.product_id");
  out.push("  join public.tr_variant_type_values v on v.type_id = o.size_type and p.sizes ? v.label");
  out.push("  where o.color_type is null;");

  const merged = plan.products.filter((entry) => entry.merge);
  if (merged.length > 0) {
    const members: string[] = [];
    for (const entry of merged) {
      entry.merge!.memberIds.forEach((memberId, ord) => {
        const first = entry.variants.find((variant) =>
          variant.label.startsWith(`${colorOfVariantLabel(entry, memberId, plan)} / `),
        );
        const color = plan.merges.find((merge) => merge.productId === memberId)?.color ??
          String(entry.merge!.features.color);
        members.push(
          `(${lit(entry.productId)},${lit(memberId)},${ord},${sqlText(colorValueLabel(color))},${sqlText(color)},${packedJson((first?.images ?? []).slice(0, 8), prefix)})`,
        );
      });
    }
    out.push("create temp table f6_members (survivor uuid, member uuid primary key, ord integer, value_label text, color text, gallery jsonb) on commit drop;");
    out.push(`insert into f6_members values ${members.join(", ")};`);
    // A variant per colour × size that existed, holding that colour's stock and photos.
    out.push("insert into public.tr_product_variants (product_id, option_value_ids, stock, images, active, sort_order)");
    out.push("  select m.survivor, array[cv.id, sv.id],");
    out.push("    greatest(0, coalesce(round((mp.size_stocks ->> sv.label)::numeric), 0))::integer,");
    out.push("    m.gallery, true,");
    out.push("    (row_number() over (partition by m.survivor order by m.ord, sv.sort_order) - 1)::integer");
    out.push("  from f6_members m");
    out.push("  join public.tr_products mp on mp.id = m.member");
    out.push("  join f6_options o on o.product_id = m.survivor");
    out.push("  join public.tr_variant_type_values cv on cv.type_id = o.color_type and cv.label = m.value_label");
    out.push("  join public.tr_variant_type_values sv on sv.type_id = o.size_type and mp.sizes ? sv.label;");
    // The merged gallery is every colour's photos in order, built from f6_members when
    // no colour was cut to 8 photos there (else written out).
    const derived = merged.every((entry) =>
      entry.merge!.memberIds.every((memberId) => {
        const color = colorOfVariantLabel(entry, memberId, plan);
        const first = entry.variants.find((variant) => variant.label.startsWith(`${color} / `));
        return (first?.images.length ?? 0) <= 8;
      }),
    );
    out.push("update public.tr_products p set");
    out.push("  title = s.title, description = d.description, description_html = d.description_html,");
    out.push(
      derived
        ? "  images = coalesce((select jsonb_agg(x.u order by x.pos) from (select g.u, min(m.ord * 1000 + g.n) as pos from f6_members m, jsonb_array_elements_text(m.gallery) with ordinality g(u, n) where m.survivor = s.id group by g.u) x), '[]'::jsonb), marketplace_images = '[]'::jsonb, lifestyle_images = '[]'::jsonb,"
        : "  images = s.images, marketplace_images = '[]'::jsonb, lifestyle_images = '[]'::jsonb,",
    );
    out.push("  features = s.features, sizes = s.sizes");
    out.push(
      `from (values ${merged
        .map((entry) => {
          const merge = entry.merge!;
          const from =
            merge.description === byId.get(entry.productId)!.description &&
            merge.descriptionHtml === byId.get(entry.productId)!.descriptionHtml
              ? entry.productId
              : merge.memberIds.find((id) => {
                  const member = byId.get(id)!;
                  return member.description === merge.description && member.descriptionHtml === merge.descriptionHtml;
                })!;
          return `(${sqlUuid(entry.productId)}, ${sqlText(merge.title)}, ${sqlUuid(from)}, ${derived ? "null::jsonb" : packedJson(merge.images, prefix)}, ${sqlJson(merge.features)}, ${sqlJson(entry.sizes)})`;
        })
        .join(", ")}) as s(id, title, description_from, images, features, sizes)`,
    );
    out.push("join public.tr_products d on d.id = s.description_from");
    out.push("where p.id = s.id;");
    out.push("update public.tr_products p set status = 'hidden', merged_into = m.survivor,");
    out.push("  features = (p.features - 'colorGroupId' - 'colorSiblingIds') || jsonb_build_object('color', m.color)");
    out.push("from f6_members m where p.id = m.member and m.member <> m.survivor;");
  }

  const ungrouped = plan.products.filter((entry) => !entry.merge && entry.features);
  if (ungrouped.length > 0) {
    out.push("update public.tr_products set features = features - 'colorGroupId' - 'colorSiblingIds'");
    out.push(`where id = any(${sqlUuidArray(ungrouped.map((entry) => entry.productId))});`);
  }
  out.push("update public.tr_products p set product_type = 'advanced', size_stocks = '{}'::jsonb,");
  out.push("  stock = coalesce((select sum(v.stock) from public.tr_product_variants v where v.product_id = p.id), 0)");
  out.push("from f6_options o where p.id = o.product_id;");
  out.push("update public.tr_products set updated_at = timezone('utc'::text, now()) where id in (select id from f6_hash);");
  out.push("commit;");

  const columns = SNAPSHOT_COLUMNS.split(", ").slice(1);
  const rollback = [
    `-- Undo of the compact F6 patch (${boutiqueSlug}): restores every product from tr_f6_products_backup.`,
    "-- Run it only before the shop sells a new variant (it stops otherwise).",
    "begin;",
    rollbackOrderGuard(plan.products.map((entry) => entry.productId)),
    "delete from public.tr_product_variants where product_id in (select id from public.tr_f6_products_backup);",
    "delete from public.tr_product_options where product_id in (select id from public.tr_f6_products_backup);",
    `delete from public.tr_variant_type_values where type_id in (select id from public.tr_variant_types where boutique_id = ${sqlUuid(boutiqueId)});`,
    `delete from public.tr_variant_types where boutique_id = ${sqlUuid(boutiqueId)};`,
    "update public.tr_products p set",
    `  ${columns.map((column) => `${column} = b.${column}`).join(", ")},`,
    "  merged_into = null, updated_at = timezone('utc'::text, now())",
    "from public.tr_f6_products_backup b where p.id = b.id;",
    "commit;",
    "-- Then, when no longer needed: drop table public.tr_f6_products_backup;",
  ];
  return { apply: `${out.join("\n")}\n`, rollback: `${rollback.join("\n")}\n` };
}

/** The colour a merged member became, as it reads in the variants' labels. */
function colorOfVariantLabel(entry: PlannedProduct, memberId: string, plan: SizeMigrationPlan): string {
  const merge = plan.merges.find((m) => m.productId === memberId);
  return merge ? merge.color : String(entry.merge!.features.color);
}

/** A plain literal for a typed column (the column casts it). */
function lit(id: string): string {
  sqlUuid(id);
  return `'${id}'`;
}

/** The longest shared start of the merged photos' URLs, up to the last `/`. */
function commonUrlPrefix(plan: SizeMigrationPlan): string {
  const urls = plan.products.flatMap((entry) => entry.merge?.images ?? []);
  if (urls.length === 0) return "";
  let prefix = urls[0]!;
  for (const url of urls) {
    while (!url.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix.slice(0, prefix.lastIndexOf("/") + 1);
}

/** A JSON list of URLs with their shared start written as `@/`, expanded by the database. */
function packedJson(urls: readonly string[], prefix: string): string {
  if (!prefix || prefix.includes("@/")) return sqlJson(urls);
  const packed = JSON.stringify(urls.map((url) => (url.startsWith(prefix) ? `@/${url.slice(prefix.length)}` : url)));
  if (packed.includes("@/") === false) return sqlJson(urls);
  return `replace(${sqlText(packed)}, '@/', ${sqlText(prefix)})::jsonb`;
}
