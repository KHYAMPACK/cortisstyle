import { getStudioApiOrigin } from "../lib/studioIntegration";
import { getAccessToken } from "../lib/supabaseClient";

export async function verifyStudioCuratorAccess(): Promise<
  | { ok: true; email: string | null }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "error"; message?: string }
> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, reason: "unauthenticated" };
  }

  try {
    const response = await fetch(`${getStudioApiOrigin()}/api/studio/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 403) {
      let message: string | undefined;
      try {
        const body = (await response.json()) as { error?: string; code?: string };
        message = body.error;
      } catch {
        // ignore
      }
      return { ok: false, reason: "forbidden", message };
    }

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const body = (await response.json()) as { error?: string };
        detail = body.error;
      } catch {
        // ignore
      }

      if (response.status === 401) {
        return {
          ok: false,
          reason: "error",
          message:
            detail ??
            "Studio API rejected your session. Sign out and sign in again on cortisstyle.com.",
        };
      }

      return {
        ok: false,
        reason: "error",
        message: detail ?? `Session check failed (${response.status})`,
      };
    }

    const data = (await response.json()) as { user?: { email?: string | null } };
    return { ok: true, email: data.user?.email ?? null };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Unable to verify studio access";
    const message =
      raw === "Failed to fetch"
        ? "Could not reach the studio API. Confirm cortisstyle is running and you are signed in."
        : raw;

    return { ok: false, reason: "error", message };
  }
}
