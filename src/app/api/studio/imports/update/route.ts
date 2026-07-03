import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import { updateStudioImportCacheMetadata } from "@/lib/studioImportCacheDb";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const payload = body as {
      id?: string;
      productName?: string | null;
      category?: string | null;
      brand?: string | null;
      shopUrl?: string | null;
      displayModel?: string | null;
      estPriceRange?: string | null;
      budgetAlternativeUrl?: string | null;
      rarityScore?: number;
    };

    const id = payload.id?.trim() ?? "";

    if (!id) {
      return Response.json({ error: "id is required." }, { status: 400 });
    }

    try {
      const record = await updateStudioImportCacheMetadata(
        authResult.auth.supabase,
        authResult.auth.user.id,
        id,
        {
          productName: payload.productName,
          category: payload.category,
          brand: payload.brand,
          shopUrl: payload.shopUrl,
          displayModel: payload.displayModel,
          estPriceRange: payload.estPriceRange,
          budgetAlternativeUrl: payload.budgetAlternativeUrl,
          rarityScore: payload.rarityScore,
        },
      );

      if (!record) {
        return Response.json({ error: "Import not found." }, { status: 404 });
      }

      return Response.json({ record });
    } catch (error) {
      console.error("[studio/imports/update] failed:", error);
      return Response.json({ error: "Unable to update import metadata." }, { status: 500 });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
