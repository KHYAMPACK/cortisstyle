"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  TrPanelFadeIn,
  TrPanelLoading,
  trPanelFadeTransition,
} from "@/components/tr/panel/TrPanelMotion";
import {
  fetchOwnerBoutiqueSettings,
  updateOwnerBoutiqueSettings,
  type TrOwnerBoutiqueSettings,
} from "@/lib/tr/ownerClient";
import { trBoutiquePath, trPanelPath } from "@/lib/tr/paths";

function SettingsForm({ boutiqueId }: { boutiqueId: string }) {
  const [settings, setSettings] = useState<TrOwnerBoutiqueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [themeAccent, setThemeAccent] = useState("");
  const [shippingNote, setShippingNote] = useState("");
  const [exchangePolicy, setExchangePolicy] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerBoutiqueSettings(boutiqueId);
        if (cancelled) return;
        setSettings(result);
        setDescription(result.description ?? "");
        setLogoUrl(result.logoUrl ?? "");
        setWhatsappPhone(result.whatsappPhone ?? "");
        setInstagramHandle(result.instagramHandle ?? "");
        setThemeAccent(result.themeAccent ?? "");
        setShippingNote(result.shippingNote ?? "");
        setExchangePolicy(result.exchangePolicy ?? "");
        setPhysicalAddress(result.physicalAddress ?? "");
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Ayarlar yüklenemedi.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateOwnerBoutiqueSettings(boutiqueId, {
        description: description.trim() || null,
        logoUrl: logoUrl.trim() || null,
        whatsappPhone: whatsappPhone.trim() || null,
        instagramHandle: instagramHandle.trim() || null,
        themeAccent: themeAccent.trim() || null,
        shippingNote: shippingNote.trim() || null,
        exchangePolicy: exchangePolicy.trim() || null,
        physicalAddress: physicalAddress.trim() || null,
      });
      setSettings(updated);
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kayıt başarısız.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <TrPanelLoading label="Ayarlar yükleniyor…" />;
  }

  const fieldClass =
    "w-full border border-black/15 bg-white px-3 py-3 text-[14px] outline-none focus:border-black/40";

  return (
    <TrPanelFadeIn>
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-[13px] text-neutral-600">
          {settings?.name} — mağaza iletişim ve politika alanları.
        </p>

        {settings?.slug ? (
          <div className="space-y-2 border border-black/10 bg-neutral-50 px-4 py-3 text-[13px] text-neutral-700">
            <p>
              Vitrin:{" "}
              <Link
                href={trBoutiquePath(settings.slug)}
                className="underline underline-offset-2"
                target="_blank"
              >
                /tr/{settings.slug}
              </Link>
            </p>
            <p className="text-[15px] text-neutral-600">
              Özel alan adı DNS ile bağlandığında (ör. pervinsoysal.com) aynı
              vitrin o adreste açılır.
            </p>
          </div>
        ) : null}

        <label className="block space-y-2">
          <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Açıklama
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={fieldClass}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Logo URL
          </span>
          <input
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            className={fieldClass}
            placeholder="/tr/boutiques/.../logo.svg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            WhatsApp (ülke kodu ile)
          </span>
          <input
            value={whatsappPhone}
            onChange={(event) => setWhatsappPhone(event.target.value)}
            className={fieldClass}
            placeholder="90543..."
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Instagram
          </span>
          <input
            value={instagramHandle}
            onChange={(event) => setInstagramHandle(event.target.value)}
            className={fieldClass}
            placeholder="pervinsoysalbutik"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Tema rengi (accent)
          </span>
          <div className="flex gap-3">
            <input
              type="color"
              value={themeAccent.trim() || "#C2185B"}
              onChange={(event) => setThemeAccent(event.target.value)}
              className="h-12 w-14 shrink-0 cursor-pointer border border-black/15 bg-white p-1"
              aria-label="Tema rengi seç"
            />
            <input
              value={themeAccent}
              onChange={(event) => setThemeAccent(event.target.value)}
              className={fieldClass}
              placeholder="#C2185B"
            />
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Kargo notu
          </span>
          <input
            value={shippingNote}
            onChange={(event) => setShippingNote(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Değişim / iade
          </span>
          <input
            value={exchangePolicy}
            onChange={(event) => setExchangePolicy(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] tracking-[0.12em] text-neutral-700 uppercase">
            Adres
          </span>
          <textarea
            value={physicalAddress}
            onChange={(event) => setPhysicalAddress(event.target.value)}
            rows={2}
            className={fieldClass}
          />
        </label>

        <AnimatePresence>
          {error ? (
            <motion.p
              key="settings-error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={trPanelFadeTransition}
              className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
            >
              {error}
            </motion.p>
          ) : null}
          {saved ? (
            <motion.p
              key="settings-saved"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={trPanelFadeTransition}
              className="border border-black/10 bg-neutral-50 px-4 py-3 text-[13px] text-neutral-700"
            >
              Kaydedildi. Mağaza sayfasında güncellenir.
            </motion.p>
          ) : null}
        </AnimatePresence>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex w-full items-center justify-center gap-2 px-6 py-4 text-[11px] tracking-[0.16em] disabled:opacity-50"
        >
          {saving ? (
            <>
              <motion.span
                aria-hidden
                className="inline-block h-3 w-3 border border-current border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
              Kaydediliyor…
            </>
          ) : (
            "Kaydet"
          )}
        </button>
      </form>
    </TrPanelFadeIn>
  );
}

export function TrOwnerSettingsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <div className="space-y-6">
          <Link
            href={trPanelPath()}
            className="inline-block text-[11px] tracking-[0.1em] text-neutral-500 uppercase"
          >
            ← Ana sayfa
          </Link>
          <h2 className="font-serif text-2xl tracking-tight text-neutral-950">
            Ayarlar
          </h2>
          <SettingsForm boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
