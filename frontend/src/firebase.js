import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const ADMIN_EMAIL = "pranavkantak9@gmail.com";

export function isAdminUser(user) {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function loadFirebaseConfig() {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  if (envConfig.apiKey) {
    return envConfig;
  }

  // On Firebase Hosting, load runtime config from /__/firebase/init.json without hardcoding keys in source
  if (typeof window !== "undefined") {
    try {
      const request = new XMLHttpRequest();
      request.open("GET", "/__/firebase/init.json", false);
      request.send(null);
      if (request.status === 200 && request.responseText) {
        const runtimeConfig = JSON.parse(request.responseText);
        if (runtimeConfig && runtimeConfig.apiKey) {
          return runtimeConfig;
        }
      }
    } catch {
      // Ignore if not running on Firebase Hosting
    }
  }

  return envConfig;
}

const firebaseConfig = loadFirebaseConfig();

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

// Initialize Firebase using environment or Firebase Hosting runtime config
const app = initializeApp(
  isFirebaseConfigured
    ? firebaseConfig
    : {
        apiKey: "unconfigured-local-preview",
        authDomain: "localhost",
        projectId: "local-preview"
      }
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
