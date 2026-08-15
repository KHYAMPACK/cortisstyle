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
import { resolveEmailAuthStatus } from "@/lib/authEmailCheck";
import {
  isPasswordSetInMetadata,
  type EmailAuthStatus,
  type ResolveEmailAuthOptions,
} from "@/lib/authTypes";
import { getPasswordResetRedirectUrl } from "@/lib/authRedirect";
import {
  normalizeAccountProfilePatch,
  parseCustomerProfileFields,
  type CustomerProfileFields,
} from "@/lib/auth/customerProfileFields";
import { ensureUserProfile, type UserProfileContact } from "@/lib/auth/ensureUserProfile";
import type { SignupDiscoverySourceId } from "@/lib/auth/signupDiscoverySources";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { mapSupabaseUser, type AuthUser } from "@/types/user";

interface AuthContextValue {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isAuthenticating: boolean;
  isResolvingAuthRedirect: boolean;
  authError: string | null;
  user: AuthUser | null;
  resolveEmailAuthRoute: (
    email: string,
    options?: ResolveEmailAuthOptions,
  ) => Promise<EmailAuthStatus>;
  dispatchSignUpOtp: (
    email: string,
    options?: ResolveEmailAuthOptions,
  ) => Promise<void>;
  resendSignUpOtp: (
    email: string,
    options?: ResolveEmailAuthOptions,
  ) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  verifySignUpOtp: (email: string, token: string) => Promise<void>;
  setAccountPassword: (
    password: string,
    profile?: CustomerProfileFields,
  ) => Promise<void>;
  updateAccountProfile: (contact: UserProfileContact) => Promise<void>;
  saveSignupDiscovery: (
    source: SignupDiscoverySourceId,
    boutiqueSlug?: string | null,
  ) => Promise<void>;
  requestPasswordReset: (
    email: string,
    options?: ResolveEmailAuthOptions,
  ) => Promise<void>;
  needsPasswordSetup: boolean;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  setIsResolvingAuthRedirect: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function contactFromMetadata(
  metadata: Record<string, unknown> | undefined,
): {
  firstName?: string;
  lastName?: string;
  phone?: string;
} {
  const firstName =
    typeof metadata?.first_name === "string" ? metadata.first_name.trim() : "";
  const lastName =
    typeof metadata?.last_name === "string" ? metadata.last_name.trim() : "";
  const phone =
    typeof metadata?.phone === "string" ? metadata.phone.trim() : "";
  return {
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(phone ? { phone } : {}),
  };
}

async function syncProfile(user: User) {
  await ensureUserProfile(
    user.id,
    user.email,
    contactFromMetadata(
      user.user_metadata as Record<string, unknown> | undefined,
    ),
  );
}

function isAlreadyRegisteredAuthError(message: string, code?: string): boolean {
  const normalized = message.toLowerCase();
  return (
    code === "user_already_exists" ||
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists")
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isResolvingAuthRedirect, setIsResolvingAuthRedirect] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const user = useMemo(
    () => (session?.user ? mapSupabaseUser(session.user) : null),
    [session],
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsInitializing(false);
      return;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setIsResolvingAuthRedirect(false);
      }

      if (nextSession?.user) {
        const passwordSet = isPasswordSetInMetadata(
          nextSession.user.user_metadata as Record<string, unknown> | undefined,
        );

        if (passwordSet) {
          window.setTimeout(() => {
            void syncProfile(nextSession.user).catch((error) => {
              console.error("Profile sync failed:", error);
            });
          }, 0);
        }
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

  const sendBoutiqueSignupOtpEmail = useCallback(
    async (email: string, boutiqueSlug: string) => {
      const response = await fetch("/api/tr/customer/auth/send-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, boutiqueSlug }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          body.error ??
            "Markalı doğrulama e-postası gönderilemedi. RESEND_API_KEY kontrol edin.",
        );
      }
      return;
    },
    [],
  );

  const startSignUp = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(),
    });

    if (error && !isAlreadyRegisteredAuthError(error.message, error.code)) {
      throw error;
    }
  }, []);

  const resendSignUpOtp = useCallback(
    async (email: string, options?: ResolveEmailAuthOptions) => {
      if (!isSupabaseConfigured()) {
        setAuthError("Supabase is not configured.");
        return;
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const boutiqueSlug = options?.boutiqueSlug?.trim().toLowerCase();
        if (boutiqueSlug) {
          // Boutique auth must use branded Resend mail — never Supabase templates.
          await sendBoutiqueSignupOtpEmail(email, boutiqueSlug);
          return;
        }

        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
        });

        if (error) throw error;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to resend verification code.";
        setAuthError(message);
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [sendBoutiqueSignupOtpEmail],
  );

  const dispatchSignUpOtp = useCallback(
    async (email: string, options?: ResolveEmailAuthOptions) => {
      if (!isSupabaseConfigured()) {
        setAuthError("Supabase is not configured.");
        return;
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const boutiqueSlug = options?.boutiqueSlug?.trim().toLowerCase();
        if (boutiqueSlug) {
          await sendBoutiqueSignupOtpEmail(email, boutiqueSlug);
          return;
        }

        await startSignUp(email);
      } catch (error) {
        if (
          error instanceof Error &&
          isAlreadyRegisteredAuthError(error.message)
        ) {
          await resendSignUpOtp(email, options);
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to send verification code.";
        setAuthError(message);
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [resendSignUpOtp, sendBoutiqueSignupOtpEmail, startSignUp],
  );

  const resolveEmailAuthRoute = useCallback(
    async (
      email: string,
      options?: ResolveEmailAuthOptions,
    ): Promise<EmailAuthStatus> => {
      if (!isSupabaseConfigured()) {
        setAuthError("Supabase is not configured.");
        throw new Error("Supabase is not configured.");
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const status = await resolveEmailAuthStatus(email, options);

        if (status.route === "signup" || status.route === "verify_signup") {
          if (status.route === "signup") {
            await dispatchSignUpOtp(email, options);
          } else {
            await resendSignUpOtp(email, options);
          }
        }

        return status;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to verify email address.";
        setAuthError(message);
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [dispatchSignUpOtp, resendSignUpOtp],
  );

  const signInWithPassword = useCallback(async (email: string, password: string) => {
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

      // Legacy accounts may predate password_set metadata.
      if (
        data.user &&
        !isPasswordSetInMetadata(
          data.user.user_metadata as Record<string, unknown> | undefined,
        )
      ) {
        await supabase.auth.updateUser({ data: { password_set: true } });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";
      setAuthError(message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const verifySignUpOtp = useCallback(async (email: string, token: string) => {
    if (!isSupabaseConfigured()) {
      setAuthError("Supabase is not configured.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const supabase = getSupabaseClient();
      const types = ["signup", "magiclink", "email"] as const;
      let lastError: Error | null = null;
      let verified = false;

      for (const type of types) {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type,
        });
        if (!error) {
          verified = true;
          break;
        }
        lastError = error;
      }

      if (!verified) {
        throw lastError ?? new Error("Unable to verify access token.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to verify access token.";
      setAuthError(message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const setAccountPassword = useCallback(
    async (password: string, profile?: CustomerProfileFields) => {
      if (!isSupabaseConfigured()) {
        setAuthError("Supabase is not configured.");
        return;
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const parsed = profile ? parseCustomerProfileFields(profile) : null;
        if (parsed && "error" in parsed) {
          throw new Error("Geçerli bir telefon numarası girin.");
        }

        const contactMeta =
          parsed && !("error" in parsed)
            ? {
                ...(parsed.firstName ? { first_name: parsed.firstName } : {}),
                ...(parsed.lastName ? { last_name: parsed.lastName } : {}),
                ...(parsed.phone ? { phone: parsed.phone } : {}),
              }
            : {};

        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.updateUser({
          password,
          data: {
            password_set: true,
            ...contactMeta,
          },
        });

        if (error) throw error;

        if (data.user) {
          await syncProfile(data.user);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to save password.";
        setAuthError(message);
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  const updateAccountProfile = useCallback(async (contact: UserProfileContact) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const patch = normalizeAccountProfilePatch(contact);
    if ("error" in patch) {
      throw new Error("Geçerli bir telefon numarası girin.");
    }

    const meta: Record<string, string> = {};
    if (patch.firstName !== undefined) {
      meta.first_name = patch.firstName ?? "";
    }
    if (patch.lastName !== undefined) {
      meta.last_name = patch.lastName ?? "";
    }
    if (patch.phone !== undefined) {
      meta.phone = patch.phone ?? "";
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.updateUser({ data: meta });
    if (error) throw error;

    const nextUser = data.user;
    if (nextUser) {
      await ensureUserProfile(nextUser.id, nextUser.email, patch);
      setSession((prev) => (prev ? { ...prev, user: nextUser } : prev));
    }
  }, []);

  const saveSignupDiscovery = useCallback(
    async (source: SignupDiscoverySourceId, boutiqueSlug?: string | null) => {
      if (!isSupabaseConfigured()) return;

      setIsAuthenticating(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.updateUser({
          data: {
            signup_discovery_source: source,
            signup_discovery_boutique_slug:
              boutiqueSlug?.trim().toLowerCase() ?? "",
          },
        });
        if (error) {
          console.error("Signup discovery metadata failed:", error.message);
          return;
        }

        const nextUser = data.user;
        if (!nextUser) return;

        try {
          await ensureUserProfile(nextUser.id, nextUser.email, {
            signupDiscoverySource: source,
            signupDiscoveryBoutiqueSlug: boutiqueSlug ?? null,
          });
        } catch (persistError) {
          console.error("Signup discovery profile failed:", persistError);
        }

        setSession((prev) => (prev ? { ...prev, user: nextUser } : prev));
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  const requestPasswordReset = useCallback(
    async (email: string, options?: ResolveEmailAuthOptions) => {
      if (!isSupabaseConfigured()) {
        setAuthError("Supabase is not configured.");
        return;
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const boutiqueSlug = options?.boutiqueSlug?.trim().toLowerCase();
        if (boutiqueSlug) {
          const response = await fetch(
            "/api/tr/customer/auth/send-password-reset",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, boutiqueSlug }),
            },
          );
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          if (!response.ok) {
            throw new Error(
              body.error ??
                "Markalı şifre sıfırlama e-postası gönderilemedi. RESEND_API_KEY kontrol edin.",
            );
          }
          return;
        }

        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getPasswordResetRedirectUrl(),
        });

        if (error) throw error;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to send password reset email.";
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

    setAuthError(null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const needsPasswordSetup = useMemo(() => {
    if (!session?.user) return false;
    return !isPasswordSetInMetadata(
      session.user.user_metadata as Record<string, unknown> | undefined,
    );
  }, [session?.user]);

  /** Fully usable session — OTP-verified but password not set does not count. */
  const isAuthenticated = Boolean(session?.user) && !needsPasswordSetup;

  const value = useMemo(
    () => ({
      isAuthenticated,
      isInitializing,
      isAuthenticating,
      isResolvingAuthRedirect,
      authError,
      user,
      resolveEmailAuthRoute,
      dispatchSignUpOtp,
      resendSignUpOtp,
      signInWithPassword,
      verifySignUpOtp,
      setAccountPassword,
      updateAccountProfile,
      saveSignupDiscovery,
      requestPasswordReset,
      needsPasswordSetup,
      signOut,
      clearAuthError,
      setIsResolvingAuthRedirect,
    }),
    [
      isAuthenticated,
      isInitializing,
      isAuthenticating,
      isResolvingAuthRedirect,
      authError,
      user,
      resolveEmailAuthRoute,
      dispatchSignUpOtp,
      resendSignUpOtp,
      signInWithPassword,
      verifySignUpOtp,
      setAccountPassword,
      updateAccountProfile,
      saveSignupDiscovery,
      requestPasswordReset,
      needsPasswordSetup,
      signOut,
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
