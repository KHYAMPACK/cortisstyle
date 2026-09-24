import {
  CategoryError,
  type CategoryWriteInput,
} from "@/lib/tr/catalog/categories";
import { readCategorySortCriterion } from "@/lib/tr/categories/sortCriteria";
import { sanitizeSeo } from "@/lib/tr/seo/seoFields";

/**
 * Shared by the category API routes (a Next route file may only export its
 * handlers, so these live here).
 */

/** Body fields → the write input. Only what was sent is set; `undefined` = leave alone. */
export function readCategoryBody(body: Record<string, unknown>): CategoryWriteInput {
  const input: CategoryWriteInput = {};
  if (typeof body.name === "string") input.name = body.name;
  if (body.parentId === null || typeof body.parentId === "string") {
    input.parentId = (body.parentId as string | null) || null;
  }
  if (body.slug === null || typeof body.slug === "string") {
    input.slug = body.slug as string | null;
  }
  if (body.description === null || typeof body.description === "string") {
    input.description = body.description as string | null;
  }
  if (body.imageUrl === null || typeof body.imageUrl === "string") {
    input.imageUrl = body.imageUrl as string | null;
  }
  if (body.sortCriterion !== undefined) {
    input.sortCriterion = readCategorySortCriterion(body.sortCriterion);
  }
  if (body.seo !== undefined) input.seo = sanitizeSeo(body.seo);
  return input;
}

/** `{ ids, primaryId }` in a product body → what to store; `undefined` when not sent. */
export function readCategoriesBody(
  value: unknown,
): { ids: string[]; primaryId: string | null } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const ids = Array.isArray(record.ids)
    ? record.ids.filter((id): id is string => typeof id === "string")
    : [];
  return {
    ids,
    primaryId: typeof record.primaryId === "string" ? record.primaryId : null,
  };
}

export function categoryErrorResponse(error: unknown, fallback: string): Response {
  if (error instanceof CategoryError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[tr/owner/categories]", error);
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}
