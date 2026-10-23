import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const ADMIN_EMAIL = "pranavkantak9@gmail.com";

export function isAdminUser(user) {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Your web app's Firebase configuration
// Uses VITE_FIREBASE_* environment variables configured in Vercel / .env,
// with safe fallback values so local preview environments without .env keys do not crash on boot.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForLocalPreviewFallback00000",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gridshift-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gridshift-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gridshift-ai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:00000000000000",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0000000000"
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSyDummyKeyForLocalPreviewFallback00000"
);

// Initialize Firebase safely
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
