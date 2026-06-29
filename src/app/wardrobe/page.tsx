"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { ArchiveCommunitySignOff } from "@/components/ArchiveCommunitySignOff";
import { WardrobeBuilderCanvas } from "@/components/wardrobe/WardrobeBuilderCanvas";
import { WardrobeItemsGrid } from "@/components/wardrobe/WardrobeItemsGrid";
import { WardrobeLoadingState } from "@/components/wardrobe/WardrobeLoadingState";
import { WardrobeLooksGrid } from "@/components/wardrobe/WardrobeLooksGrid";
import { WardrobeTabs } from "@/components/wardrobe/WardrobeTabs";
import { useAuth } from "@/context/AuthContext";
import { deleteSavedWardrobeOutfit } from "@/lib/savedWardrobeOutfitDb";
import { lookToBuilderBlueprint } from "@/lib/lookToWardrobeBlueprint";
import { getStudioEntryPath } from "@/lib/studioRedirect";
import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";
import type { WardrobeLook } from "@/types/user";

function WardrobePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    isInitializing,
    needsPasswordSetup,
    wardrobeLoading,
    user,
    purchasedLooks,
    savedOutfits,
    wardrobeLoadError,
    ownedClothes,
    refreshSavedOutfits,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<"builder" | "looks" | "items">(
    "builder",
  );
  const [builderLoadBlueprint, setBuilderLoadBlueprint] =
    useState<SavedWardrobeOutfitBlueprint | null>(null);
  const [deletingOutfitId, setDeletingOutfitId] = useState<string | null>(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "builder" || tab === "looks" || tab === "items") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated || needsPasswordSetup) {
      setShowAuthPopup(true);
    }
  }, [isAuthenticated, isInitializing, needsPasswordSetup]);

  const handleAuthClose = () => {
    setShowAuthPopup(false);
    if (!isAuthenticated || needsPasswordSetup) {
      router.push("/");
    }
  };

  const handleEditSavedOutfit = (outfit: SavedWardrobeOutfitBlueprint) => {
    setBuilderLoadBlueprint(outfit);
    setActiveTab("builder");
  };

  const handleCopyLookToEditor = (look: WardrobeLook) => {
    setBuilderLoadBlueprint(lookToBuilderBlueprint(look));
    setActiveTab("builder");
  };

  const handleDeleteSavedOutfit = async (
    outfit: SavedWardrobeOutfitBlueprint,
  ) => {
    if (!user?.id) return;

    const purgeStartedAt = Date.now();
    const minPurgeDurationMs = 450;

    setDeletingOutfitId(outfit.id);
    try {
      await deleteSavedWardrobeOutfit(user.id, outfit.id);

      const elapsed = Date.now() - purgeStartedAt;
      if (elapsed < minPurgeDurationMs) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, minPurgeDurationMs - elapsed);
        });
      }

      await refreshSavedOutfits();
    } finally {
      setDeletingOutfitId(null);
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
    <div className="min-h-full overflow-x-hidden bg-ice-floor text-jet-black">
      <AuthPopup
        isOpen={showAuthPopup && (!isAuthenticated || needsPasswordSetup)}
        onClose={handleAuthClose}
        description="Join the community to access your private wardrobe archive."
        allowSignUp
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

          {isAuthenticated && !needsPasswordSetup ? (
            <Link
              href={getStudioEntryPath()}
              className="inline-block shrink-0 border border-jet-black px-6 py-3.5 font-mono text-[10px] tracking-[0.32em] text-jet-black uppercase transition-colors hover:bg-jet-black hover:text-white"
            >
              Become a Creator
            </Link>
          ) : null}
        </div>
      </section>

      {isAuthenticated && !needsPasswordSetup ? (
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
                onEditSavedOutfit={handleEditSavedOutfit}
                onDeleteSavedOutfit={handleDeleteSavedOutfit}
                onCopyLookToEditor={handleCopyLookToEditor}
                deletingOutfitId={deletingOutfitId}
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

      <footer className="border-t border-blueprint-border">
        <div className="flex flex-col items-start justify-between gap-4 px-5 py-8 text-meta text-[9px] tracking-[0.4em] uppercase md:flex-row md:items-center md:px-10">
          <span>Cortis Style © 2026</span>
          <span>Digital Wardrobe — Private Archive</span>
        </div>
        <ArchiveCommunitySignOff tone="light" className="mt-0 border-t border-blueprint-border pt-10 pb-10" />
      </footer>
    </div>
  );
}

export default function WardrobePage() {
  return (
    <Suspense fallback={<WardrobeLoadingState label="Loading wardrobe" />}>
      <WardrobePageContent />
    </Suspense>
  );
}
