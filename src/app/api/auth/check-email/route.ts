import { getServiceSupabase, isValidNotifyEmail } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

interface CheckEmailPayload {
  email?: string;
}

export async function POST(request: Request) {
  let payload: CheckEmailPayload;

  try {
    payload = (await request.json()) as CheckEmailPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase() ?? "";

  if (!isValidNotifyEmail(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const admin = getServiceSupabase();

  if (!admin) {
    return Response.json(
      {
        error:
          "Email lookup is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY on the server.",
        fallback: true,
      },
      { status: 503 },
    );
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Auth email check failed:", error);
    return Response.json(
      { error: "Unable to verify email address." },
      { status: 500 },
    );
  }

  return Response.json({ exists: Boolean(data) });
}
