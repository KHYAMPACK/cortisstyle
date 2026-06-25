"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IntroLoader } from "@/components/IntroLoader";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { WARDROBE_APP_PATH } from "@/lib/wardrobeGate";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState(
    "VALIDATING STUDIO ACCESS",
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseClient();
    const nextPath = searchParams.get("next") || WARDROBE_APP_PATH;
    const code = searchParams.get("code");
    const authError = searchParams.get("error_description");

    if (authError) {
      router.replace(`/?auth_error=${encodeURIComponent(authError)}`);
      return;
    }

    const finish = async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        for (let attempt = 0; attempt < 30; attempt += 1) {
          if (cancelled) return;

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            setStatusMessage("STUDIO ACCESS GRANTED");
            window.history.replaceState({}, "", nextPath);
            router.replace(nextPath);
            return;
          }

          await new Promise((resolve) => {
            window.setTimeout(resolve, 120);
          });
        }

        router.replace("/?auth_error=access_link_expired");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "access_link_invalid";
        router.replace(`/?auth_error=${encodeURIComponent(message)}`);
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
    <Suspense fallback={<IntroLoader forceActive statusLabel="VALIDATING STUDIO ACCESS" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
