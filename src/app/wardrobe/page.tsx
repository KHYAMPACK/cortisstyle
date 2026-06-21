"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { WardrobeBuilderCanvas } from "@/components/wardrobe/WardrobeBuilderCanvas";
import { WardrobeItemsGrid } from "@/components/wardrobe/WardrobeItemsGrid";
import { WardrobeLoadingState } from "@/components/wardrobe/WardrobeLoadingState";
import { WardrobeLooksGrid } from "@/components/wardrobe/WardrobeLooksGrid";
import { WardrobeTabs } from "@/components/wardrobe/WardrobeTabs";
import { useAuth } from "@/context/AuthContext";
import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";

export default function WardrobePage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isInitializing,
    wardrobeLoading,
    user,
    purchasedLooks,
    savedOutfits,
    wardrobeLoadError,
    ownedClothes,
    signOut,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<"builder" | "looks" | "items">(
    "builder",
  );
  const [builderLoadBlueprint, setBuilderLoadBlueprint] =
    useState<SavedWardrobeOutfitBlueprint | null>(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      setShowAuthPopup(true);
    }
  }, [isAuthenticated, isInitializing]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch {
      // Error surfaced via auth context.
    }
  };

  const handleAuthClose = () => {
    setShowAuthPopup(false);
    if (!isAuthenticated) {
      router.push("/");
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-full bg-ice-floor text-jet-black">
        <section className="border-b border-blueprint-border px-5 py-8 md:px-10 md:py-10">
          <p className="text-meta text-[9px] tracking-[0.45em] uppercase">
            Wardrobe Archive
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-none tracking-[-0.02em] text-neutral-950 md:text-5xl">
            Digital Wardrobe
          </h1>
        </section>
        <WardrobeLoadingState label="Authenticating archive" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-ice-floor text-jet-black">
      <AuthPopup
        isOpen={showAuthPopup && !isAuthenticated}
        onClose={handleAuthClose}
        onAuthSuccess={() => setShowAuthPopup(false)}
        description="Join Cortis Style to access your private archive."
      />

      <section className="border-b border-blueprint-border px-5 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-block text-meta text-[9px] tracking-[0.35em] uppercase transition-colors hover:text-jet-black"
            >
              ← Lookbook
            </Link>
            <p className="mb-2 text-meta text-[9px] tracking-[0.45em] uppercase">
              Wardrobe Archive // {user?.displayLabel ?? "GUEST"}
            </p>
            <h1 className="font-serif text-3xl leading-none tracking-[-0.02em] text-neutral-950 md:text-5xl">
              Digital Wardrobe
            </h1>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleSignOut}
              className="self-start text-meta text-[10px] tracking-[0.35em] uppercase transition-colors hover:text-jet-black md:self-auto"
            >
              Sign Out
            </button>
          )}
        </div>
      </section>

      {isAuthenticated ? (
        <main className="min-w-0 overflow-x-hidden px-5 py-8 md:px-10 md:py-10">
          <WardrobeTabs activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-8 min-w-0">
            {activeTab === "builder" ? (
              <WardrobeBuilderCanvas
                ownedClothes={ownedClothes}
                loadBlueprint={builderLoadBlueprint}
                onBlueprintLoaded={() => setBuilderLoadBlueprint(null)}
              />
            ) : activeTab === "looks" ? (
              <WardrobeLooksGrid
                looks={purchasedLooks}
                savedOutfits={savedOutfits}
                inventory={ownedClothes}
                wardrobeLoading={wardrobeLoading}
                wardrobeError={wardrobeLoadError}
                onOpenOutfitInBuilder={(outfit) => {
                  setBuilderLoadBlueprint(outfit);
                  setActiveTab("builder");
                }}
              />
            ) : wardrobeLoading ? (
              <WardrobeLoadingState label="Loading wardrobe collection" />
            ) : (
              <WardrobeItemsGrid items={ownedClothes} />
            )}
          </div>
        </main>
      ) : (
        <main className="px-5 py-24 md:px-10">
          <p className="text-center text-meta text-[11px] tracking-[0.25em] uppercase">
            Sign in to view your archive
          </p>
        </main>
      )}

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-blueprint-border px-5 py-8 text-meta text-[9px] tracking-[0.4em] uppercase md:flex-row md:items-center md:px-10">
        <span>Cortis Style © 2026</span>
        <span>Digital Wardrobe — Private Archive</span>
      </footer>
    </div>
  );
}
