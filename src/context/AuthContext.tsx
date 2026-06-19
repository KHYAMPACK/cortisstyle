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
import {
  mapSupabaseUser,
  type WardrobeClothingItem,
  type WardrobeLook,
  type WardrobeUser,
} from "@/types/user";

interface AuthContextValue {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isAuthenticating: boolean;
  wardrobeLoading: boolean;
  authError: string | null;
  user: WardrobeUser | null;
  purchasedLooks: WardrobeLook[];
  ownedClothes: WardrobeClothingItem[];
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshWardrobe: () => Promise<void>;
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

  const user = useMemo(
    () => (session?.user ? mapSupabaseUser(session.user) : null),
    [session],
  );

  const refreshWardrobe = useCallback(async () => {
    if (!session?.user || !isSupabaseConfigured()) {
      setPurchasedLookIds([]);
      return;
    }

    setWardrobeLoading(true);

    try {
      const lookIds = await fetchUserWardrobeLookIds(session.user.id);
      setPurchasedLookIds(lookIds);
    } catch (error) {
      console.error("Failed to load wardrobe:", error);
      setAuthError("Unable to load your wardrobe archive.");
      setPurchasedLookIds([]);
    } finally {
      setWardrobeLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsInitializing(false);
      return;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    const bootstrap = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error("Supabase session error:", error);
        setAuthError(error.message);
      }

      setSession(data.session ?? null);
      setIsInitializing(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
        try {
          await syncProfile(nextSession.user);
        } catch (error) {
          console.error("Profile sync failed:", error);
        }
      } else {
        setPurchasedLookIds([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    void refreshWardrobe();
  }, [session, refreshWardrobe]);

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
      ownedClothes,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      refreshWardrobe,
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
      ownedClothes,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      refreshWardrobe,
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
