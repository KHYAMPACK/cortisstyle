"use client";

import { useEffect, useState } from "react";
import {
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  disableOwnerPush,
  enableOwnerPush,
  getOwnerPushStatus,
  type OwnerPushStatus,
} from "@/lib/tr/ownerPush";

function statusLabel(status: OwnerPushStatus): string {
  switch (status) {
    case "subscribed":
      return "Açık";
    case "denied":
      return "İzin reddedildi";
    case "unconfigured":
      return "Sunucu yapılandırması eksik";
    case "unsupported":
      return "Bu cihazda yok";
    case "granted_unsubscribed":
      return "Kapalı";
    case "default":
    default:
      return "Kapalı";
  }
}

function statusHint(status: OwnerPushStatus): string {
  switch (status) {
    case "subscribed":
      return "Yeni siparişlerde telefona bildirim gelir (panel kapalıyken de). iPhone’da Ana Ekrana Ekle şart; Android’de Chrome’un arka planda çalışmasına izin verin.";
    case "denied":
      return "Tarayıcı ayarlarından bildirim iznini açmanız gerekir.";
    case "unconfigured":
      return "Bildirimler henüz yapılandırılmadı (VAPID anahtarları).";
    case "unsupported":
      return "iPhone’da Ana Ekrana Ekle ile PWA olarak açın; Android’de Chrome yeterlidir.";
    default:
      return "Önce paneli Ana Ekrana ekleyin, sonra Bildirimleri aç’a basın. Kapalıyken de çalışması için tarayıcının arka planı engellenmemeli.";
  }
}

export function TrOwnerPushNotificationsCard({
  boutiqueId,
}: {
  boutiqueId: string;
}) {
  const [status, setStatus] = useState<OwnerPushStatus>("default");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await getOwnerPushStatus(boutiqueId));
    } catch {
      setStatus("unsupported");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [boutiqueId]);

  const getToken = async () => {
    const {
      data: { session },
    } = await getSupabaseClient().auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Oturum gerekli.");
    return token;
  };

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      const accessToken = await getToken();
      await enableOwnerPush({ boutiqueId, accessToken });
      await refresh();
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

  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      const accessToken = await getToken();
      await disableOwnerPush({ boutiqueId, accessToken });
      await refresh();
    } catch (disableError) {
      setError(
        disableError instanceof Error
          ? disableError.message
          : "Bildirimler kapatılamadı.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={panelSectionClass}>
      <p className="text-[19px] font-semibold text-neutral-900">
        Sipariş bildirimleri
      </p>
      <p className={`mt-2 ${panelHintClass}`}>{statusHint(status)}</p>
      <p className="mt-3 text-[16px] font-semibold text-neutral-800">
        Durum:{" "}
        <span style={{ color: "var(--panel-accent-deep)" }}>
          {loading ? "…" : statusLabel(status)}
        </span>
      </p>
      {error ? (
        <p className="mt-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {status === "subscribed" ? (
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => void disable()}
            className={panelSecondaryBtnClass}
          >
            {busy ? "…" : "Bildirimleri kapat"}
          </button>
        ) : (
          <button
            type="button"
            disabled={
              busy ||
              loading ||
              status === "unsupported" ||
              status === "unconfigured" ||
              status === "denied"
            }
            onClick={() => void enable()}
            className={panelPrimaryBtnClass}
            style={{ backgroundColor: "var(--panel-accent)" }}
          >
            {busy ? "…" : "Bildirimleri aç"}
          </button>
        )}
      </div>
    </section>
  );
}
