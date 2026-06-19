"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { useAuth } from "@/context/AuthContext";

export function EnterDigitalWardrobeButton() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  const goToWardrobe = () => {
    router.push("/wardrobe");
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
        className="border border-neutral-900 bg-neutral-900 px-5 py-3 text-[10px] tracking-[0.35em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900"
      >
        Enter Digital Wardrobe
      </button>

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onAuthSuccess={goToWardrobe}
        description="Join Cortis Style to access your private archive."
      />
    </>
  );
}
