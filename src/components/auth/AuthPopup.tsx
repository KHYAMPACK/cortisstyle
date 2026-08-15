"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { AuthTermsNotice } from "@/components/legal/AuthTermsNotice";
import { useAuth } from "@/context/AuthContext";
import {
  classifyAuthError,
  localizeAuthError,
} from "@/lib/auth/authErrorMessage";
import {
  normalizeCustomerPhone,
  parseCustomerProfileFields,
} from "@/lib/auth/customerProfileFields";
import {
  SIGNUP_DISCOVERY_SOURCES,
  type SignupDiscoverySourceId,
} from "@/lib/auth/signupDiscoverySources";
import type { EmailAccountOrigin } from "@/lib/authTypes";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const fieldTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

const monoInputClass =
  "w-full border border-jet-black bg-white px-4 py-4 text-center font-mono text-[11px] tracking-[0.12em] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-jet-black disabled:opacity-60";

function fieldInputClass(hasError: boolean): string {
  return hasError
    ? `${monoInputClass} border-red-600 focus:border-red-600`
    : monoInputClass;
}

const primaryButtonClass =
  "mt-6 w-full border border-jet-black bg-jet-black px-5 py-4 text-center font-mono text-[10px] tracking-[0.32em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-60";

const secondaryButtonClass =
  "mt-3 w-full border border-jet-black bg-white px-5 py-4 text-center font-mono text-[10px] tracking-[0.32em] text-jet-black uppercase transition-opacity hover:bg-neutral-50 disabled:opacity-60";

const textLinkClass =
  "text-meta mt-4 w-full text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black";

type AuthPhase =
  | "choose"
  | "login"
  | "register-email"
  | "otp"
  | "welcome-profile"
  | "set-password"
  | "how-found"
  | "complete-signup"
  | "forgot-password"
  | "forgot-password-sent";

interface AuthPopupBrand {
  logoUrl?: string | null;
  logoAlt?: string;
  eyebrow?: string;
  successHref?: string;
  termsHref?: string;
  privacyHref?: string;
  locale?: "en" | "tr";
  accent?: string;
  boutiqueSlug?: string;
}

export type AuthPopupSuccessMeta = {
  isNewAccount: boolean;
};

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (
    meta?: AuthPopupSuccessMeta,
  ) => void | Promise<void>;
  description?: string;
  brand?: AuthPopupBrand;
  /** Open directly on login or register. Default: choose. */
  initialMode?: "choose" | "login" | "register";
}

function ResetAnchor({
  onReset,
  label,
}: {
  onReset: () => void;
  label: string;
}) {
  return (
    <button type="button" onClick={onReset} className={textLinkClass}>
      {label}
    </button>
  );
}

function AuthInlineError({
  message,
  id = "auth-form-error",
}: {
  message: string | null;
  id?: string;
}) {
  if (!message) return null;
  return (
    <motion.p
      id={id}
      role="alert"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 text-center text-[12px] leading-relaxed text-red-700"
    >
      {message}
    </motion.p>
  );
}

export function AuthPopup({
  isOpen,
  onClose,
  onAuthSuccess,
  description,
  brand,
  initialMode = "choose",
}: AuthPopupProps) {
  const router = useRouter();
  const {
    user,
    resolveEmailAuthRoute,
    resendSignUpOtp,
    signInWithPassword,
    verifySignUpOtp,
    setAccountPassword,
    saveSignupDiscovery,
    requestPasswordReset,
    needsPasswordSetup,
    isAuthenticating,
    authError,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileFieldError, setProfileFieldError] = useState<"phone" | null>(
    null,
  );
  const [discoverySource, setDiscoverySource] =
    useState<SignupDiscoverySourceId | null>(null);
  const [phase, setPhase] = useState<AuthPhase>("choose");
  const [accountOrigin, setAccountOrigin] = useState<EmailAccountOrigin | null>(
    null,
  );
  const [registerReadyNotice, setRegisterReadyNotice] = useState(false);
  const [existingAccountHint, setExistingAccountHint] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const locale = brand?.locale ?? "en";
  const isTr = locale === "tr";
  const boutiqueSlug = brand?.boutiqueSlug?.trim().toLowerCase() || null;
  const isBoutiqueAuth = Boolean(boutiqueSlug);
  const successHref = brand?.successHref?.trim() || "/tr";
  const accent = brand?.accent?.trim();
  const primaryBtnStyle = accent
    ? { backgroundColor: accent, borderColor: accent }
    : undefined;
  const defaultDescription = isTr
    ? "Hesabınıza giriş yapın veya yeni üyelik oluşturun."
    : "Sign in to your account or create a new one.";
  const resolvedDescription = description ?? defaultDescription;
  const termsNotice = (
    <AuthTermsNotice
      locale={locale}
      termsHref={brand?.termsHref}
      privacyHref={brand?.privacyHref}
    />
  );

  const normalizedEmail = email.trim().toLowerCase();
  const visibleAuthError = localizeAuthError(authError, isTr ? "tr" : "en");
  const authErrorKind = classifyAuthError(authError);
  const loginFieldsInvalid = authErrorKind === "invalid_credentials";
  const otpFieldInvalid =
    authErrorKind === "invalid_otp" || authErrorKind === "otp_expired";

  const ui = isTr
    ? {
        closeAria: "Pencereyi kapat",
        close: "Kapat",
        chooseLogin: "Giriş yap",
        chooseRegister: "Üye ol",
        emailLabel: "E-posta adresi",
        emailPlaceholder: "E-posta adresiniz...",
        firstNameLabel: "Ad",
        firstNamePlaceholder: "Adınız...",
        lastNameLabel: "Soyad",
        lastNamePlaceholder: "Soyadınız...",
        phoneLabel: "Telefon",
        phonePlaceholder: "05XX XXX XX XX",
        phoneRequired: "Telefon girdiyseniz geçerli bir numara yazın.",
        skipProfile: "Şimdilik geç",
        continue: "Devam et",
        completeSignup: "Üyeliği tamamla",
        checking: "Kontrol ediliyor...",
        passwordLabel: "Şifre",
        passwordPlaceholder: "Şifreniz...",
        signIn: "Giriş yap",
        signingIn: "Giriş yapılıyor...",
        forgotPassword: "Şifremi unuttum",
        goBack: "Geri dön",
        switchToLogin: "Zaten hesabım var — giriş yap",
        switchToRegister: "Hesabım yok — üye ol",
        otpHint: "6 haneli doğrulama kodu e-postanıza gönderildi.",
        otpSpam: "Görmüyor musunuz? Spam veya junk klasörünü kontrol edin.",
        otpLabel: "6 haneli doğrulama kodu",
        otpPlaceholder: "6 haneli kodu girin...",
        verify: "Doğrula",
        verifying: "Doğrulanıyor...",
        resend: "Kodu yeniden gönder",
        sending: "Gönderiliyor...",
        newPasswordLabel: "Yeni şifre",
        newPasswordPlaceholder: "Şifrenizi oluşturun...",
        confirmPasswordPlaceholder: "Şifrenizi tekrar girin...",
        passwordMismatch: "Şifreler eşleşmiyor.",
        savePassword: "Üyeliği tamamla",
        saving: "Kaydediliyor...",
        sendSetupLink: "Şifre belirleme bağlantısı gönder",
        sendResetLink: "Sıfırlama bağlantısı gönder",
        backToSignIn: "Girişe dön",
        registerReady:
          "Üyeliğiniz hazır. Güvenliğiniz için lütfen e-posta ve şifrenizle giriş yapın.",
        emailExists: "Bu e-posta ile zaten bir hesap var. Giriş yapın.",
      }
    : {
        closeAria: "Close sign in prompt",
        close: "Close",
        chooseLogin: "Sign in",
        chooseRegister: "Create account",
        emailLabel: "Email address",
        emailPlaceholder: "Enter your email...",
        firstNameLabel: "First name",
        firstNamePlaceholder: "First name...",
        lastNameLabel: "Last name",
        lastNamePlaceholder: "Last name...",
        phoneLabel: "Mobile number",
        phonePlaceholder: "Mobile number...",
        phoneRequired: "If you add a number, use a valid mobile.",
        skipProfile: "Skip for now",
        continue: "Continue",
        completeSignup: "Complete registration",
        checking: "Checking...",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password...",
        signIn: "Sign in",
        signingIn: "Signing in...",
        forgotPassword: "Forgot password?",
        goBack: "Go back",
        switchToLogin: "Already have an account — sign in",
        switchToRegister: "No account — create one",
        otpHint: "A 6-digit code was sent to your inbox.",
        otpSpam: "Don't see it? Check your spam or junk folder.",
        otpLabel: "Six digit verification code",
        otpPlaceholder: "Enter 6-digit code...",
        verify: "Verify",
        verifying: "Verifying...",
        resend: "Resend code",
        sending: "Sending...",
        newPasswordLabel: "Password",
        newPasswordPlaceholder: "Create your password...",
        confirmPasswordPlaceholder: "Confirm your password...",
        passwordMismatch: "Passwords do not match.",
        savePassword: "Complete registration",
        saving: "Saving...",
        sendSetupLink: "Send password setup link",
        sendResetLink: "Send reset link",
        backToSignIn: "Back to sign in",
        registerReady:
          "Your account is ready. Please sign in with your email and password.",
        emailExists: "An account already exists for this email. Please sign in.",
      };

  const resetSensitiveFields = () => {
    clearAuthError();
    setPassword("");
    setOtpToken("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileFieldError(null);
  };

  const resetRegisterProfileFields = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setDiscoverySource(null);
    setProfileFieldError(null);
  };

  const goToChoose = () => {
    resetSensitiveFields();
    resetRegisterProfileFields();
    setAccountOrigin(null);
    setRegisterReadyNotice(false);
    setExistingAccountHint(false);
    setPhase("choose");
  };

  const goToLogin = (opts?: {
    keepEmail?: boolean;
    readyNotice?: boolean;
    existingHint?: boolean;
  }) => {
    resetSensitiveFields();
    setAccountOrigin(null);
    if (!opts?.keepEmail) setEmail("");
    setRegisterReadyNotice(Boolean(opts?.readyNotice));
    setExistingAccountHint(Boolean(opts?.existingHint));
    setPhase("login");
  };

  const goToRegister = () => {
    resetSensitiveFields();
    setAccountOrigin(null);
    setRegisterReadyNotice(false);
    setExistingAccountHint(false);
    setPhase("register-email");
  };

  const finishLogin = () => {
    onAuthSuccess?.({ isNewAccount: false });
    onClose();
    router.push(successHref);
  };

  const finishSignup = async () => {
    await onAuthSuccess?.({ isNewAccount: true });
    onClose();
    router.push(successHref);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      resetRegisterProfileFields();
      resetSensitiveFields();
      setAccountOrigin(null);
      setRegisterReadyNotice(false);
      setExistingAccountHint(false);
      setPhase(
        initialMode === "login"
          ? "login"
          : initialMode === "register"
            ? "register-email"
            : "choose",
      );
      return;
    }

    if (needsPasswordSetup && user?.email) {
      setEmail(user.email);
      setRegisterReadyNotice(false);
      setExistingAccountHint(false);
      setPhase((current) => {
        if (
          current === "welcome-profile" ||
          current === "set-password" ||
          current === "how-found"
        ) {
          return current;
        }
        return isBoutiqueAuth ? "welcome-profile" : "set-password";
      });
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open/close + forced password setup
  }, [isOpen, clearAuthError, needsPasswordSetup, user?.email, initialMode]);

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();
    setRegisterReadyNotice(false);
    setExistingAccountHint(false);

    try {
      await signInWithPassword(normalizedEmail, password);
      finishLogin();
    } catch {
      // AuthContext error
    }
  };

  const handleRegisterEmailSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    clearAuthError();
    setAccountOrigin(null);
    setExistingAccountHint(false);
    setProfileFieldError(null);

    try {
      const status = await resolveEmailAuthRoute(
        normalizedEmail,
        boutiqueSlug ? { boutiqueSlug } : undefined,
      );

      if (status.accountOrigin) {
        setAccountOrigin(status.accountOrigin);
      }

      if (status.route === "login") {
        goToLogin({
          keepEmail: true,
          existingHint: !status.accountOrigin,
        });
        if (status.accountOrigin) {
          setAccountOrigin(status.accountOrigin);
        }
        return;
      }

      if (status.route === "complete_signup") {
        setPhase("complete-signup");
        return;
      }

      setPhase("otp");
    } catch {
      // AuthContext error
    }
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();

    try {
      await verifySignUpOtp(normalizedEmail, otpToken.trim());
      setPhase(isBoutiqueAuth ? "welcome-profile" : "set-password");
    } catch {
      // AuthContext error
    }
  };

  const goToPasswordSetup = () => {
    setProfileFieldError(null);
    setPhase("set-password");
  };

  const handleWelcomeProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileFieldError(null);
    const parsed = parseCustomerProfileFields({ firstName, lastName, phone });
    if (parsed && "error" in parsed) {
      setProfileFieldError("phone");
      return;
    }
    goToPasswordSetup();
  };

  const handleWelcomeProfileSkip = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    goToPasswordSetup();
  };

  const handlePasswordSetupSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    clearAuthError();

    if (newPassword !== confirmPassword) return;

    try {
      const parsed = isBoutiqueAuth
        ? parseCustomerProfileFields({ firstName, lastName, phone })
        : null;
      const profile =
        parsed && !("error" in parsed) ? parsed : undefined;

      await setAccountPassword(newPassword, profile);
      if (isBoutiqueAuth) {
        setPhase("how-found");
        return;
      }
      await finishSignup();
    } catch {
      // AuthContext error
    }
  };

  const handleHowFoundSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!discoverySource) return;
    try {
      await saveSignupDiscovery(discoverySource, boutiqueSlug);
      await finishSignup();
    } catch {
      await finishSignup();
    }
  };

  const handleHowFoundSkip = async () => {
    await finishSignup();
  };

  const handleResendOtp = async () => {
    clearAuthError();
    try {
      await resendSignUpOtp(
        normalizedEmail,
        boutiqueSlug ? { boutiqueSlug } : undefined,
      );
    } catch {
      // AuthContext error
    }
  };

  const handleForgotPasswordSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    clearAuthError();
    try {
      await requestPasswordReset(
        normalizedEmail,
        boutiqueSlug ? { boutiqueSlug } : undefined,
      );
      setPhase("forgot-password-sent");
    } catch {
      // AuthContext error
    }
  };

  const handleCompleteSignupLink = async () => {
    clearAuthError();
    try {
      await requestPasswordReset(
        normalizedEmail,
        boutiqueSlug ? { boutiqueSlug } : undefined,
      );
      setPhase("forgot-password-sent");
    } catch {
      // AuthContext error
    }
  };

  const crossBoutiqueNotice = accountOrigin
    ? isTr
      ? `Bu e-posta ile daha önce ${accountOrigin.boutiqueName} mağazasında üyelik oluşturulmuş. Aynı şifre ile buradan da giriş yapabilirsiniz. Sipariş ve favorileriniz her mağazada ayrı tutulur.`
      : `This email already has an account from ${accountOrigin.boutiqueName}. Sign in with the same password. Orders and favorites stay separate per store.`
    : null;

  const titleByPhase: Record<AuthPhase, string> = isTr
    ? {
        choose: "Giriş / Üyelik",
        login: accountOrigin ? "Hesabınız bulundu" : "Giriş yap",
        "register-email": "Üye ol",
        otp: "Doğrulama",
        "welcome-profile": "Sizi tanıyalım",
        "set-password": "Şifrenizi belirleyin",
        "how-found": "Bizi nereden duydunuz?",
        "complete-signup": "Profilinizi tamamlayın",
        "forgot-password": "Şifre sıfırlama",
        "forgot-password-sent": "E-postanızı kontrol edin",
      }
    : {
        choose: "Welcome",
        login: accountOrigin ? "Account found" : "Sign in",
        "register-email": "Create account",
        otp: "Verify email",
        "welcome-profile": "Nice to meet you",
        "set-password": "Set your password",
        "how-found": "Where did you find us?",
        "complete-signup": "Finish your profile",
        "forgot-password": "Reset password",
        "forgot-password-sent": "Check your inbox",
      };

  const subtitleByPhase: Record<AuthPhase, string> = isTr
    ? {
        choose: resolvedDescription,
        login: crossBoutiqueNotice
          ? `${normalizedEmail || "Hesabınız"} için şifrenizi girin.`
          : "E-posta ve şifrenizle giriş yapın.",
        "register-email": isBoutiqueAuth
          ? "E-posta ile üyelik başlatın. Bu hesap diğer mağazalarda da geçerlidir."
          : "Üyelik için e-posta adresinizi girin.",
        otp: `${normalizedEmail} adresine gönderilen 6 haneli kodu girin.`,
        "welcome-profile":
          "Sizi biraz daha yakından tanımak isteriz. Ad ve telefon zorunlu değil — isterseniz sonra da ekleyebilirsiniz.",
        "set-password": isBoutiqueAuth
          ? "Kalıcı bir şifre oluşturun. Bu şifre diğer mağazalarda da geçerlidir."
          : "Kalıcı bir şifre oluşturun.",
        "how-found":
          "Zorunlu değil — Instagram, internet, yapay zeka veya tavsiye.",
        "complete-signup":
          "E-postanız doğrulanmış ancak şifre eksik. Şifre belirleme bağlantısı gönderebiliriz.",
        "forgot-password": isBoutiqueAuth
          ? "Yeni şifre tüm mağazalar için geçerli olur."
          : "Yeni şifre seçmeniz için güvenli bir bağlantı göndereceğiz.",
        "forgot-password-sent": `${normalizedEmail} için bir hesap varsa sıfırlama bağlantısı yolda.`,
      }
    : {
        choose: resolvedDescription,
        login: crossBoutiqueNotice
          ? `Enter your password for ${normalizedEmail || "your account"}.`
          : "Sign in with your email and password.",
        "register-email": isBoutiqueAuth
          ? "Enter your email to start. This account works across stores."
          : "Enter your email to start registration.",
        otp: `Enter the 6-digit code sent to ${normalizedEmail}.`,
        "welcome-profile":
          "We would like to get to know you. Name and phone are optional — you can add them later.",
        "set-password":
          "Create a permanent password. It works across stores.",
        "how-found":
          "Optional — Instagram, internet, AI, or word of mouth.",
        "complete-signup":
          "Your email is verified but a password is missing. We can send a setup link.",
        "forgot-password": "We will email you a secure reset link.",
        "forgot-password-sent": `If an account exists for ${normalizedEmail}, a reset link is on its way.`,
      };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            key="auth-popup-backdrop"
            type="button"
            aria-label={ui.closeAria}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
          />

          <div className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              key="auth-popup-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-popup-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={spring}
              className="pointer-events-auto w-[min(92vw,440px)] border border-blueprint-border bg-white p-8 shadow-2xl md:p-10"
            >
              <div className="mb-6 flex justify-center">
                {brand?.logoUrl ? (
                  <Image
                    src={brand.logoUrl}
                    alt={brand.logoAlt ?? "Logo"}
                    width={220}
                    height={88}
                    className="h-16 w-auto object-contain md:h-20"
                    unoptimized
                    priority
                  />
                ) : (
                  <BrandLogo
                    variant="onLight"
                    className="h-20 w-auto md:h-24"
                  />
                )}
              </div>

              <p className="text-meta mb-3 text-center text-[9px] tracking-[0.4em] uppercase">
                {brand?.eyebrow ?? (isTr ? "Üyelik" : "Community Archive")}
              </p>

              <h2
                id="auth-popup-title"
                className="text-center font-serif text-2xl leading-tight text-neutral-950"
              >
                {titleByPhase[phase]}
              </h2>

              <p className="mt-4 text-center text-sm leading-relaxed text-neutral-600">
                {subtitleByPhase[phase]}
              </p>

              {registerReadyNotice && phase === "login" ? (
                <div
                  role="status"
                  className="mt-5 border border-black/10 bg-neutral-50 px-4 py-3 text-center text-[12px] leading-relaxed text-neutral-700"
                >
                  {ui.registerReady}
                </div>
              ) : null}

              {existingAccountHint && phase === "login" && !crossBoutiqueNotice ? (
                <div
                  role="status"
                  className="mt-5 border border-black/10 bg-neutral-50 px-4 py-3 text-center text-[12px] leading-relaxed text-neutral-700"
                >
                  {ui.emailExists}
                </div>
              ) : null}

              {crossBoutiqueNotice && phase === "login" ? (
                <div
                  role="status"
                  className="mt-5 border border-black/10 bg-neutral-50 px-4 py-3 text-center text-[12px] leading-relaxed text-neutral-700"
                >
                  {crossBoutiqueNotice}
                </div>
              ) : null}

              <AnimatePresence mode="wait">
                {phase === "choose" ? (
                  <motion.div
                    key="choose-phase"
                    {...fieldTransition}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => goToLogin()}
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {ui.chooseLogin}
                    </button>
                    <button
                      type="button"
                      onClick={() => goToRegister()}
                      className={secondaryButtonClass}
                    >
                      {ui.chooseRegister}
                    </button>
                    {termsNotice}
                  </motion.div>
                ) : null}

                {phase === "login" ? (
                  <motion.form
                    key="login-phase"
                    {...fieldTransition}
                    onSubmit={handleLoginSubmit}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col gap-3"
                  >
                    <label className="sr-only" htmlFor="auth-login-email">
                      {ui.emailLabel}
                    </label>
                    <input
                      id="auth-login-email"
                      type="email"
                      required
                      autoComplete="username"
                      spellCheck={false}
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (authError) clearAuthError();
                      }}
                      disabled={isAuthenticating}
                      className={fieldInputClass(loginFieldsInvalid)}
                      placeholder={ui.emailPlaceholder}
                      aria-invalid={loginFieldsInvalid}
                      aria-describedby={
                        loginFieldsInvalid ? "auth-form-error" : undefined
                      }
                    />
                    <label className="sr-only" htmlFor="auth-login-password">
                      {ui.passwordLabel}
                    </label>
                    <input
                      id="auth-login-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (authError) clearAuthError();
                      }}
                      disabled={isAuthenticating}
                      className={fieldInputClass(loginFieldsInvalid)}
                      placeholder={ui.passwordPlaceholder}
                      aria-invalid={loginFieldsInvalid}
                      aria-describedby={
                        loginFieldsInvalid ? "auth-form-error" : undefined
                      }
                    />

                    <AuthInlineError message={visibleAuthError} />

                    <button
                      type="submit"
                      disabled={
                        isAuthenticating ||
                        password.length < 6 ||
                        !normalizedEmail
                      }
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {isAuthenticating ? ui.signingIn : ui.signIn}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        clearAuthError();
                        setPhase("forgot-password");
                      }}
                      className={textLinkClass}
                    >
                      {ui.forgotPassword}
                    </button>

                    <button
                      type="button"
                      onClick={() => goToRegister()}
                      className={textLinkClass}
                    >
                      {ui.switchToRegister}
                    </button>

                    <ResetAnchor label={ui.goBack} onReset={goToChoose} />
                  </motion.form>
                ) : null}

                {phase === "register-email" ? (
                  <motion.form
                    key="register-email-phase"
                    {...fieldTransition}
                    onSubmit={handleRegisterEmailSubmit}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                  >
                    <label className="sr-only" htmlFor="auth-register-email">
                      {ui.emailLabel}
                    </label>
                    <input
                      id="auth-register-email"
                      type="email"
                      required
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isAuthenticating}
                      className={monoInputClass}
                      placeholder={ui.emailPlaceholder}
                    />

                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {isAuthenticating ? ui.checking : ui.continue}
                    </button>
                    <AuthInlineError message={visibleAuthError} />
                    {termsNotice}

                    <button
                      type="button"
                      onClick={() => goToLogin({ keepEmail: true })}
                      className={textLinkClass}
                    >
                      {ui.switchToLogin}
                    </button>

                    <ResetAnchor label={ui.goBack} onReset={goToChoose} />
                  </motion.form>
                ) : null}

                {phase === "otp" ? (
                  <motion.form
                    key="otp-phase"
                    {...fieldTransition}
                    onSubmit={handleOtpSubmit}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                  >
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-2 text-center font-mono text-[10px] leading-relaxed tracking-[0.22em] text-neutral-800 uppercase"
                    >
                      {ui.otpHint}
                    </motion.p>
                    <p className="mb-4 text-center text-[11px] leading-relaxed text-neutral-400">
                      {ui.otpSpam}
                    </p>

                    <label className="sr-only" htmlFor="auth-otp">
                      {ui.otpLabel}
                    </label>
                    <input
                      id="auth-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={otpToken}
                      onChange={(event) => {
                        setOtpToken(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        );
                        if (authError) clearAuthError();
                      }}
                      disabled={isAuthenticating}
                      className={`w-full border bg-white px-4 py-5 text-center font-mono text-[clamp(1.1rem,5vw,1.45rem)] tracking-[0.55em] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 placeholder:tracking-[0.22em] disabled:opacity-60 ${
                        otpFieldInvalid
                          ? "border-red-600 focus:border-red-600"
                          : "border-jet-black focus:border-jet-black"
                      }`}
                      placeholder={ui.otpPlaceholder}
                      aria-invalid={otpFieldInvalid}
                      aria-describedby={
                        otpFieldInvalid ? "auth-form-error" : undefined
                      }
                    />

                    <AuthInlineError message={visibleAuthError} />

                    <button
                      type="submit"
                      disabled={isAuthenticating || otpToken.length !== 6}
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {isAuthenticating ? ui.verifying : ui.verify}
                    </button>

                    {termsNotice}

                    <button
                      type="button"
                      onClick={() => void handleResendOtp()}
                      disabled={isAuthenticating}
                      className={textLinkClass}
                    >
                      {isAuthenticating ? ui.sending : ui.resend}
                    </button>

                    <ResetAnchor
                      label={ui.goBack}
                      onReset={() => {
                        resetSensitiveFields();
                        setPhase("register-email");
                      }}
                    />
                  </motion.form>
                ) : null}

                {phase === "welcome-profile" ? (
                  <motion.form
                    key="welcome-profile-phase"
                    {...fieldTransition}
                    onSubmit={handleWelcomeProfileSubmit}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col gap-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <label className="sr-only" htmlFor="auth-welcome-first-name">
                        {ui.firstNameLabel}
                      </label>
                      <input
                        id="auth-welcome-first-name"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        className={monoInputClass}
                        placeholder={ui.firstNamePlaceholder}
                      />
                      <label className="sr-only" htmlFor="auth-welcome-last-name">
                        {ui.lastNameLabel}
                      </label>
                      <input
                        id="auth-welcome-last-name"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        className={monoInputClass}
                        placeholder={ui.lastNamePlaceholder}
                      />
                    </div>
                    <label className="sr-only" htmlFor="auth-welcome-phone">
                      {ui.phoneLabel}
                    </label>
                    <input
                      id="auth-welcome-phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={15}
                      value={phone}
                      onChange={(event) => {
                        setPhone(normalizeCustomerPhone(event.target.value));
                        setProfileFieldError(null);
                      }}
                      className={fieldInputClass(profileFieldError === "phone")}
                      placeholder={ui.phonePlaceholder}
                      aria-invalid={profileFieldError === "phone"}
                    />
                    {profileFieldError === "phone" ? (
                      <p className="text-center text-[12px] leading-relaxed text-red-700">
                        {ui.phoneRequired}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {ui.continue}
                    </button>
                    <button
                      type="button"
                      onClick={handleWelcomeProfileSkip}
                      className={secondaryButtonClass}
                    >
                      {ui.skipProfile}
                    </button>
                  </motion.form>
                ) : null}

                {phase === "set-password" ? (
                  <motion.form
                    key="set-password-phase"
                    {...fieldTransition}
                    onSubmit={handlePasswordSetupSubmit}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col gap-3"
                  >
                    <label className="sr-only" htmlFor="auth-new-password">
                      {ui.newPasswordLabel}
                    </label>
                    <input
                      id="auth-new-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      disabled={isAuthenticating}
                      className={monoInputClass}
                      placeholder={ui.newPasswordPlaceholder}
                    />
                    <input
                      id="auth-confirm-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      disabled={isAuthenticating}
                      className={monoInputClass}
                      placeholder={ui.confirmPasswordPlaceholder}
                    />

                    {newPassword.length >= 6 &&
                    confirmPassword.length >= 6 &&
                    newPassword !== confirmPassword ? (
                      <p className="text-center text-[11px] text-red-600">
                        {ui.passwordMismatch}
                      </p>
                    ) : null}

                    <AuthInlineError
                      message={
                        newPassword === confirmPassword ? visibleAuthError : null
                      }
                    />

                    <button
                      type="submit"
                      disabled={
                        isAuthenticating ||
                        newPassword.length < 6 ||
                        newPassword !== confirmPassword
                      }
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {isAuthenticating
                        ? ui.saving
                        : isBoutiqueAuth
                          ? ui.continue
                          : ui.savePassword}
                    </button>

                    {termsNotice}
                  </motion.form>
                ) : null}

                {phase === "how-found" ? (
                  <motion.form
                    key="how-found-phase"
                    {...fieldTransition}
                    onSubmit={handleHowFoundSubmit}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col gap-3"
                  >
                    <div
                      role="radiogroup"
                      aria-label={titleByPhase["how-found"]}
                      className="flex flex-col gap-2"
                    >
                      {SIGNUP_DISCOVERY_SOURCES.map((source) => {
                        const selected = discoverySource === source.id;
                        return (
                          <button
                            key={source.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setDiscoverySource(source.id)}
                            disabled={isAuthenticating}
                            className={`min-h-11 w-full border px-4 py-3 text-center text-[13px] transition-opacity disabled:opacity-60 ${
                              selected
                                ? "border-neutral-900 text-neutral-950"
                                : "border-black/20 text-neutral-700 hover:border-neutral-900"
                            }`}
                            style={
                              selected && accent
                                ? { borderColor: accent, color: accent }
                                : undefined
                            }
                          >
                            {isTr ? source.labelTr : source.labelEn}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthenticating || !discoverySource}
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {isAuthenticating ? ui.saving : ui.completeSignup}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleHowFoundSkip()}
                      disabled={isAuthenticating}
                      className={secondaryButtonClass}
                    >
                      {ui.skipProfile}
                    </button>
                  </motion.form>
                ) : null}

                {phase === "complete-signup" ? (
                  <motion.div
                    key="complete-signup-phase"
                    {...fieldTransition}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                  >
                    <p className="mb-4 text-center text-[12px] text-neutral-600">
                      {ui.emailExists}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleCompleteSignupLink()}
                      disabled={isAuthenticating}
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {isAuthenticating ? ui.sending : ui.sendSetupLink}
                    </button>
                    <AuthInlineError message={visibleAuthError} />
                    <button
                      type="button"
                      onClick={() => goToLogin({ keepEmail: true })}
                      className={textLinkClass}
                    >
                      {ui.backToSignIn}
                    </button>
                  </motion.div>
                ) : null}

                {phase === "forgot-password" ? (
                  <motion.form
                    key="forgot-password-phase"
                    {...fieldTransition}
                    onSubmit={handleForgotPasswordSubmit}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                  >
                    <label className="sr-only" htmlFor="forgot-password-email">
                      {ui.emailLabel}
                    </label>
                    <input
                      id="forgot-password-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isAuthenticating}
                      className={monoInputClass}
                      placeholder={ui.emailPlaceholder}
                    />

                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {isAuthenticating ? ui.sending : ui.sendResetLink}
                    </button>
                    <AuthInlineError message={visibleAuthError} />

                    <ResetAnchor
                      label={ui.backToSignIn}
                      onReset={() => goToLogin({ keepEmail: true })}
                    />
                  </motion.form>
                ) : null}

                {phase === "forgot-password-sent" ? (
                  <motion.div
                    key="forgot-password-sent-phase"
                    {...fieldTransition}
                    className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => goToLogin({ keepEmail: true })}
                      className={primaryButtonClass}
                      style={primaryBtnStyle}
                    >
                      {ui.backToSignIn}
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button
                type="button"
                onClick={onClose}
                className="text-meta mt-6 w-full text-[10px] tracking-[0.3em] uppercase transition-colors hover:text-jet-black"
              >
                {ui.close}
              </button>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
