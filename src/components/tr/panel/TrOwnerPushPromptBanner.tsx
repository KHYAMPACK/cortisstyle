"use client";

import { useEffect, useState } from "react";
import { panelHintClass, panelPrimaryBtnClass } from "@/components/tr/panel/panelUi";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  enableOwnerPush,
  getOwnerPushStatus,
  isOwnerPushSupported,
} from "@/lib/tr/ownerPush";

const DISMISS_KEY = "tr-panel-push-prompt-dismissed";

/**
 * One-time soft prompt on Siparişler when notification permission is still default.
 */
export function TrOwnerPushPromptBanner({ boutiqueId }: { boutiqueId: string }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        if (!isOwnerPushSupported()) return;
        if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
        const status = await getOwnerPushStatus(boutiqueId);
        if (!cancelled && (status === "default" || status === "granted_unsubscribed")) {
          setVisible(true);
        }
      } catch {
        /* ignore */
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Oturum gerekli.");
      await enableOwnerPush({ boutiqueId, accessToken: token });
      dismiss();
    } catch (enableError) {
      setError(
        enableError instanceof Error
          ? enableError.message
          : "Bildirimler açılamadı.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-4 py-4 shadow-sm sm:px-5">
      <p className="text-[17px] font-semibold text-neutral-900">
        Yeni sipariş bildirimi
      </p>
      <p className={`mt-1 ${panelHintClass}`}>
        Panel kapalıyken bile telefona haber gelsin. İstediğiniz zaman
        Ayarlar’dan kapatabilirsiniz.
      </p>
      {error ? (
        <p className="mt-2 text-[14px] text-red-700">{error}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void enable()}
          className={panelPrimaryBtnClass}
          style={{ backgroundColor: "var(--panel-accent)" }}
        >
          {busy ? "…" : "Bildirimleri aç"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex min-h-14 items-center justify-center rounded-xl px-5 py-3 text-[16px] font-semibold text-neutral-700"
        >
          Şimdi değil
        </button>
      </div>
    </div>
  );
}
