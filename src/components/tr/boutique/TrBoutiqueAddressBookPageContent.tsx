"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Plus, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AuthPopup } from "@/components/AuthPopup";
import {
  customerAddressFormClientError,
  customerAddressFormToInput,
  emptyCustomerAddressForm,
  formFromCustomerAddress,
  TrCustomerAddressFormFields,
  type TrCustomerAddressFormState,
} from "@/components/tr/commerce/TrCustomerAddressFormFields";
import { TrBoutiquePendingLink } from "@/components/tr/boutique/editorial/TrBoutiqueNavPending";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import { useAuth } from "@/context/AuthContext";
import {
  createCustomerAddressRequest,
  deleteCustomerAddressRequest,
  fetchCustomerAddresses,
  updateCustomerAddressRequest,
} from "@/lib/tr/commerce/customerAddressesClient";
import { TR_CUSTOMER_ADDRESS_MAX } from "@/lib/tr/commerce/customerAddressLimits";
import {
  resolveBoutiqueBrandLabel,
  resolveBoutiqueLogoUrl,
  resolveBoutiqueThemeAccent,
} from "@/lib/tr/boutiqueBrand";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  trBoutiqueAddressesPath,
  trBoutiqueAuthPath,
  trBoutiqueLegalPath,
} from "@/lib/tr/paths";
import type { TrBoutiquePublic, TrCustomerAddress } from "@/types/tr-marketplace";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

async function recordRegistrationSource(boutiqueSlug: string) {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch("/api/tr/customer/registration-source", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        boutiqueSlug,
        host: typeof window !== "undefined" ? window.location.host : null,
      }),
    });
  } catch {
    // Attribution is best-effort
  }
}

function formatAddressLine(address: TrCustomerAddress): string {
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  return `${street} · ${address.district} / ${address.city} ${address.postalCode}`;
}

export function TrBoutiqueAddressBookPageContent({
  boutique,
}: {
  boutique: TrBoutiquePublic;
}) {
  const { user, isAuthenticated, needsPasswordSetup } = useAuth();
  const accent = resolveBoutiqueThemeAccent(boutique);
  const logoUrl = resolveBoutiqueLogoUrl(boutique);
  const brandTitle = resolveBoutiqueBrandLabel(boutique.slug, boutique.name);
  const [authOpen, setAuthOpen] = useState(false);
  const [addresses, setAddresses] = useState<TrCustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<"create" | TrCustomerAddress | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchCustomerAddresses();
      if (result.ok) {
        setAddresses(result.addresses);
      } else {
        setLoadError(result.error);
      }
    } catch {
      setLoadError("Adresler yüklenemedi.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (needsPasswordSetup) setAuthOpen(true);
  }, [needsPasswordSetup]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    void load();
  }, [isAuthenticated, load]);

  const atCap = addresses.length >= TR_CUSTOMER_ADDRESS_MAX;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 pb-24 md:px-8 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: trPanelEase }}
      >
        <TrBoutiquePendingLink
          href={trBoutiqueAuthPath(boutique.slug)}
          kind="account"
          className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase transition-opacity hover:opacity-70"
        >
          ← Hesabım
        </TrBoutiquePendingLink>
        <h1 className="mt-5 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
          Adreslerim
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-neutral-600">
          Kayıtlı teslimat adresleriniz tüm {brandTitle} ve diğer mağaza
          siparişlerinizde kullanılabilir.
        </p>
      </motion.div>

      {!isAuthenticated ? (
        <>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="editorial-promo-cta mt-8 w-full px-5 py-3.5 text-[11px] tracking-[0.18em] text-white uppercase transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            Giriş yap
          </button>
          <p className="mt-6 text-center text-[12px] leading-relaxed text-neutral-500">
            Adres defteri için üye girişi gerekir.
          </p>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: trPanelEase, delay: 0.05 }}
          className="mt-8 space-y-4"
        >
          <button
            type="button"
            disabled={atCap}
            onClick={() => setEditor("create")}
            className="flex min-h-12 w-full items-center justify-center gap-2 border border-black/15 bg-white px-4 py-3.5 text-[11px] tracking-[0.16em] uppercase transition-colors hover:border-brand-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Yeni adres
          </button>
          {atCap ? (
            <p className="text-[12px] text-neutral-500">
              En fazla {TR_CUSTOMER_ADDRESS_MAX} adres kaydedebilirsiniz.
            </p>
          ) : null}

          {loading ? (
            <div
              className="space-y-3"
              role="status"
              aria-live="polite"
              aria-label="Adresler yükleniyor"
            >
              {Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="tr-skeleton-bone h-28 w-full"
                />
              ))}
            </div>
          ) : loadError ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {loadError}
            </p>
          ) : addresses.length === 0 ? (
            <div className="border border-dashed border-black/15 px-4 py-12 text-center">
              <MapPin
                className="mx-auto h-6 w-6 text-neutral-300"
                strokeWidth={1.25}
              />
              <p className="mt-3 text-[13px] text-neutral-600">
                Kayıtlı adres yok. Ödeme sırasında da kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {addresses.map((address, index) => (
                <motion.li
                  key={address.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: trPanelEase,
                    delay: Math.min(index * 0.04, 0.2),
                  }}
                  className="border border-black/8 bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium tracking-[0.06em] text-neutral-950 uppercase">
                        {address.label}
                        {address.isDefault ? (
                          <span className="ml-2 text-[10px] font-normal tracking-[0.14em] text-brand-primary">
                            Varsayılan
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-[13px] text-neutral-800">
                        {address.recipientName}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                        {formatAddressLine(address)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    <button
                      type="button"
                      onClick={() => setEditor(address)}
                      className="min-h-11 text-[13px] text-neutral-800 underline underline-offset-4"
                    >
                      Düzenle
                    </button>
                    {!address.isDefault ? (
                      <button
                        type="button"
                        disabled={busyId === address.id}
                        onClick={() => {
                          setBusyId(address.id);
                          void updateCustomerAddressRequest(address.id, {
                            isDefault: true,
                          }).then((result) => {
                            setBusyId(null);
                            if (result.ok) void load();
                            else setLoadError(result.error);
                          });
                        }}
                        className="min-h-11 text-[13px] text-neutral-800 underline underline-offset-4 disabled:opacity-50"
                      >
                        Varsayılan yap
                      </button>
                    ) : null}
                    {deleteId === address.id ? (
                      <span className="flex flex-wrap items-center gap-2 text-[13px] text-red-800">
                        Silinsin mi?
                        <button
                          type="button"
                          disabled={busyId === address.id}
                          onClick={() => {
                            setBusyId(address.id);
                            void deleteCustomerAddressRequest(address.id).then(
                              (result) => {
                                setBusyId(null);
                                setDeleteId(null);
                                if (result.ok) void load();
                                else setLoadError(result.error);
                              },
                            );
                          }}
                          className="underline underline-offset-4"
                        >
                          Evet, sil
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(null)}
                          className="text-neutral-600 underline underline-offset-4"
                        >
                          Vazgeç
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteId(address.id)}
                        className="min-h-11 text-[13px] text-neutral-500 underline underline-offset-4 hover:text-red-700"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

      <AddressEditorSheet
        editor={editor}
        accent={accent}
        defaults={{
          recipientName: [user?.firstName, user?.lastName]
            .filter(Boolean)
            .join(" "),
          phone: user?.phone ?? "",
        }}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          void load();
        }}
      />

      <AuthPopup
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={async (meta) => {
          if (meta?.isNewAccount) {
            await recordRegistrationSource(boutique.slug);
          }
          setAuthOpen(false);
        }}
        description={`${brandTitle} için giriş yapın. Adresleriniz hesabınıza kaydedilir.`}
        brand={{
          logoUrl,
          logoAlt: boutique.name,
          eyebrow: brandTitle,
          successHref: trBoutiqueAddressesPath(boutique.slug),
          termsHref: trBoutiqueLegalPath(boutique.slug, "uyelik"),
          privacyHref: trBoutiqueLegalPath(boutique.slug, "gizlilik"),
          locale: "tr",
          accent,
          boutiqueSlug: boutique.slug,
        }}
      />
    </div>
  );
}

function AddressEditorSheet({
  editor,
  accent,
  defaults,
  onClose,
  onSaved,
}: {
  editor: "create" | TrCustomerAddress | null;
  accent: string;
  defaults: { recipientName: string; phone: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<TrCustomerAddressFormState>(
    emptyCustomerAddressForm(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!editor) return;
    setError(null);
    setForm(
      editor === "create"
        ? emptyCustomerAddressForm(defaults)
        : formFromCustomerAddress(editor),
    );
  }, [editor, defaults.recipientName, defaults.phone]);

  useEffect(() => {
    if (!editor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [editor, saving, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const clientError = customerAddressFormClientError(form);
    if (clientError) {
      setError(clientError);
      return;
    }
    setSaving(true);
    setError(null);
    const input = customerAddressFormToInput(form);
    const result =
      editor && editor !== "create"
        ? await updateCustomerAddressRequest(editor.id, input)
        : await createCustomerAddressRequest(input);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {editor ? (
        <>
          <motion.button
            key="address-edit-backdrop"
            type="button"
            aria-label="Kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: trPanelEase }}
            onClick={() => {
              if (!saving) onClose();
            }}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
          />
          <div className="pointer-events-none fixed inset-0 z-[110] flex items-end justify-center md:items-center md:p-4">
            <motion.form
              key="address-edit-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={spring}
              onSubmit={(event) => void handleSubmit(event)}
              className="pointer-events-auto relative max-h-[92vh] w-full overflow-y-auto border border-black/10 bg-white px-5 py-6 shadow-2xl md:w-[min(92vw,480px)] md:px-8 md:py-8"
            >
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label="Kapat"
                className="absolute right-4 top-4 min-h-11 min-w-11 text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-50"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <h2
                id={titleId}
                className="pr-10 font-serif text-xl text-neutral-950 md:text-2xl"
              >
                {editor === "create" ? "Yeni adres" : "Adresi düzenle"}
              </h2>
              <div className="mt-6">
                <TrCustomerAddressFormFields
                  form={form}
                  onChange={(patch) =>
                    setForm((current) => ({ ...current, ...patch }))
                  }
                />
              </div>
              {error ? (
                <p className="mt-4 text-[13px] text-red-700">{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="mt-8 w-full min-h-12 px-5 py-3.5 text-[11px] tracking-[0.18em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-70"
                style={{ backgroundColor: accent }}
              >
                {saving ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span
                      aria-hidden
                      className="h-3 w-3 animate-spin border border-white/40 border-t-white"
                    />
                    Kaydediliyor
                  </span>
                ) : (
                  "Kaydet"
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="mt-3 w-full py-2 text-center text-[13px] text-neutral-600 underline underline-offset-4 disabled:opacity-50"
              >
                Vazgeç
              </button>
            </motion.form>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
