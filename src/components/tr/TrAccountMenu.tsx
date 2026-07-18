"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { useAuth } from "@/context/AuthContext";
import { getTrUserFirstName } from "@/lib/tr/userDisplayName";
import { trCartPath, trFavoritesPath } from "@/lib/tr/paths";

const EDGE_LINK =
  "inline-flex h-8 items-center text-[10px] tracking-[0.22em] text-jet-black uppercase transition-opacity hover:opacity-60";

const ICON_BUTTON =
  "inline-flex size-10 items-center justify-center text-jet-black transition-opacity hover:opacity-60";

interface TrAccountMenuProps {
  /** Dropdown opens below (default) or left of the trigger. */
  menuAlign?: "right" | "left";
  /** Text label (desktop) or person icon (mobile). */
  variant?: "text" | "icon";
}

export function TrAccountMenu({
  menuAlign = "right",
  variant = "text",
}: TrAccountMenuProps) {
  const { user, isAuthenticated, needsPasswordSetup, signOut } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayName = getTrUserFirstName(user);
  const label =
    isAuthenticated && !needsPasswordSetup
      ? (displayName ?? "Hesap")
      : "Giriş";
  const isIcon = variant === "icon";

  useEffect(() => {
    if (!showMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowMenu(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!isAuthenticated) setShowMenu(false);
  }, [isAuthenticated]);

  const handleClick = () => {
    if (isAuthenticated && needsPasswordSetup) {
      setShowAuthPopup(true);
      return;
    }
    if (isAuthenticated) {
      setShowMenu((open) => !open);
      return;
    }
    setShowAuthPopup(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label={
          isAuthenticated
            ? displayName
              ? `Hesap menüsü · ${displayName}`
              : "Hesap menüsü"
            : "Giriş yap"
        }
        aria-expanded={isAuthenticated ? showMenu : undefined}
        aria-haspopup="menu"
        className={isIcon ? ICON_BUTTON : EDGE_LINK}
      >
        {isIcon ? (
          <User className="size-[22px] stroke-[1.25]" aria-hidden />
        ) : (
          label
        )}
      </button>

      {isAuthenticated && !needsPasswordSetup && showMenu ? (
        <div
          role="menu"
          className={
            menuAlign === "left"
              ? "absolute top-0 right-full z-[60] mr-2 w-56 border border-blueprint-border bg-ice-floor py-2 shadow-lg"
              : "absolute top-full right-0 z-[60] mt-2 w-56 border border-blueprint-border bg-ice-floor py-2 shadow-lg"
          }
        >
          {user?.email ? (
            <p className="border-b border-blueprint-border px-4 py-2.5 text-[11px] text-neutral-600">
              {user.email}
            </p>
          ) : null}
          <Link
            href={trFavoritesPath()}
            role="menuitem"
            onClick={() => setShowMenu(false)}
            className="block px-4 py-2.5 text-[11px] tracking-[0.14em] text-neutral-900 uppercase transition-colors hover:bg-white"
          >
            Favoriler
          </Link>
          <Link
            href={trCartPath()}
            role="menuitem"
            onClick={() => setShowMenu(false)}
            className="block px-4 py-2.5 text-[11px] tracking-[0.14em] text-neutral-900 uppercase transition-colors hover:bg-white"
          >
            Sepet
          </Link>
          <p
            role="menuitem"
            aria-disabled="true"
            className="px-4 py-2.5 text-[11px] tracking-[0.14em] text-neutral-400 uppercase"
          >
            Siparişler · yakında
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setShowMenu(false);
              void signOut();
            }}
            className="w-full border-t border-blueprint-border px-4 py-2.5 text-left text-[11px] tracking-[0.14em] text-neutral-600 uppercase transition-colors hover:bg-white hover:text-neutral-900"
          >
            Çıkış
          </button>
        </div>
      ) : null}

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        description="Giriş yaparak favorilerinizi ve siparişlerinizi ileride senkronize edebileceksiniz."
      />
    </div>
  );
}
