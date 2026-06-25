"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { useAuth } from "@/context/AuthContext";
import { WARDROBE_APP_PATH } from "@/lib/wardrobeGate";

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
    router.push(WARDROBE_APP_PATH);
  };

  const handleClick = () => {
    if (isAuthenticated) {
      goToWardrobe();
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
        description="Create an account or sign in to access your private wardrobe archive."
        allowSignUp
      />
    </>
  );
}
