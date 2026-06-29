import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";
import { fetchRemoteImageBuffer, removeGarmentBackground } from "@/lib/studioRemoveBg";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return new Response("Invalid multipart payload.", { status: 400 });
    }

    const imageFile = formData.get("image");
    const imageUrlRaw = formData.get("imageUrl");

    try {
      let bytes: Buffer;
      let filename: string;
      let mimeType: string;

      if (imageFile instanceof File) {
        bytes = Buffer.from(await imageFile.arrayBuffer());
        filename = imageFile.name || "clipboard-asset.png";
        mimeType = imageFile.type || "image/png";
      } else if (typeof imageUrlRaw === "string" && imageUrlRaw.trim()) {
        const remote = await fetchRemoteImageBuffer(imageUrlRaw.trim());
        bytes = remote.bytes;
        filename = remote.filename;
        mimeType = remote.mimeType;
      } else {
        return new Response("No image file or URL provided.", { status: 400 });
      }

      const result = await removeGarmentBackground({ bytes, filename, mimeType });

      return new Response(new Uint8Array(result), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      console.error("[studio/remove-bg] failed:", error);
      const message =
        error instanceof Error ? error.message : "Background removal failed";
      return new Response(message, {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
