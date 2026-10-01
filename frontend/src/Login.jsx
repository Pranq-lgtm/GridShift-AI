import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPhoneNumber, 
  RecaptchaVerifier 
} from "firebase/auth";
import { auth } from "./firebase";
import { Mail, Lock, Phone, ShieldCheck, CheckCircle2, ArrowRight, KeyRound, Sparkles, AlertCircle, Zap } from "lucide-react";
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
  const [isDemoMode, setIsDemoMode] = useState(false);

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

  // Demo Login Helper
  const triggerDemoLogin = (customPhone) => {
    const finalPhone = customPhone || phone || "+919096496502";
    const demoUserData = {
      uid: "demo-" + Date.now(),
      phoneNumber: finalPhone,
      email: "officer@gridshift.ai",
      displayName: "GridShift Officer",
      isDemo: true
    };
    localStorage.setItem("gridshift_demo_user", JSON.stringify(demoUserData));
    window.dispatchEvent(new Event("gridshift_auth_change"));
  };

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
      setIsDemoMode(false);
    } catch (err) {
      console.error("Phone Auth Error:", err);
      const msg = err.message || "";
      if (msg.includes("auth/operation-not-allowed") || msg.includes("region enabled") || msg.includes("SMS unable to be sent")) {
        setError("Firebase Phone Auth provider is not enabled in Firebase Console (Authentication > Sign-in method > Phone) or SMS region policy is restricted for this region.");
        setIsDemoMode(true);
      } else if (msg.includes("auth/invalid-phone-number")) {
        setError("Invalid phone number format. Please include country code e.g. +91 9876543210.");
      } else {
        setError(msg.replace("Firebase: ", ""));
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
    setLoading(true);

    try {
      if (isDemoMode || !confirmationResult || otp === "123456") {
        // Instant Demo verification
        triggerDemoLogin(phone);
        return;
      }

      await confirmationResult.confirm(otp);
      // Firebase onAuthStateChanged will handle login redirect
    } catch (err) {
      console.error("OTP verification error:", err);
      // Allow fallback if user typed 123456 in demo mode
      if (otp === "123456") {
        triggerDemoLogin(phone);
      } else {
        setError("Invalid OTP code. For test mode, you can also enter 123456 or click 'Demo Instant Access'.");
      }
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

  // Resilient Newsletter Subscription
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
        }).catch(() => console.log("Backend offline, cached locally"));
      }

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
          maxWidth: "460px",
          padding: "36px 28px",
          boxShadow: "0 20px 60px -15px rgba(9, 44, 94, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          position: "relative"
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
              boxShadow: "0 8px 20px rgba(9, 44, 94, 0.12)",
              border: "1px solid #e2e8f0"
            }}
          >
            <img
              src="/favicon.jpg"
              alt="GridShift"
              style={{ width: "38px", height: "38px", borderRadius: "10px", objectFit: "contain" }}
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
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "4px", fontWeight: 500 }}>
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
            marginBottom: "20px"
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

        {/* Error Alert Box + Demo Mode CTA */}
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
              lineHeight: 1.4
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: isDemoMode ? "8px" : "0" }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>{error}</div>
            </div>

            {isDemoMode && (
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #fee2e2" }}>
                <p style={{ margin: "0 0 8px 0", fontSize: "0.78rem", color: "#7f1d1d" }}>
                  💡 <strong>Testing Mode:</strong> You can enter immediately using Demo OTP without waiting for SMS:
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(true);
                      setOtp("123456");
                      setError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "#092C5E",
                      color: "white",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Enter Demo Code (123456)
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerDemoLogin()}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "#22c55e",
                      color: "white",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ⚡ Instant Portal Access
                  </button>
                </div>
              </div>
            )}
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
                  placeholder="officer@gridshift.ai"
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
                marginTop: "4px"
              }}
            >
              {loading ? "Verifying..." : isSignUp ? "Create Account" : "Sign In to Portal"}
            </button>

            {/* Quick Demo Mode Bypass */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#16a34a",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {isSignUp ? "Have an account? Sign In" : "Need account? Sign Up"}
              </button>

              <button
                type="button"
                onClick={() => triggerDemoLogin()}
                style={{
                  background: "none",
                  border: "none",
                  color: "#092C5E",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Zap size={13} color="#22c55e" />
                Demo Access
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

                {/* Instant Demo OTP Bypass Button */}
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(true);
                    setOtp("123456");
                    setIsDemoMode(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "10px",
                    backgroundColor: "#f1f5f9",
                    color: "#092C5E",
                    border: "1px dashed #cbd5e1",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer"
                  }}
                >
                  <Zap size={14} color="#16a34a" />
                  <span>Instant Demo Mode (Code: 123456)</span>
                </button>
              </form>
            ) : (
              /* OTP Code Input */
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                  <div style={{ fontSize: "0.85rem", color: "#334155" }}>
                    Enter 6-digit code for <strong style={{ color: "#092C5E" }}>{phone}</strong>
                  </div>
                  {isDemoMode && (
                    <span style={{ display: "inline-block", backgroundColor: "#ecfdf5", color: "#065f46", fontSize: "11px", padding: "2px 8px", borderRadius: "6px", marginTop: "4px", fontWeight: 700 }}>
                      Demo Code pre-filled: 123456
                    </span>
                  )}
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

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setIsDemoMode(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Change phone number
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerDemoLogin()}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#16a34a",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Bypass & Enter
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 3. NEWSLETTER SUBSCRIPTION */}
        <div
          style={{
            marginTop: "28px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "18px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
            <Sparkles size={14} color="#16a34a" />
            <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#092C5E", margin: 0 }}>
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
