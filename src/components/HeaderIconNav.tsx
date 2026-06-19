"use client";

import { motion } from "framer-motion";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { useCart } from "@/context/CartContext";

const iconProps = {
  strokeWidth: 1.5,
  className: "h-[18px] w-[18px] text-neutral-900",
};

interface HeaderIconNavProps {
  className?: string;
  variant?: "default" | "modal";
}

export function HeaderIconNav({
  className = "",
  variant = "default",
}: HeaderIconNavProps) {
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const { count, bounceKey } = useCart();
  const isModal = variant === "modal";

  return (
    <>
      <nav
        aria-label="Global navigation"
        className={`flex items-center ${isModal ? "gap-4" : "gap-5 md:gap-6"} ${className}`}
      >
        {!isModal && (
          <>
            <button
              type="button"
              aria-label="Search"
              className="transition-opacity hover:opacity-60"
            >
              <Search {...iconProps} />
            </button>

            <button
              type="button"
              aria-label="Account"
              className="transition-opacity hover:opacity-60"
            >
              <User {...iconProps} />
            </button>
          </>
        )}

        <button
          type="button"
          aria-label="Favorites"
          onClick={() => setShowAuthPopup(true)}
          className="transition-opacity hover:opacity-60"
        >
          <Heart {...iconProps} />
        </button>

        <motion.button
          key={bounceKey}
          type="button"
          aria-label={`Shopping bag${count > 0 ? `, ${count} items` : ""}`}
          initial={false}
          animate={{ scale: bounceKey > 0 ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative transition-opacity hover:opacity-60"
        >
          <ShoppingBag {...iconProps} />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] leading-none text-white">
              {count}
            </span>
          )}
        </motion.button>
      </nav>

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
      />
    </>
  );
}
