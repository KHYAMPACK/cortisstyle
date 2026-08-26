"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cortis-tr-boutique-cookie-consent";

export function TrBoutiqueCookieNotice({
  privacyHref,
}: {
  privacyHref: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div
      data-atelier-chrome=""
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-black/10 bg-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-relaxed text-neutral-700">
          Bu sitede zorunlu çerezler kullanılır. Detaylar için{" "}
          <Link href={privacyHref} className="underline underline-offset-2">
            çerez politikası
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 bg-neutral-900 px-4 py-2.5 text-[11px] tracking-[0.14em] text-white uppercase"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
