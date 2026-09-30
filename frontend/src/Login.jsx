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
      </div>
    </div>
  );
}

export default Login;
