"use client";

import { motion } from "framer-motion";
import { Search, ShoppingBag } from "lucide-react";
import { ProfileButton } from "@/components/ProfileButton";
import { useCart } from "@/context/CartContext";

interface HeaderIconNavProps {
  className?: string;
  variant?: "default" | "modal";
  tone?: "default" | "inverse";
}

export function HeaderIconNav({
  className = "",
  variant = "default",
  tone = "default",
}: HeaderIconNavProps) {
  const { count, bounceKey } = useCart();
  const isModal = variant === "modal";
  const iconClassName =
    tone === "inverse"
      ? "h-[18px] w-[18px] text-white"
      : "h-[18px] w-[18px] text-neutral-900";
  const iconProps = {
    strokeWidth: 1.5,
    className: iconClassName,
  };

  return (
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

          <ProfileButton tone={tone} />
        </>
      )}

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
          <span
            className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-none ${
              tone === "inverse"
                ? "bg-white text-neutral-900"
                : "bg-neutral-900 text-white"
            }`}
          >
            {count}
          </span>
        )}
      </motion.button>
    </nav>
  );
}
