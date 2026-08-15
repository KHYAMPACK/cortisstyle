import { createClient, type User } from "@supabase/supabase-js";

/**
 * Resolve the shopper from a Bearer access token (storefront customer APIs).
 */
export async function getCustomerUserFromRequest(
  request: Request,
): Promise<{ user: User } | { status: number; error: string }> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return { status: 401, error: "Unauthorized." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return { status: 500, error: "Supabase not configured." };
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: 401, error: "Unauthorized." };
  }

  return { user };
}
