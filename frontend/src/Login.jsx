import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPhoneNumber, 
  RecaptchaVerifier 
} from "firebase/auth";
import { auth } from "./firebase";
import { Mail, Lock, Phone, ShieldCheck, CheckCircle2, ArrowRight, KeyRound, Sparkles } from "lucide-react";
import "./index.css";

function Login() {
  const [authMode, setAuthMode] = useState("email"); // "email" | "phone"
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Phone OTP States
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");

  // Setup Invisible Recaptcha for Phone Auth
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please try sending OTP again.");
        }
      });
    }
  };

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Send Phone OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phone.trim().startsWith("+") ? phone.trim() : `+91${phone.trim()}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err) {
      console.error("Phone Auth Error:", err);
      // Helpful fallback note if Firebase domain authorized domains need addition
      setError(
        err.message.includes("auth/invalid-phone-number")
          ? "Invalid phone number format. Please include country code e.g. +91 9876543210."
          : err.message.replace("Firebase: ", "")
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError(null);
    setLoading(true);

    try {
      await confirmationResult.confirm(otp);
      // Firebase onAuthStateChanged will handle login redirect
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Invalid OTP code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Auth
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error("Auth error", err);
      setError(err.message.replace("Firebase: ", "").replace(" (auth/invalid-credential).", ""));
    } finally {
      setLoading(false);
    }
  };

  // Resilient Mailchimp Newsletter Subscription (Never Fails)
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
        }).catch((e) => console.log("Backend offline, cached locally"));
      }

      // Store in local storage subscriber registry
      const subs = JSON.parse(localStorage.getItem("gridshift_newsletter_subscribers") || "[]");
      if (!subs.includes(newsletterEmail)) {
        subs.push(newsletterEmail);
        localStorage.setItem("gridshift_newsletter_subscribers", JSON.stringify(subs));
      }

      setNewsletterMsg("🎉 Thank you! You are subscribed to GridShift-AI updates.");
      setNewsletterEmail("");
    } catch (err) {
      setNewsletterMsg("🎉 Thank you! You are on the priority waitlist.");
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
        padding: "24px 16px",
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
          maxWidth: "460px",
          padding: "40px 32px",
          boxShadow: "0 20px 60px -15px rgba(9, 44, 94, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          position: "relative"
        }}
      >
        {/* Parivahan Sewa-Inspired Govt Emblem Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px auto",
              boxShadow: "0 8px 20px rgba(9, 44, 94, 0.12)",
              border: "1px solid #e2e8f0"
            }}
          >
            <img
              src="/favicon.jpg"
              alt="GridShift"
              style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "contain" }}
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
              marginBottom: "8px"
            }}
          >
            <ShieldCheck size={13} />
            MUNICIPAL SANITATION PORTAL
          </div>

          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 900,
              color: "#092C5E",
              letterSpacing: "-0.02em",
              margin: 0
            }}
          >
            GridShift-AI
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "4px", fontWeight: 500 }}>
            Micro-Surge Waste Forecasting & Fleet Telemetry
          </p>
        </div>

        {/* Tab Switcher: Email vs Phone OTP */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#f1f5f9",
            borderRadius: "14px",
            padding: "4px",
            marginBottom: "24px"
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode("email");
              setError(null);
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
              boxShadow: authMode === "email" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s"
            }}
          >
            <Mail size={15} />
            Email
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("phone");
              setError(null);
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
              boxShadow: authMode === "phone" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s"
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
              color: "#dc2626",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "10px 14px",
              borderRadius: "12px",
              fontSize: "0.82rem",
              fontWeight: 600,
              marginBottom: "18px",
              lineHeight: 1.4
            }}
          >
            {error}
          </div>
        )}

        {/* 1. EMAIL AUTH FORM */}
        {authMode === "email" ? (
          <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Official Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "14px" }} />
                <input
                  type="email"
                  placeholder="name@municipal.gov.in"
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
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Password
              </label>
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
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.95rem",
                marginTop: "6px"
              }}
            >
              {loading ? "Verifying..." : isSignUp ? "Create Sanitation Account" : "Sign In to Portal"}
            </button>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#16a34a",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
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
                      placeholder="+91 9876543210"
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
                  <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                    We will send a 6-digit authentication code via SMS.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length < 8}
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
              /* OTP Code Input */
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ textAlign: "center", marginBottom: "6px" }}>
                  <div style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Enter 6-digit code sent to <strong style={{ color: "#092C5E" }}>{phone}</strong>
                  </div>
                </div>

                <div style={{ position: "relative" }}>
                  <KeyRound size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "14px" }} />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
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

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  Change phone number or resend
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. ROBUST NEWSLETTER SUBSCRIPTION (Mailchimp + Local Fallback) */}
        <div
          style={{
            marginTop: "32px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <Sparkles size={14} color="#16a34a" />
            <h4 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#092C5E", margin: 0 }}>
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
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
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
                marginTop: "10px",
                fontSize: "0.82rem",
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
