"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { IntroLoader } from "@/components/IntroLoader";
import { safeAuthNextPath } from "@/lib/authRedirect";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { WARDROBE_APP_PATH } from "@/lib/wardrobeGate";

const RECOVERY_OTP_TYPES = new Set<string>([
  "recovery",
  "signup",
  "invite",
  "magiclink",
  "email",
  "email_change",
]);

async function establishSessionFromHash(
  supabase: ReturnType<typeof getSupabaseClient>,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return false;

  const hash = new URLSearchParams(raw);
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (!accessToken || !refreshToken) return false;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return !error;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState("VALIDATING ACCESS");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseClient();
    const nextPath = safeAuthNextPath(
      searchParams.get("next"),
      WARDROBE_APP_PATH,
    );
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const otpTypeRaw = searchParams.get("type");
    const authError = searchParams.get("error_description");

    const failTo = nextPath.includes("/auth/reset-password")
      ? nextPath
      : nextPath.includes("/giris")
        ? nextPath
        : "/";

    if (authError) {
      router.replace(
        `${failTo}${failTo.includes("?") ? "&" : "?"}auth_error=${encodeURIComponent(authError)}`,
      );
      return;
    }

    const finish = async () => {
      try {
        if (tokenHash && otpTypeRaw && RECOVERY_OTP_TYPES.has(otpTypeRaw)) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpTypeRaw as EmailOtpType,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Legacy admin action_link redirects (implicit hash tokens).
          await establishSessionFromHash(supabase);
        }

        for (let attempt = 0; attempt < 40; attempt += 1) {
          if (cancelled) return;

          if (attempt === 2) {
            await establishSessionFromHash(supabase);
          }

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            setStatusMessage("ACCESS GRANTED");
            const cleanUrl = nextPath.startsWith("/")
              ? nextPath
              : `/${nextPath}`;
            window.history.replaceState({}, "", cleanUrl);
            router.replace(cleanUrl);
            return;
          }

          await new Promise((resolve) => {
            window.setTimeout(resolve, 100);
          });
        }

        const expiredMsg = "access_link_expired";
        if (failTo === "/") {
          router.replace(`/?auth_error=${expiredMsg}`);
        } else {
          router.replace(
            `${failTo}${failTo.includes("?") ? "&" : "?"}auth_error=${expiredMsg}`,
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "access_link_invalid";
        if (failTo === "/") {
          router.replace(`/?auth_error=${encodeURIComponent(message)}`);
        } else {
          router.replace(
            `${failTo}${failTo.includes("?") ? "&" : "?"}auth_error=${encodeURIComponent(message)}`,
          );
        }
      }
    };

    void finish();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return <IntroLoader forceActive statusLabel={statusMessage} />;
}

export function AuthCallbackHandler() {
  return (
    <Suspense
      fallback={<IntroLoader forceActive statusLabel="VALIDATING ACCESS" />}
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
