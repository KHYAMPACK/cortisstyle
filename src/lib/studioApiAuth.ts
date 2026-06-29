import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { isStudioCurator, STUDIO_ACCESS_DENIED_MESSAGE } from "@/lib/studioCuratorAccess";

export interface StudioAuthContext {
  user: User;
  accessToken: string;
  supabase: SupabaseClient;
}

function parseBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export async function requireStudioUser(
  request: Request,
): Promise<
  | { ok: true; auth: StudioAuthContext }
  | { ok: false; response: Response }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return {
      ok: false,
      response: Response.json(
        { error: "Supabase is not configured on the server." },
        { status: 503 },
      ),
    };
  }

  const accessToken = parseBearerToken(request);

  if (!accessToken) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!(await isStudioCurator(user, supabase))) {
    return {
      ok: false,
      response: Response.json(
        { error: STUDIO_ACCESS_DENIED_MESSAGE, code: "studio_access_denied" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    auth: { user, accessToken, supabase },
  };
}
