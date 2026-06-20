"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  ensureUserProfile,
  fetchUserWardrobeLookIds,
  resolveOwnedClothesFromLooks,
  resolvePurchasedLooks,
} from "@/lib/wardrobe";
import { fetchAllSavedOutfitsForUser } from "@/lib/savedWardrobeOutfitDb";
import {
  mapSupabaseUser,
  type WardrobeClothingItem,
  type WardrobeLook,
  type WardrobeUser,
} from "@/types/user";
import type { SavedWardrobeOutfitBlueprint } from "@/types/wardrobe-builder";

interface AuthContextValue {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isAuthenticating: boolean;
  wardrobeLoading: boolean;
  authError: string | null;
  user: WardrobeUser | null;
  purchasedLooks: WardrobeLook[];
  savedOutfits: SavedWardrobeOutfitBlueprint[];
  ownedClothes: WardrobeClothingItem[];
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshWardrobe: () => Promise<void>;
  refreshSavedOutfits: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncProfile(user: User) {
  await ensureUserProfile(user.id, user.email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [wardrobeLoading, setWardrobeLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [purchasedLookIds, setPurchasedLookIds] = useState<string[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedWardrobeOutfitBlueprint[]>(
    [],
  );

  const user = useMemo(
    () => (session?.user ? mapSupabaseUser(session.user) : null),
    [session],
  );

  const refreshWardrobe = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured()) {
      setPurchasedLookIds([]);
      return;
    }

    setWardrobeLoading(true);

    try {
      const lookIds = await fetchUserWardrobeLookIds(userId);
      setPurchasedLookIds(lookIds);
    } catch (error) {
      console.error("Failed to load wardrobe:", error);
      setAuthError("Unable to load your wardrobe archive.");
      setPurchasedLookIds([]);
    } finally {
      setWardrobeLoading(false);
    }
  }, []);

  const refreshSavedOutfits = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured()) {
      setSavedOutfits([]);
      return;
    }

    try {
      const outfits = await fetchAllSavedOutfitsForUser(userId);
      setSavedOutfits(outfits);
    } catch (error) {
      console.error("Failed to load saved outfits:", error);
      setSavedOutfits([]);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsInitializing(false);
      return;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
        // Defer Supabase DB calls so getSession() is not deadlocked.
        window.setTimeout(() => {
          void syncProfile(nextSession.user).catch((error) => {
            console.error("Profile sync failed:", error);
          });
        }, 0);
      } else {
        setPurchasedLookIds([]);
        setSavedOutfits([]);
      }
    });

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("Supabase session error:", error);
          setAuthError(error.message);
        }

        setSession(data.session ?? null);
      } catch (error) {
        if (!isMounted) return;

        console.error("Supabase bootstrap failed:", error);
        setAuthError(
          error instanceof Error
            ? error.message
            : "Unable to restore your session.",
        );
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (isInitializing || !userId) return;
    void refreshWardrobe(userId);
    void refreshSavedOutfits(userId);
  }, [isInitializing, userId, refreshWardrobe, refreshSavedOutfits]);

  const refreshWardrobeForSession = useCallback(async () => {
    if (!userId) {
      setPurchasedLookIds([]);
      return;
    }

    await refreshWardrobe(userId);
  }, [refreshWardrobe, userId]);

  const refreshSavedOutfitsForSession = useCallback(async () => {
    if (!userId) {
      setSavedOutfits([]);
      return;
    }

    await refreshSavedOutfits(userId);
  }, [refreshSavedOutfits, userId]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured()) {
        setAuthError("Supabase is not configured.");
        return;
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await syncProfile(data.user);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Sign in failed.";
        setAuthError(message);
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured()) {
        setAuthError("Supabase is not configured.");
        return false;
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) throw error;

        if (data.user) {
          await syncProfile(data.user);
        }

        if (!data.session) {
          setAuthError(
            "Account created. Check your email to confirm, then sign in.",
          );
          return false;
        }

        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Sign up failed.";
        setAuthError(message);
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    setPurchasedLookIds([]);
    setSavedOutfits([]);
    setAuthError(null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const purchasedLooks = useMemo(
    () => resolvePurchasedLooks(purchasedLookIds),
    [purchasedLookIds],
  );

  const ownedClothes = useMemo(
    () => resolveOwnedClothesFromLooks(purchasedLookIds),
    [purchasedLookIds],
  );

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.user),
      isInitializing,
      isAuthenticating,
      wardrobeLoading,
      authError,
      user,
      purchasedLooks,
      savedOutfits,
      ownedClothes,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      refreshWardrobe: refreshWardrobeForSession,
      refreshSavedOutfits: refreshSavedOutfitsForSession,
      clearAuthError,
    }),
    [
      session,
      isInitializing,
      isAuthenticating,
      wardrobeLoading,
      authError,
      user,
      purchasedLooks,
      savedOutfits,
      ownedClothes,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      refreshWardrobeForSession,
      refreshSavedOutfitsForSession,
      clearAuthError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
