import { sendBoutiqueSignupOtp } from "@/lib/tr/authMail/sendBoutiqueAuthEmail";

export const runtime = "nodejs";

type Body = {
  email?: string;
  boutiqueSlug?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const result = await sendBoutiqueSignupOtp({
    email: body.email ?? "",
    boutiqueSlug: body.boutiqueSlug ?? "",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true, otpType: result.otpType });
}
