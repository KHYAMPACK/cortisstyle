import { requireStudioUser } from "@/lib/studioApiAuth";
import { studioRoute } from "@/lib/studioApiCors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return studioRoute(request, async () => {
    const authResult = await requireStudioUser(request);
    if (!authResult.ok) return authResult.response;

    const user = authResult.auth.user;

    return Response.json({
      user: {
        id: user.id,
        email: user.email ?? null,
      },
    });
  });
}

export async function OPTIONS(request: Request) {
  return studioRoute(request, async () => new Response(null, { status: 204 }));
}
