import { planCategoryImport } from "@/lib/tr/categories/importPlan";
import {
  CategoryError,
  importCategoryPlan,
  listCategories,
  listProductCategoryColumns,
} from "@/lib/tr/catalog/categories";
import {
  fashionCategoryAliases,
  fashionCategoryTemplate,
} from "@/lib/tr/fashion/categoryTemplate";

/**
 * Give a fashion boutique the starter category tree (same slugs as the built-in
 * garment ids, system keys set) and file each existing product under its current
 * category. Only for a boutique with no categories yet: used when a boutique is
 * created and by "Hazır kategorileri içe aktar". Server only.
 */
export async function seedFashionCategories(
  boutiqueId: string,
): Promise<{ created: number; assigned: number }> {
  if ((await listCategories(boutiqueId)).length > 0) {
    throw new CategoryError("Bu butiğin zaten kategorileri var.", 409);
  }
  const plan = planCategoryImport({
    template: fashionCategoryTemplate(),
    aliases: fashionCategoryAliases(),
    products: await listProductCategoryColumns(boutiqueId),
  });
  const created = await importCategoryPlan(boutiqueId, plan);
  return { created, assigned: plan.assignments.length };
}
