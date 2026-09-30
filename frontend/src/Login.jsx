import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./index.css";

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${BACKEND_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      setNewsletterMsg(data.message || "Subscribed!");
      setNewsletterEmail("");
    } catch (err) {
      setNewsletterMsg("Failed to subscribe.");
    }
  };

  const handleSubmit = async (e) => {
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
      // Clean up Firebase error messages for the UI
      setError(err.message.replace("Firebase: ", "").replace(" (auth/invalid-credential).", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', textAlign: 'center', zIndex: 10 }}>
        <h1 style={{ marginBottom: '10px' }}>GridShift-AI</h1>
        <p style={{ marginBottom: '30px' }}>Micro-Surge Waste Forecasting</p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-glass-border)', background: 'rgba(255,255,255,0.5)', outline: 'none' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-glass-border)', background: 'rgba(255,255,255,0.5)', outline: 'none' }}
          />
          
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
            {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-accent-green)' }} onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
        </p>

        <div style={{ marginTop: '30px', borderTop: '1px solid var(--color-glass-border)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Subscribe to GridShift Updates</h4>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '5px' }}>
            <input 
              type="email" 
              placeholder="Email for Newsletter" 
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--color-glass-border)', background: 'rgba(255,255,255,0.5)', outline: 'none', fontSize: '0.8rem' }}
            />
            <button className="btn btn-primary" type="submit" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
              Subscribe
            </button>
          </form>
          {newsletterMsg && <p style={{ fontSize: '0.75rem', marginTop: '10px', color: 'var(--color-accent-green)' }}>{newsletterMsg}</p>}
        </div>
      </div>
    </div>
  );
}

export default Login;
