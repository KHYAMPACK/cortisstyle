"use client";

import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { useAuth } from "@/context/AuthContext";
import { getNotifyDeployPath, isAuthGateEnabled } from "@/lib/launchGates";

export function ProfileButton({ tone = "default" }: { tone?: "default" | "inverse" }) {
  const iconProps = {
    strokeWidth: 1.5,
    className:
      tone === "inverse"
        ? "h-[18px] w-[18px] text-white"
        : "h-[18px] w-[18px] text-neutral-900",
  };

  const { isAuthenticated, needsPasswordSetup } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDropdown]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowDropdown(false);
    }
  }, [isAuthenticated]);

  const handleClick = () => {
    if (isAuthenticated && needsPasswordSetup) {
      setShowAuthPopup(true);
      return;
    }

    if (isAuthenticated) {
      setShowDropdown((current) => !current);
      return;
    }

    if (isAuthGateEnabled()) {
      window.location.assign(getNotifyDeployPath());
      return;
    }

    setShowAuthPopup(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Profile"
        aria-expanded={isAuthenticated ? showDropdown : undefined}
        aria-haspopup={isAuthenticated ? "dialog" : undefined}
        onClick={handleClick}
        className="transition-opacity hover:opacity-60"
      >
        <User {...iconProps} />
      </button>

      {isAuthenticated && !needsPasswordSetup && (
        <ProfileDropdown
          isOpen={showDropdown}
          onClose={() => setShowDropdown(false)}
        />
      )}

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        description="Join the community to access your private wardrobe archive."
        allowSignUp
      />
    </div>
  );
}
