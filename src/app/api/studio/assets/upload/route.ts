import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import { uploadStudioAsset } from "@/lib/studioAssetStorage";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: Request) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: "Invalid multipart payload." }, { status: 400 });
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "A file field is required." }, { status: 400 });
    }

    const contentType = file.type || "image/png";

    if (!ALLOWED_TYPES.has(contentType)) {
      return Response.json(
        { error: "Only PNG, JPEG, and WebP uploads are supported." },
        { status: 400 },
      );
    }

    const draftIdRaw = formData.get("draftId");
    const itemIdRaw = formData.get("itemId");
    const draftId =
      typeof draftIdRaw === "string" && draftIdRaw.trim()
        ? draftIdRaw.trim()
        : null;
    const itemId =
      typeof itemIdRaw === "string" && itemIdRaw.trim()
        ? itemIdRaw.trim()
        : "asset";

    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadStudioAsset({
        userId: authResult.auth.user.id,
        draftId,
        itemId,
        bytes,
        contentType,
      });

      return Response.json({
        url: uploaded.url,
        path: uploaded.path,
      });
    } catch (error) {
      console.error("[studio/assets/upload] failed:", error);
      const message =
        error instanceof Error ? error.message : "Unable to upload asset.";
      return Response.json({ error: message }, { status: 500 });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
