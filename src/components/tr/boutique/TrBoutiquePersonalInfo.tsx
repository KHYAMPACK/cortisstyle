"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { FormEvent, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { localizeAuthError } from "@/lib/auth/authErrorMessage";
import { normalizeCustomerPhone } from "@/lib/auth/customerProfileFields";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import type { AuthUser } from "@/types/user";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const inputClass =
  "mt-1.5 w-full border border-black/20 bg-white px-3 py-3 text-left text-[14px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 disabled:opacity-60";

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "—";
}

type Editor = "name" | "phone";

export function TrBoutiquePersonalInfo({
  user,
  accent,
}: {
  user: AuthUser;
  accent: string;
}) {
  const { updateAccountProfile } = useAuth();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editor === "name") {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
    if (editor === "phone") {
      setPhone(normalizeCustomerPhone(user.phone ?? ""));
    }
    setPhoneError(false);
    setSaveError(null);
  }, [editor, user.firstName, user.lastName, user.phone]);

  useEffect(() => {
    if (!editor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setEditor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, saving]);

  const closeEditor = () => {
    if (saving) return;
    setEditor(null);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;

    setSaving(true);
    setSaveError(null);
    setPhoneError(false);

    try {
      if (editor === "name") {
        await updateAccountProfile({ firstName, lastName });
      } else {
        await updateAccountProfile({ phone });
      }
      setEditor(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Kaydedilemedi.";
      if (message.includes("telefon")) {
        setPhoneError(true);
        setSaveError("Telefon girdiyseniz 10–15 haneli bir numara yazın.");
      } else {
        setSaveError(localizeAuthError(message, "tr") ?? "Kaydedilemedi. Tekrar deneyin.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Kişisel bilgiler">
      <p className="mb-3 text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
        Kişisel bilgiler
      </p>
      <div className="space-y-8 border border-black/8 bg-white px-5 py-6">
        <InfoGroup
          rows={[
            { label: "Ad", value: displayValue(user.firstName) },
            { label: "Soyad", value: displayValue(user.lastName) },
          ]}
          onEdit={() => setEditor("name")}
        />
        <InfoGroup
          rows={[{ label: "E-posta", value: displayValue(user.email) }]}
        />
        <InfoGroup
          rows={[{ label: "Telefon", value: displayValue(user.phone) }]}
          onEdit={() => setEditor("phone")}
        />
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {editor ? (
                <ProfileEditModal
                  editor={editor}
                  accent={accent}
                  firstName={firstName}
                  lastName={lastName}
                  phone={phone}
                  phoneError={phoneError}
                  saveError={saveError}
                  saving={saving}
                  onFirstName={setFirstName}
                  onLastName={setLastName}
                  onPhone={(value) => {
                    setPhone(normalizeCustomerPhone(value));
                    setPhoneError(false);
                    setSaveError(null);
                  }}
                  onClose={closeEditor}
                  onSubmit={handleSave}
                />
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </section>
  );
}

function InfoGroup({
  rows,
  onEdit,
}: {
  rows: { label: string; value: string }[];
  onEdit?: () => void;
}) {
  return (
    <div>
      {rows.map((row) => (
        <p key={row.label} className="text-[14px] leading-7 text-neutral-900">
          <span className="font-medium">{row.label}:</span>{" "}
          <span className={row.value === "—" ? "text-neutral-400" : undefined}>
            {row.value}
          </span>
        </p>
      ))}
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="mt-2 text-[13px] text-neutral-700 underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Düzenle
        </button>
      ) : null}
    </div>
  );
}

function ProfileEditModal({
  editor,
  accent,
  firstName,
  lastName,
  phone,
  phoneError,
  saveError,
  saving,
  onFirstName,
  onLastName,
  onPhone,
  onClose,
  onSubmit,
}: {
  editor: Editor;
  accent: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneError: boolean;
  saveError: string | null;
  saving: boolean;
  onFirstName: (value: string) => void;
  onLastName: (value: string) => void;
  onPhone: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const titleId = useId();
  const title =
    editor === "name" ? "Kişisel bilgileri düzenle" : "Telefonu düzenle";

  return (
    <>
      <motion.button
        key="profile-edit-backdrop"
        type="button"
        aria-label="Kapat"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: trPanelEase }}
        onClick={onClose}
        className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
      />
      <div className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.form
          key="profile-edit-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={spring}
          onSubmit={onSubmit}
          className="pointer-events-auto relative w-[min(92vw,420px)] border border-black/10 bg-white px-6 py-8 shadow-2xl md:px-8"
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Kapat"
            className="absolute right-4 top-4 text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-50"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <h2
            id={titleId}
            className="pr-8 text-center font-serif text-xl text-neutral-950 md:text-2xl"
          >
            {title}
          </h2>

          <div className="mt-8 flex flex-col gap-4">
            {editor === "name" ? (
              <>
                <label className="block text-[11px] font-medium tracking-[0.14em] text-neutral-800 uppercase">
                  Ad
                  <input
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => onFirstName(event.target.value)}
                    disabled={saving}
                    className={inputClass}
                    placeholder="Adınız"
                  />
                </label>
                <label className="block text-[11px] font-medium tracking-[0.14em] text-neutral-800 uppercase">
                  Soyad
                  <input
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => onLastName(event.target.value)}
                    disabled={saving}
                    className={inputClass}
                    placeholder="Soyadınız"
                  />
                </label>
              </>
            ) : (
              <label className="block text-[11px] font-medium tracking-[0.14em] text-neutral-800 uppercase">
                Telefon
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={15}
                  value={phone}
                  onChange={(event) => onPhone(event.target.value)}
                  disabled={saving}
                  aria-invalid={phoneError}
                  className={
                    phoneError
                      ? `${inputClass} border-red-600 focus:border-red-600`
                      : inputClass
                  }
                  placeholder="05XXXXXXXXX"
                />
              </label>
            )}
          </div>

          {saveError ? (
            <p className="mt-4 text-center text-[12px] leading-relaxed text-red-700">
              {saveError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-8 w-full px-5 py-3.5 text-[11px] tracking-[0.18em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-70"
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
            className="mt-3 w-full py-2 text-center text-[13px] text-neutral-600 underline underline-offset-4 transition-opacity hover:text-neutral-900 disabled:opacity-50"
          >
            Vazgeç
          </button>
        </motion.form>
      </div>
    </>
  );
}
