"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthPopup } from "@/components/AuthPopup";
import { IntroLoader } from "@/components/IntroLoader";
import { StudioAccessDenied } from "@/components/StudioAccessDenied";
import { useAuth } from "@/context/AuthContext";
import { getSiteUrl } from "@/lib/authRedirect";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  buildStudioSessionHandoffUrl,
  isExternalStudioOrigin,
  resolveStudioReturnTo,
} from "@/lib/studioRedirect";

type GateState = "loading" | "login" | "denied" | "handoff";

async function verifyCuratorSession(): Promise<
  "allowed" | "denied" | "missing" | "error"
> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return "missing";

  try {
    const response = await fetch("/api/studio/session", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (response.status === 403) return "denied";
    if (!response.ok) return "error";

    return "allowed";
  } catch {
    return "error";
  }
}

function handoffToStudio(
  returnTo: string,
  accessToken: string,
  refreshToken: string,
): void {
  window.location.replace(
    buildStudioSessionHandoffUrl(returnTo, accessToken, refreshToken),
  );
}

function StudioAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isInitializing, user } = useAuth();
  const [gateState, setGateState] = useState<GateState>("loading");
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const returnTo = resolveStudioReturnTo(searchParams.get("returnTo"));

  const completeStudioEntry = useCallback(async () => {
    const access = await verifyCuratorSession();

    if (access === "missing") {
      setGateState("login");
      setShowAuthPopup(true);
      return;
    }

    if (access === "denied") {
      setGateState("denied");
      return;
    }

    if (access === "error") {
      setErrorMessage(
        "Could not verify studio access. Ensure cortisstyle dev server is running and SUPABASE_SERVICE_ROLE_KEY is set.",
      );
      setGateState("denied");
      return;
    }

    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setGateState("login");
      setShowAuthPopup(true);
      return;
    }

    if (isExternalStudioOrigin(returnTo, getSiteUrl())) {
      setGateState("handoff");
      handoffToStudio(returnTo, session.access_token, session.refresh_token);
      return;
    }

    router.replace(returnTo);
  }, [returnTo, router]);

  useEffect(() => {
    if (isInitializing) return;

    if (!isSupabaseConfigured()) {
      router.replace("/?auth_error=supabase_not_configured");
      return;
    }

    if (!isAuthenticated) {
      setGateState("login");
      setShowAuthPopup(true);
      return;
    }

    void completeStudioEntry();
  }, [isAuthenticated, isInitializing, completeStudioEntry, router]);

  const onAuthSuccess = async () => {
    setShowAuthPopup(false);
    setGateState("loading");
    await completeStudioEntry();
  };

  if (isInitializing || gateState === "loading" || gateState === "handoff") {
    return <IntroLoader forceActive statusLabel="VALIDATING STUDIO ACCESS" />;
  }

  if (gateState === "denied") {
    return (
      <StudioAccessDenied
        email={user?.email}
        message={errorMessage ?? undefined}
      />
    );
  }

  return (
    <AuthPopup
      isOpen={showAuthPopup}
      onClose={() => {
        window.location.href = getSiteUrl();
      }}
      onAuthSuccess={() => {
        void onAuthSuccess();
      }}
      description="Sign in with your curator archive profile to open Lookbook Studio."
    />
  );
}

export default function StudioAuthPage() {
  return (
    <Suspense
      fallback={<IntroLoader forceActive statusLabel="VALIDATING STUDIO ACCESS" />}
    >
      <StudioAuthContent />
    </Suspense>
  );
}
