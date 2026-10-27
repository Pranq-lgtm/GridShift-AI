import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const ADMIN_EMAIL = "pranavkantak9@gmail.com";
export const ADMIN_PHONE = "+919096496502";

export function isAdminUser(user) {
  if (!user) return false;
  if (user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  if (user.phoneNumber && user.phoneNumber.replace(/[^\d+]/g, "") === ADMIN_PHONE) {
    return true;
  }
  return false;
}

// Resolve Backend / ML Service URL cleanly (strips trailing slash so //api/... never occurs)
export function getBackendUrl() {
  const raw =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_ML_SERVICE_URL ||
    import.meta.env.ML_SERVICE_URL ||
    "";
  if (raw && raw.trim()) {
    return raw.trim().replace(/\/+$/, "");
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname.endsWith(".web.app") ||
      window.location.hostname.endsWith(".firebaseapp.com") ||
      window.location.hostname.endsWith(".vercel.app"))
  ) {
    return "https://gridshift-ml.onrender.com";
  }
  return "";
}

export const BACKEND_API_URL = getBackendUrl();

function loadFirebaseConfig() {
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
  const isFirebaseHosted =
    currentHost.endsWith(".web.app") || currentHost.endsWith(".firebaseapp.com");

  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    // Use same-origin authDomain when hosted on *.web.app or *.firebaseapp.com to prevent COOP / storage-partition blocks
    authDomain: isFirebaseHosted
      ? currentHost
      : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  if (envConfig.apiKey) {
    return envConfig;
  }

  // On Firebase Hosting, load runtime config from /__/firebase/init.json if build env vars were omitted
  if (typeof window !== "undefined") {
    try {
      const request = new XMLHttpRequest();
      request.open("GET", "/__/firebase/init.json", false);
      request.send(null);
      if (request.status === 200 && request.responseText) {
        const runtimeConfig = JSON.parse(request.responseText);
        if (runtimeConfig && runtimeConfig.apiKey) {
          return {
            ...runtimeConfig,
            authDomain: isFirebaseHosted ? currentHost : runtimeConfig.authDomain
          };
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
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });
