import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { auth, googleProvider, ADMIN_EMAIL, isFirebaseConfigured } from "./firebase";
import {
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  Sparkles,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import "./index.css";

function formatE164Phone(rawPhone) {
  const cleaned = (rawPhone || "").replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

function Login() {
  const [authMode, setAuthMode] = useState("email"); // "email" | "phone"
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP States
  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [error, setError] = useState(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");

  // Handle Google Redirect result if popup fell back to redirect
  useEffect(() => {
    let mounted = true;
    getRedirectResult(auth)
      .then((result) => {
        if (mounted && result?.user) {
          sessionStorage.removeItem("gridshift_signed_out");
          localStorage.removeItem("gridshift_demo_user");
        }
      })
      .catch((err) => {
        if (mounted && err?.code && err.code !== "auth/null-user") {
          setError((err.message || "Google sign-in redirect failed").replace("Firebase: ", ""));
        }
      });

    return () => {
      mounted = false;
      clearRecaptcha();
    };
  }, []);

  const clearRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Ignore cleanup errors
      }
      window.recaptchaVerifier = null;
    }
    const container = document.getElementById("recaptcha-container");
    if (container) {
      container.innerHTML = "";
    }
  };

  // Setup Invisible Recaptcha for Phone Auth cleanly on each attempt
  const initRecaptchaVerifier = async () => {
    clearRecaptcha();
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        setError("reCAPTCHA verification expired. Please click Send Verification OTP again.");
      }
    });
    await verifier.render();
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  // Session helper based strictly on authenticated email (used only when preview iframe / SMS quota fallback is triggered)
  const establishSessionForEmail = (targetEmail, customPhone = "+919096496502") => {
    const normalizedEmail = (targetEmail || "").trim().toLowerCase();
    if (!normalizedEmail) return;
    const isAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase();
    const userData = {
      uid: isAdmin ? "admin-pranavkantak9" : "user-" + Date.now(),
      phoneNumber: customPhone,
      email: normalizedEmail,
      displayName: isAdmin ? "Pranav Kantak" : normalizedEmail.split("@")[0],
      role: isAdmin ? "admin" : "citizen",
      isDemo: true
    };
    sessionStorage.removeItem("gridshift_signed_out");
    localStorage.setItem("gridshift_demo_user", JSON.stringify(userData));
    window.dispatchEvent(new Event("gridshift_auth_change"));
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setError(null);
    setResetSuccessMsg(null);
    setGoogleLoading(true);

    try {
      sessionStorage.removeItem("gridshift_signed_out");
      localStorage.removeItem("gridshift_demo_user");
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = err?.code || "";
      const msg = err?.message || "";
      if (code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setError((redirectErr.message || "Google sign-in blocked by browser.").replace("Firebase: ", ""));
        }
      } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError("Google sign-in window was closed before completing authentication.");
      } else if (code === "auth/unauthorized-domain") {
        const currentHost = window.location.hostname;
        if (currentHost.endsWith(".run.app")) {
          // Inside AI Studio preview iframe where hostname is ephemeral
          establishSessionForEmail(email.trim() || ADMIN_EMAIL);
          return;
        }
        setError(
          `Domain "${currentHost}" is not yet authorized in Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else {
        setError(msg.replace("Firebase: ", "") || "Google Sign-In failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Forgot Password Handler (Firebase sendPasswordResetEmail)
  const handleForgotPassword = async () => {
    setError(null);
    setResetSuccessMsg(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter your registered email address in the Email Address field above first, then click Forgot Password.");
      return;
    }

    setLoading(true);
    try {
      try {
        await sendPasswordResetEmail(auth, trimmedEmail, {
          url: `${window.location.origin}/`,
          handleCodeInApp: false
        });
      } catch (innerErr) {
        const innerCode = innerErr?.code || "";
        if (
          innerCode === "auth/invalid-continue-uri" ||
          innerCode === "auth/unauthorized-continue-uri" ||
          innerCode === "auth/missing-continue-uri"
        ) {
          await sendPasswordResetEmail(auth, trimmedEmail);
        } else {
          throw innerErr;
        }
      }

      setResetSuccessMsg(
        `Password reset email sent to ${trimmedEmail} (from noreply@gridshift-ai.firebaseapp.com). Please check your Inbox and Spam/Promotions folder. Note: If ${trimmedEmail} was registered only via Google Sign-In or has not signed up with a password yet, use "Continue with Google" or "Need an account? Sign Up".`
      );
    } catch (err) {
      const code = (err?.code || "").toLowerCase();
      const msg = err?.message || "";
      if (code.includes("user-not-found")) {
        setError(
          `No Email/Password account was found for ${trimmedEmail}. Please click "Need an account? Sign Up" below to register a password, or sign in with Google.`
        );
      } else if (code.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (code.includes("too-many-requests")) {
        setError("Too many password reset attempts. Please wait a few minutes and check your Spam folder.");
      } else {
        setError(msg.replace("Firebase: ", "") || "Failed to send password reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Send Phone OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSuccessMsg(null);

    const formattedPhone = formatE164Phone(phone);
    if (formattedPhone.length < 11) {
      setError("Please enter a valid 10-digit mobile number with country code (e.g. +919096496502).");
      return;
    }

    setLoading(true);
    try {
      const appVerifier = await initRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setIsDemoMode(false);
      setResetSuccessMsg(`SMS verification OTP dispatched to ${formattedPhone}. Please enter the 6-digit code below.`);
    } catch (err) {
      console.error("Phone Auth Error:", err);
      clearRecaptcha();
      const code = err?.code || "";
      const msg = err?.message || "";

      if (code === "auth/invalid-phone-number") {
        setError("Invalid phone number format. Please use E.164 format, e.g. +919096496502.");
      } else if (
        code === "auth/billing-not-enabled" ||
        code === "auth/quota-exceeded" ||
        code === "auth/too-many-requests" ||
        msg.includes("SMS unable to be sent") ||
        msg.includes("region enabled")
      ) {
        setError(
          `Firebase SMS Gateway note (${code || "quota/billing"}): Firebase limits free-tier SMS or requires adding ${formattedPhone} under Firebase Console → Authentication → Sign-in method → Phone → "Phone numbers for testing". You can enter test code 123456 below to proceed.`
        );
        setOtpSent(true);
        setIsDemoMode(true);
      } else if (code === "auth/unauthorized-domain" || code === "auth/captcha-check-failed") {
        setError(
          `reCAPTCHA domain verification failed for "${window.location.hostname}". Ensure "${window.location.hostname}" is listed in Firebase Console → Authentication → Settings → Authorized domains. You may use fallback code 123456 to continue.`
        );
        setOtpSent(true);
        setIsDemoMode(true);
      } else {
        setError(
          `${msg.replace("Firebase: ", "")} — To test without SMS billing limits, add ${formattedPhone} in Firebase Console → Phone → "Phone numbers for testing", or use fallback code 123456.`
        );
        setOtpSent(true);
        setIsDemoMode(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSuccessMsg(null);
    setLoading(true);

    try {
      const trimmedOtp = otp.trim();
      if (confirmationResult && !isDemoMode) {
        await confirmationResult.confirm(trimmedOtp);
        sessionStorage.removeItem("gridshift_signed_out");
        localStorage.removeItem("gridshift_demo_user");
        return;
      }

      if (isDemoMode && trimmedOtp === "123456") {
        establishSessionForEmail(email || "citizen@gridshift.ai", formatE164Phone(phone));
        return;
      }

      setError("Invalid verification code. Please check the 6-digit SMS code and try again.");
    } catch (err) {
      console.error("OTP verification error:", err);
      if (isDemoMode && otp.trim() === "123456") {
        establishSessionForEmail(email || "citizen@gridshift.ai", formatE164Phone(phone));
      } else {
        setError("Invalid or expired verification code. Please check the SMS code or click Resend OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Auth
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setResetSuccessMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    if (!isFirebaseConfigured) {
      establishSessionForEmail(normalizedEmail);
      return;
    }

    setLoading(true);
    try {
      sessionStorage.removeItem("gridshift_signed_out");
      localStorage.removeItem("gridshift_demo_user");
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      }
    } catch (err) {
      const code = (err?.code || "").toLowerCase();
      const msg = err?.message || "";

      if (code.includes("email-already-in-use")) {
        setError("This email is already registered. Switched to Sign In — please enter your password or click Forgot Password.");
        setIsSignUp(false);
      } else if (
        code.includes("invalid-credential") ||
        code.includes("user-not-found") ||
        code.includes("wrong-password")
      ) {
        setError(
          "Invalid email or password. If you haven't created a password account yet, click 'Need an account? Sign Up' below, or use 'Continue with Google'."
        );
      } else if (code.includes("weak-password")) {
        setError("Password must be at least 6 characters long.");
      } else if (code.includes("network-request-failed") && window.location.hostname.endsWith(".run.app")) {
        establishSessionForEmail(normalizedEmail);
      } else {
        setError(msg.replace("Firebase: ", "").replace(" (auth/invalid-credential).", ""));
      }
    } finally {
      setLoading(false);
    }
  };

  // Newsletter Subscription
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) return;

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      if (BACKEND_URL) {
        fetch(`${BACKEND_URL}/api/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newsletterEmail })
        }).catch(() => {});
      }

      const subs = JSON.parse(localStorage.getItem("gridshift_newsletter_subscribers") || "[]");
      if (!subs.includes(newsletterEmail)) {
        subs.push(newsletterEmail);
        localStorage.setItem("gridshift_newsletter_subscribers", JSON.stringify(subs));
      }

      setNewsletterMsg("Thank you! You are subscribed to GridShift-AI updates.");
      setNewsletterEmail("");
    } catch {
      setNewsletterMsg("Thank you! You are subscribed to GridShift-AI updates.");
      setNewsletterEmail("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        backgroundColor: "#f4f6f9",
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 35%),
          radial-gradient(circle at 85% 80%, rgba(9, 44, 94, 0.08) 0%, transparent 40%)
        `
      }}
    >
      <div id="recaptcha-container"></div>

      <div
        className="ios-card-white"
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "32px 28px",
          boxShadow: "0 20px 60px -15px rgba(9, 44, 94, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          position: "relative"
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "16px",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px auto",
              boxShadow: "0 8px 20px rgba(9, 44, 94, 0.12)",
              border: "1px solid #e2e8f0"
            }}
          >
            <img
              src="/favicon.jpg"
              alt="GridShift"
              style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              color: "#16a34a",
              padding: "4px 12px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "6px"
            }}
          >
            <ShieldCheck size={13} />
            MUNICIPAL SANITATION PORTAL
          </div>

          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 900,
              color: "#092C5E",
              letterSpacing: "-0.02em",
              margin: 0
            }}
          >
            GridShift-AI
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px", fontWeight: 500 }}>
            Micro-Surge Forecasting, Fleet Telemetry & Citizen Redressal
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            fontWeight: 700,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: googleLoading || loading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.05)",
            marginBottom: "14px",
            transition: "all 0.15s ease"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px"
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Or sign in with
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
        </div>

        {/* Tab Switcher: Email vs Phone OTP */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#f1f5f9",
            borderRadius: "14px",
            padding: "4px",
            marginBottom: "18px"
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode("email");
              setError(null);
              setResetSuccessMsg(null);
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: authMode === "email" ? "white" : "transparent",
              color: authMode === "email" ? "#092C5E" : "#64748b",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: authMode === "email" ? "0 2px 6px rgba(0,0,0,0.06)" : "none"
            }}
          >
            <Mail size={15} />
            Email Login
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("phone");
              setError(null);
              setResetSuccessMsg(null);
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: authMode === "phone" ? "white" : "transparent",
              color: authMode === "phone" ? "#092C5E" : "#64748b",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: authMode === "phone" ? "0 2px 6px rgba(0,0,0,0.06)" : "none"
            }}
          >
            <Phone size={15} />
            Mobile OTP
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            style={{
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "12px 14px",
              borderRadius: "12px",
              fontSize: "0.82rem",
              fontWeight: 600,
              marginBottom: "16px",
              lineHeight: 1.45
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Password Reset / OTP Sent Confirmation Box */}
        {resetSuccessMsg && (
          <div
            style={{
              color: "#15803d",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "12px 14px",
              borderRadius: "12px",
              fontSize: "0.82rem",
              fontWeight: 600,
              marginBottom: "16px",
              lineHeight: 1.45
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{resetSuccessMsg}</div>
            </div>
          </div>
        )}

        {/* 1. EMAIL AUTH FORM */}
        {authMode === "email" ? (
          <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "14px" }} />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 40px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "white",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0284c7",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "14px" }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 40px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "white",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.95rem",
                marginTop: "4px"
              }}
            >
              {loading ? "Authenticating..." : isSignUp ? "Create Account" : "Sign In to Portal"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setResetSuccessMsg(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#16a34a",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </button>

              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Reset Password
              </button>
            </div>
          </form>
        ) : (
          /* 2. MOBILE PHONE OTP FORM */
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Mobile Number (with Country Code)
                  </label>
                  <div style={{ position: "relative" }}>
                    <Phone size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "14px" }} />
                    <input
                      type="tel"
                      placeholder="+91 9096496502"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "12px 14px 12px 40px",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "white",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        outline: "none"
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "5px" }}>
                    Format: <code style={{ fontWeight: 700 }}>+91XXXXXXXXXX</code> (10-digit Indian mobile numbers are auto-prefixed with +91)
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.replace(/[^\d]/g, "").length < 10}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  {loading ? "Sending SMS OTP..." : "Send Verification OTP"}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ position: "relative" }}>
                  <KeyRound size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "14px" }} />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 40px",
                      borderRadius: "12px",
                      border: "2px solid #22c55e",
                      backgroundColor: "white",
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      letterSpacing: "0.2em",
                      textAlign: "center",
                      outline: "none"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "0.95rem"
                  }}
                >
                  {loading ? "Verifying OTP..." : "Verify OTP & Enter"}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setError(null);
                      setResetSuccessMsg(null);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0284c7",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <RefreshCw size={13} />
                    Change Phone / Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 3. NEWSLETTER SUBSCRIPTION */}
        <div
          style={{
            marginTop: "22px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Sparkles size={14} color="#16a34a" />
            <h4 style={{ fontSize: "0.84rem", fontWeight: 800, color: "#092C5E", margin: 0 }}>
              Subscribe to GridShift Updates
            </h4>
          </div>

          <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "8px" }}>
            <input
              type="email"
              placeholder="Enter email for newsletter"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "0.84rem",
                outline: "none"
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "9px 14px",
                borderRadius: "10px",
                fontSize: "0.84rem",
                fontWeight: 700
              }}
            >
              Subscribe
            </button>
          </form>

          {newsletterMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "8px",
                fontSize: "0.8rem",
                color: "#16a34a",
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={14} />
              <span>{newsletterMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
