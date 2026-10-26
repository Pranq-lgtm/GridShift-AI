import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const ADMIN_EMAIL = "pranavkantak9@gmail.com";

export function isAdminUser(user) {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// GridShift-AI Firebase configuration (https://gridshift-ai.web.app/)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDFq4cNOY5KpxrBzcRRXSa73Kqu76zrjH0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gridshift-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gridshift-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gridshift-ai.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "751801511538",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:751801511538:web:366ba6bb441e155d2e1ceb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7HVGQEDNKF"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("DummyKey")
);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
