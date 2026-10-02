/**
 * Pure tree logic for a boutique's own categories (`tr_categories`). Depth is
 * unlimited, so everything here works on the flat list with parent ids.
 */
export interface TrCategoryNode {
  id: string;
  parentId: string | null;
  name: string;
  sortOrder?: number;
}

function byOrder<T extends TrCategoryNode>(a: T, b: T): number {
  return (
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
    a.name.localeCompare(b.name, "tr")
  );
}

/** Children of `parentId` (null = roots), in display order. */
export function childrenOf<T extends TrCategoryNode>(
  categories: readonly T[],
  parentId: string | null,
): T[] {
  return categories.filter((entry) => entry.parentId === parentId).sort(byOrder);
}

/**
 * The list in tree order (each parent followed by its children) with its depth,
 * for an indented list. A category whose parent is missing is shown as a root, and
 * a cycle can never loop.
 */
export function flattenCategoryTree<T extends TrCategoryNode>(
  categories: readonly T[],
): Array<{ category: T; depth: number }> {
  const ids = new Set(categories.map((entry) => entry.id));
  const out: Array<{ category: T; depth: number }> = [];
  const seen = new Set<string>();

  const visit = (category: T, depth: number) => {
    if (seen.has(category.id)) return;
    seen.add(category.id);
    out.push({ category, depth });
    for (const child of childrenOf(categories, category.id)) visit(child, depth + 1);
  };

  const roots = categories
    .filter((entry) => entry.parentId === null || !ids.has(entry.parentId))
    .sort(byOrder);
  for (const root of roots) visit(root, 0);
  // Anything only reachable through a cycle still shows up, as a root.
  for (const entry of [...categories].sort(byOrder)) visit(entry, 0);
  return out;
}

/** Ids of every category below `id` (not including it). */
export function descendantIds(
  categories: readonly TrCategoryNode[],
  id: string,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([id]);
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of categories) {
      if (child.parentId === current && !seen.has(child.id)) {
        seen.add(child.id);
        out.push(child.id);
        queue.push(child.id);
      }
    }
  }
  return out;
}

/** `id` plus everything below it — the categories whose products belong to `id`. */
export function categoryAndDescendantIds(
  categories: readonly TrCategoryNode[],
  id: string,
): string[] {
  return [id, ...descendantIds(categories, id)];
}

/** Would making `newParentId` the parent of `id` create a loop? */
export function wouldCreateCycle(
  categories: readonly TrCategoryNode[],
  id: string,
  newParentId: string | null,
): boolean {
  if (newParentId === null) return false;
  if (newParentId === id) return true;
  return descendantIds(categories, id).includes(newParentId);
}

/** Root → … → the category itself. */
export function categoryPath<T extends TrCategoryNode>(
  categories: readonly T[],
  id: string,
): T[] {
  const byId = new Map(categories.map((entry) => [entry.id, entry]));
  const out: T[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    out.unshift(current);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return out;
}

/** "Giyim › Üst giyim › Gömlek" — the label a picker shows for a nested category. */
export function categoryPathLabel(
  categories: readonly TrCategoryNode[],
  id: string,
): string {
  return categoryPath(categories, id)
    .map((entry) => entry.name)
    .join(" › ");
}

/**
 * The categories a category can be moved under, in tree order with a label that shows
 * its depth. A category can never be its own parent or sit below its own descendants.
 */
export function parentOptions<T extends TrCategoryNode>(
  categories: readonly T[],
  exceptId?: string,
): Array<{ id: string; label: string }> {
  const blocked = new Set<string>(
    exceptId ? [exceptId, ...descendantIds(categories, exceptId)] : [],
  );
  return flattenCategoryTree(categories)
    .filter(({ category }) => !blocked.has(category.id))
    .map(({ category, depth }) => ({
      id: category.id,
      label: `${"— ".repeat(depth)}${category.name}`,
    }));
}

/**
 * The slugs that count as "in this category": its own and every descendant's. The
 * Ürünler list filters on a product's primary-category slug, so a parent category
 * shows the products of its subcategories too.
 */
export function slugsInScope<T extends TrCategoryNode & { slug: string }>(
  categories: readonly T[],
  slug: string,
): Set<string> {
  const start = categories.find((entry) => entry.slug === slug);
  if (!start) return new Set([slug]);
  const scope = new Set(categoryAndDescendantIds(categories, start.id));
  return new Set(
    categories.filter((entry) => scope.has(entry.id)).map((entry) => entry.slug),
  );
}

/** A row of a collapsible category table. */
export interface CategoryTableRow<T extends TrCategoryNode> {
  category: T;
  depth: number;
  hasChildren: boolean;
  /** "Elbise › Abiye" for the parent chain, "" for a root (shown under the name). */
  parentPath: string;
}

/**
 * The rows a collapsible category table shows: tree order, a category's children only
 * while it is expanded. With a search query or a filter, every match, flat (its parents
 * may not match), with its parent path so it can still be told apart.
 */
export function visibleCategoryRows<T extends TrCategoryNode>(
  categories: readonly T[],
  expanded: ReadonlySet<string>,
  query = "",
  /** A filter: like a search, it lists the matches flat. */
  match?: (category: T) => boolean,
): CategoryTableRow<T>[] {
  const withChildren = new Set(
    categories.map((entry) => entry.parentId).filter((id): id is string => Boolean(id)),
  );
  const parentPath = (id: string) =>
    categoryPath(categories, id)
      .slice(0, -1)
      .map((entry) => entry.name)
      .join(" › ");
  const needle = query.trim().toLocaleLowerCase("tr");
  const rows = flattenCategoryTree(categories);

  if (needle || match) {
    return rows
      .filter(
        ({ category }) =>
          category.name.toLocaleLowerCase("tr").includes(needle) &&
          (!match || match(category)),
      )
      .map(({ category }) => ({
        category,
        depth: 0,
        hasChildren: false,
        parentPath: parentPath(category.id),
      }));
  }

  const out: CategoryTableRow<T>[] = [];
  let hiddenBelow: number | null = null;
  for (const { category, depth } of rows) {
    if (hiddenBelow !== null && depth > hiddenBelow) continue;
    hiddenBelow = null;
    const hasChildren = withChildren.has(category.id);
    out.push({ category, depth, hasChildren, parentPath: parentPath(category.id) });
    if (hasChildren && !expanded.has(category.id)) hiddenBelow = depth;
  }
  return out;
}
