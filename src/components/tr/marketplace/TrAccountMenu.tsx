"use client";

import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthPopup } from "@/components/AuthPopup";
import { useAuth } from "@/context/AuthContext";
import { getTrUserFirstName } from "@/lib/tr/userDisplayName";
import { trCartPath, trFavoritesPath } from "@/lib/tr/paths";

const EDGE_LINK =
  "font-cadde-nav inline-flex h-8 items-center text-[11px] font-semibold tracking-[0.2em] text-white uppercase transition-opacity hover:opacity-60";

const ICON_BUTTON =
  "inline-flex size-10 items-center justify-center text-white transition-opacity hover:opacity-60";

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
  const [menuBox, setMenuBox] = useState<{ top: number; right: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = getTrUserFirstName(user);
  const label =
    isAuthenticated && !needsPasswordSetup
      ? (displayName ?? "Hesap")
      : "Giriş";
  const isIcon = variant === "icon";

  useEffect(() => {
    if (!showMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setShowMenu(false);
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

  useEffect(() => {
    if (!showMenu) {
      setMenuBox(null);
      return;
    }
    const place = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuBox(
        menuAlign === "left"
          ? { top: rect.top, right: window.innerWidth - rect.left + 8 }
          : { top: rect.bottom + 8, right: window.innerWidth - rect.right },
      );
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [menuAlign, showMenu]);

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

      {isAuthenticated && !needsPasswordSetup && showMenu && menuBox
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: menuBox.top, right: menuBox.right }}
              className="fixed z-[120] w-56 border border-black/10 bg-ice-floor py-2 shadow-lg"
            >
              {user?.email ? (
                <p className="border-b border-black/10 px-4 py-2.5 font-cadde-nav text-[11px] text-neutral-600">
                  {user.email}
                </p>
              ) : null}
              <TrSoftNavLink
                href={trFavoritesPath()}
                role="menuitem"
                onNavigate={() => setShowMenu(false)}
                className="block px-4 py-2.5 text-[11px] tracking-[0.14em] text-neutral-900 uppercase transition-colors hover:bg-white"
              >
                Favoriler
              </TrSoftNavLink>
              <TrSoftNavLink
                href={trCartPath()}
                role="menuitem"
                onNavigate={() => setShowMenu(false)}
                className="block px-4 py-2.5 text-[11px] tracking-[0.14em] text-neutral-900 uppercase transition-colors hover:bg-white"
              >
                Sepet
              </TrSoftNavLink>
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
                className="w-full border-t border-black/10 px-4 py-2.5 text-left font-cadde-nav text-[11px] tracking-[0.14em] text-neutral-600 uppercase transition-colors hover:bg-white hover:text-neutral-900"
              >
                Çıkış
              </button>
            </div>,
            document.body,
          )
        : null}

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        description="Giriş yaparak favorilerinizi ve siparişlerinizi ileride senkronize edebileceksiniz."
        brand={{ locale: "tr" }}
      />
    </div>
  );
}
