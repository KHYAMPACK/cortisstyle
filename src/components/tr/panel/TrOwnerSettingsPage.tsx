"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrOwnerPushNotificationsCard } from "@/components/tr/panel/TrOwnerPushNotificationsCard";
import {
  panelBackLinkClass,
  panelFieldClass,
  panelHintClass,
  panelLabelClass,
  panelPageTitleClass,
  panelPrimaryBtnClass,
  panelSectionClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelBusySpinner,
  TrPanelFadeIn,
  TrPanelListSkeleton,
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
  const [legalName, setLegalName] = useState("");
  const [vergiNo, setVergiNo] = useState("");
  const [iban, setIban] = useState("");

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
        setLegalName(result.legalName ?? "");
        setVergiNo(result.vergiNo ?? "");
        setIban(result.iban ?? "");
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
        legalName: legalName.trim() || null,
        vergiNo: vergiNo.trim() || null,
        iban: iban.trim() || null,
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
    return <TrPanelListSkeleton rows={6} label="Ayarlar yükleniyor" />;
  }

  return (
    <TrPanelFadeIn>
      <form onSubmit={handleSubmit} className={`${panelSectionClass} space-y-6`}>
        <p className={panelHintClass}>
          {settings?.name} — mağaza iletişim ve politika alanları.
        </p>

        {settings?.slug ? (
          <div className={`${panelHintClass} rounded-xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] px-4 py-3`}>
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
          <span className={panelLabelClass}>
            Açıklama
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={panelFieldClass}
          />
        </label>

        <label className="block space-y-2">
          <span className={panelLabelClass}>
            Logo URL
          </span>
          <input
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            className={panelFieldClass}
            placeholder="/tr/boutiques/.../logo.svg"
          />
        </label>

        <label className="block space-y-2">
          <span className={panelLabelClass}>
            WhatsApp (ülke kodu ile)
          </span>
          <input
            value={whatsappPhone}
            onChange={(event) => setWhatsappPhone(event.target.value)}
            className={panelFieldClass}
            placeholder="90543..."
          />
        </label>

        <label className="block space-y-2">
          <span className={panelLabelClass}>
            Instagram
          </span>
          <input
            value={instagramHandle}
            onChange={(event) => setInstagramHandle(event.target.value)}
            className={panelFieldClass}
            placeholder="pervinsoysalbutik"
          />
        </label>

        <label className="block space-y-2">
          <span className={panelLabelClass}>
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
              className={panelFieldClass}
              placeholder="#C2185B"
            />
          </div>
        </label>

        <label className="block space-y-2">
          <span className={panelLabelClass}>
            Kargo notu
          </span>
          <input
            value={shippingNote}
            onChange={(event) => setShippingNote(event.target.value)}
            className={panelFieldClass}
          />
        </label>

        <label className="block space-y-2">
          <span className={panelLabelClass}>
            Değişim / iade
          </span>
          <input
            value={exchangePolicy}
            onChange={(event) => setExchangePolicy(event.target.value)}
            className={panelFieldClass}
          />
        </label>

        <label className="block space-y-2">
          <span className={panelLabelClass}>
            Adres
          </span>
          <textarea
            value={physicalAddress}
            onChange={(event) => setPhysicalAddress(event.target.value)}
            rows={2}
            className={panelFieldClass}
          />
        </label>

        <div className="space-y-4 border border-black/10 bg-neutral-50 px-4 py-4">
          <div>
            <p className={panelLabelClass}>
              Satıcı / fatura bilgileri
            </p>
            <p className="mt-1 text-[12px] text-neutral-600">
              Vergi levhası ve IBAN buraya yazılır (owner-only). Kimlik /
              ikametgah belgelerini panele yüklemeyin; iyzico KYC için ayrı
              saklayın.
            </p>
          </div>
          <label className="block space-y-2">
            <span className={panelLabelClass}>
              Ticari unvan / satıcı adı
            </span>
            <input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              className={panelFieldClass}
              placeholder="Şahıs: Ad Soyad (vergi levhası)"
            />
          </label>
          <label className="block space-y-2">
            <span className={panelLabelClass}>
              Vergi no
            </span>
            <input
              value={vergiNo}
              onChange={(event) => setVergiNo(event.target.value)}
              className={panelFieldClass}
              inputMode="numeric"
              autoComplete="off"
            />
          </label>
          <label className="block space-y-2">
            <span className={panelLabelClass}>
              IBAN
            </span>
            <input
              value={iban}
              onChange={(event) => setIban(event.target.value)}
              className={panelFieldClass}
              placeholder="TR…"
              autoComplete="off"
            />
          </label>
        </div>

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
              className="rounded-xl border border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] px-4 py-3 text-[15px] text-neutral-700"
            >
              Kaydedildi. Mağaza sayfasında güncellenir.
            </motion.p>
          ) : null}
        </AnimatePresence>

        <button
          type="submit"
          disabled={saving}
          className={`${panelPrimaryBtnClass} w-full gap-3`}
        >
          {saving ? (
            <>
              <TrPanelBusySpinner />
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
          <div>
            <Link href={trPanelPath()} className={panelBackLinkClass}>
              ← Giriş
            </Link>
            <h2 className={panelPageTitleClass}>Ayarlar</h2>
          </div>
          <TrOwnerPushNotificationsCard boutiqueId={activeBoutique.id} />
          <SettingsForm boutiqueId={activeBoutique.id} />
        </div>
      )}
    </TrOwnerPanelGate>
  );
}
