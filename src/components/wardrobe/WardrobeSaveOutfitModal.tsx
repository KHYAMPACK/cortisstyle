"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

export interface WardrobeSaveOutfitPayload {
  name: string;
  moodImageUrl: string | null;
}

interface WardrobeSaveOutfitModalProps {
  isOpen: boolean;
  initialName?: string;
  initialMoodImageUrl?: string | null;
  onClose: () => void;
  onSave: (payload: WardrobeSaveOutfitPayload) => void;
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function WardrobeSaveOutfitModal({
  isOpen,
  initialName = "",
  initialMoodImageUrl = null,
  onClose,
  onSave,
}: WardrobeSaveOutfitModalProps) {
  const [name, setName] = useState(initialName);
  const [moodImageUrl, setMoodImageUrl] = useState<string | null>(
    initialMoodImageUrl,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialName);
    setMoodImageUrl(initialMoodImageUrl);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, initialName, initialMoodImageUrl]);

  const applyImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await readImageFile(file);
    setMoodImageUrl(dataUrl);
  }, []);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await applyImageFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await applyImageFile(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSave({
      name: name.trim().toUpperCase(),
      moodImageUrl,
    });
    onClose();
  };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close save outfit modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
          />

          <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="save-outfit-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={spring}
              className="pointer-events-auto w-[min(92vw,440px)] border border-neutral-200 bg-white p-8 shadow-2xl"
            >
              <p className="mb-3 text-[9px] tracking-[0.4em] text-neutral-400 uppercase">
                Moodboard Archive
              </p>
              <h2
                id="save-outfit-title"
                className="font-serif text-2xl leading-tight text-neutral-950"
              >
                Save Outfit
              </h2>
              <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-neutral-500 uppercase">
                Name your look and attach an editorial mood reference.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <label className="block">
                  <span className="mb-2 block font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                    Outfit Name
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="LOOK 01 — CYBER GRUNGE"
                    className="w-full border border-neutral-200 bg-white px-3 py-3 font-mono text-[11px] tracking-[0.14em] text-neutral-900 uppercase outline-none transition-colors focus:border-neutral-900"
                  />
                </label>

                <div>
                  <span className="mb-2 block font-mono text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                    Mood Image Overlay
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative flex w-full flex-col items-center justify-center gap-3 border border-dashed px-4 py-8 transition-colors ${
                      isDragging
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    {moodImageUrl ? (
                      <div className="relative aspect-[3/4] w-[100px] overflow-hidden border border-neutral-100">
                        <Image
                          src={moodImageUrl}
                          alt="Mood preview"
                          fill
                          unoptimized
                          sizes="100px"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <span className="font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase">
                      {moodImageUrl
                        ? "Replace Mood Image"
                        : "Drag & Drop or Click to Upload"}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {moodImageUrl ? (
                    <button
                      type="button"
                      onClick={() => setMoodImageUrl(null)}
                      className="mt-2 font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
                    >
                      Remove Mood Image
                    </button>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="w-full border border-neutral-900 bg-neutral-900 px-5 py-3 font-mono text-[10px] tracking-[0.3em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900"
                >
                  Save Outfit Card
                </button>
              </form>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full font-mono text-[10px] tracking-[0.3em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
