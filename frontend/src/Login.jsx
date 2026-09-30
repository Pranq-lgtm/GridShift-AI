import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import "./index.css";

function Login() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert("Failed to login. Ensure Firebase is configured in .env");
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', textAlign: 'center', zIndex: 10 }}>
        <h1 style={{ marginBottom: '10px' }}>GridShift-AI</h1>
        <p style={{ marginBottom: '30px' }}>Micro-Surge Waste Forecasting</p>
        
        <button className="btn btn-primary" onClick={handleGoogleLogin} style={{ width: '100%', padding: '12px' }}>
          Sign In with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
