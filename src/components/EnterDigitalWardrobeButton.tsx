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
        className="btn-primary border border-jet-black px-5 py-3 font-mono text-[10px] tracking-[0.35em]"
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
