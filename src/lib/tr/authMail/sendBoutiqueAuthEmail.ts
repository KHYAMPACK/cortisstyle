import {
  buildPasswordResetCallbackUrl,
  getPasswordResetRedirectUrl,
  getSiteUrl,
  resolveAuthRedirectOrigin,
} from "@/lib/authRedirect";
import { isValidNotifyEmail, getServiceSupabase } from "@/lib/supabaseAdmin";
import { sendPlatformEmail, isPlatformMailConfigured } from "@/lib/mail/sendPlatformEmail";
import { getPublicBoutiqueBySlug } from "@/lib/tr/boutiques";
import { trBoutiqueAuthPath } from "@/lib/tr/paths";
import {
  buildPasswordResetEmail,
  buildSignupOtpEmail,
  resolveBoutiqueAuthMailBrand,
} from "@/lib/tr/authMail/templates";

function randomSignupPassword(): string {
  return crypto.randomUUID().replaceAll("-", "") + "Aa1!";
}

export async function sendBoutiqueSignupOtp(input: {
  email: string;
  boutiqueSlug: string;
}): Promise<
  | { ok: true; otpType: "signup" | "magiclink" }
  | { ok: false; error: string; status: number }
> {
  if (!isPlatformMailConfigured()) {
    return {
      ok: false,
      error: "Branded email is not configured (RESEND_API_KEY).",
      status: 503,
    };
  }

  const email = input.email.trim().toLowerCase();
  const boutiqueSlug = input.boutiqueSlug.trim().toLowerCase();

  if (!isValidNotifyEmail(email)) {
    return { ok: false, error: "Geçerli bir e-posta girin.", status: 400 };
  }

  const admin = getServiceSupabase();
  if (!admin) {
    return { ok: false, error: "Auth servisi yapılandırılmamış.", status: 503 };
  }

  const boutique = await getPublicBoutiqueBySlug(boutiqueSlug, admin);
  if (!boutique) {
    return { ok: false, error: "Butik bulunamadı.", status: 404 };
  }

  const brand = resolveBoutiqueAuthMailBrand(boutique);

  // Prefer signup link (creates user + OTP). If the user already exists,
  // fall back to magiclink OTP (still verified client-side).
  let emailOtp: string | null = null;
  let otpType: "signup" | "magiclink" = "signup";

  const signup = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password: randomSignupPassword(),
  });

  if (!signup.error && signup.data.properties?.email_otp) {
    emailOtp = signup.data.properties.email_otp;
    otpType = "signup";
  } else {
    const magic = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (magic.error || !magic.data.properties?.email_otp) {
      const message =
        signup.error?.message ||
        magic.error?.message ||
        "Doğrulama kodu oluşturulamadı.";
      return { ok: false, error: message, status: 400 };
    }
    emailOtp = magic.data.properties.email_otp;
    otpType = "magiclink";
  }

  const content = buildSignupOtpEmail({ brand, otp: emailOtp });

  try {
    await sendPlatformEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      fromName: brand.name,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "E-posta gönderilemedi.";
    return { ok: false, error: message, status: 502 };
  }

  return { ok: true, otpType };
}

export async function sendBoutiquePasswordReset(input: {
  email: string;
  boutiqueSlug: string;
  /** Browser Origin when reset was requested (custom domain preferred). */
  requestOrigin?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (!isPlatformMailConfigured()) {
    return {
      ok: false,
      error: "Branded email is not configured (RESEND_API_KEY).",
      status: 503,
    };
  }

  const email = input.email.trim().toLowerCase();
  const boutiqueSlug = input.boutiqueSlug.trim().toLowerCase();

  if (!isValidNotifyEmail(email)) {
    return { ok: false, error: "Geçerli bir e-posta girin.", status: 400 };
  }

  const admin = getServiceSupabase();
  if (!admin) {
    return { ok: false, error: "Auth servisi yapılandırılmamış.", status: 503 };
  }

  const boutique = await getPublicBoutiqueBySlug(boutiqueSlug, admin);
  if (!boutique) {
    return { ok: false, error: "Butik bulunamadı.", status: 404 };
  }

  const brand = resolveBoutiqueAuthMailBrand(boutique);
  const siteOrigin = resolveAuthRedirectOrigin({
    requestOrigin: input.requestOrigin,
    customDomain: boutique.customDomain,
  });
  // On boutique custom domain, return to short /giris; on platform host, full boutique path.
  const nextPath =
    siteOrigin === getSiteUrl()
      ? trBoutiqueAuthPath(boutiqueSlug)
      : "/giris";
  const redirectTo = getPasswordResetRedirectUrl({
    nextPath,
    siteOrigin,
    boutiqueSlug,
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  // Always return ok for unknown emails (avoid account enumeration).
  const tokenHash = data?.properties?.hashed_token?.trim();
  if (error || !tokenHash) {
    console.error("Boutique password reset generateLink:", error?.message);
    return { ok: true };
  }

  // Own callback URL with token_hash — do not email action_link (implicit/hash flow
  // breaks under the browser client's PKCE session handling).
  const resetUrl = buildPasswordResetCallbackUrl({
    tokenHash,
    nextPath,
    siteOrigin,
    boutiqueSlug,
  });
  const content = buildPasswordResetEmail({ brand, resetUrl });

  try {
    await sendPlatformEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      fromName: brand.name,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "E-posta gönderilemedi.";
    return { ok: false, error: message, status: 502 };
  }

  return { ok: true };
}
