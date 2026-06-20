"use client";

import { AnimatePresence, motion } from "framer-motion";
import { computeOutfitRarityFromLook, formatRarityBadge } from "@/lib/rarity";
import { useAuth } from "@/context/AuthContext";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const { user, purchasedLooks, wardrobeLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    onClose();

    try {
      await signOut();
    } catch {
      // Error surfaced via auth context.
    }
  };

  const emailLabel = user?.email?.toUpperCase() ?? "MEMBER";
  const nameLabel = user?.displayLabel ?? "ARCHIVE MEMBER";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-label="Profile menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="absolute top-[calc(100%+0.75rem)] right-0 z-[60] w-80 rounded-none border border-neutral-200 bg-white p-6 shadow-xl"
        >
          <p className="text-[10px] tracking-[0.32em] text-neutral-900 uppercase">
            Merhaba, {emailLabel}
          </p>

          <p className="mt-3 text-[9px] leading-relaxed tracking-[0.22em] text-neutral-400 uppercase">
            Name: {nameLabel} // Status: Verified Vault
          </p>

          <div className="mt-6 border-t border-neutral-200 pt-5">
            <p className="mb-3 text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
              Purchase &amp; Unlock History
            </p>

            {wardrobeLoading ? (
              <p className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
                Loading archive…
              </p>
            ) : purchasedLooks.length > 0 ? (
              <ul className="max-h-44 space-y-3 overflow-y-auto">
                {purchasedLooks.map((look) => {
                  const rarity = computeOutfitRarityFromLook(look);

                  return (
                    <li key={look.id} className="space-y-1">
                      <p className="text-[10px] tracking-[0.18em] text-neutral-700 uppercase">
                        {look.title}
                      </p>
                      <p className="font-sans text-[8px] tracking-[0.22em] text-neutral-400 uppercase">
                        {formatRarityBadge(rarity)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
                No unlocked looks yet
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 w-full text-left text-[10px] tracking-[0.32em] text-neutral-900 uppercase transition-opacity hover:opacity-60"
          >
            [ Logout Archive ]
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
