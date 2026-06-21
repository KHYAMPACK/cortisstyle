"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { useAuth } from "@/context/AuthContext";
import {
  getWardrobeEntryPath,
  isWardrobeGateEnabled,
} from "@/lib/wardrobeGate";
import {
  getNotifyDeployPath,
  isAuthGateEnabled,
} from "@/lib/launchGates";

interface EnterDigitalWardrobeButtonProps {
  className?: string;
}

export function EnterDigitalWardrobeButton({
  className = "",
}: EnterDigitalWardrobeButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  const goToWardrobe = () => {
    router.push(getWardrobeEntryPath());
  };

  const handleClick = () => {
    if (isWardrobeGateEnabled()) {
      goToWardrobe();
      return;
    }

    if (isAuthenticated) {
      goToWardrobe();
      return;
    }

    if (isAuthGateEnabled()) {
      router.push(getNotifyDeployPath());
      return;
    }

    setShowAuthPopup(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`btn-primary border border-jet-black px-8 py-4 font-mono text-[11px] tracking-[0.35em] ${className}`.trim()}
      >
        Enter Digital Wardrobe
      </button>

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onAuthSuccess={goToWardrobe}
        description="Join Cortis Style to access your private archive."
        allowSignUp={!isAuthGateEnabled()}
      />
    </>
  );
}
