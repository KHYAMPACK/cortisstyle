import {
  insertWardrobeNotifySignup,
  isValidNotifyEmail,
} from "@/lib/wardrobeNotifyDb";

export const runtime = "nodejs";

interface NotifyPayload {
  email?: string;
}

export async function POST(request: Request) {
  let payload: NotifyPayload;

  try {
    payload = (await request.json()) as NotifyPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase() ?? "";

  if (!isValidNotifyEmail(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const result = await insertWardrobeNotifySignup(email);

  if (result.ok) {
    return Response.json({ ok: true });
  }

  if (result.code === "duplicate") {
    return Response.json(
      { ok: true, message: "You are already on the notify list." },
      { status: 200 },
    );
  }

  if (result.code === "config") {
    return Response.json(
      {
        error:
          "Notify signup is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 },
    );
  }

  return Response.json(
    { error: "Unable to save your email. Please try again." },
    { status: 500 },
  );
}
