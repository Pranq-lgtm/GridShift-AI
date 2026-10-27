import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const hostingSite =
    process.env.VITE_FIREBASE_PROJECT_ID ||
    env.VITE_FIREBASE_PROJECT_ID ||
    'gridshift-ai'

  if (!process.env.VITE_FIREBASE_API_KEY && !env.VITE_FIREBASE_API_KEY) {
    try {
      const res = await fetch(`https://${hostingSite}.web.app/__/firebase/init.json`)
      if (res.ok) {
        const fbInit = await res.json()
        process.env.VITE_FIREBASE_API_KEY = fbInit.apiKey || ''
        process.env.VITE_FIREBASE_AUTH_DOMAIN = `${hostingSite}.web.app`
        process.env.VITE_FIREBASE_PROJECT_ID = fbInit.projectId || hostingSite
        process.env.VITE_FIREBASE_STORAGE_BUCKET =
          fbInit.storageBucket || `${hostingSite}.firebasestorage.app`
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID =
          fbInit.messagingSenderId || ''
        process.env.VITE_FIREBASE_APP_ID = fbInit.appId || ''
        process.env.VITE_FIREBASE_MEASUREMENT_ID = fbInit.measurementId || ''
      }
    } catch {
      // Offline build environment fallback
    }
  }

  const resolvedBackendUrl = (
    process.env.VITE_BACKEND_URL ||
    env.VITE_BACKEND_URL ||
    process.env.VITE_ML_SERVICE_URL ||
    env.VITE_ML_SERVICE_URL ||
    process.env.ML_SERVICE_URL ||
    env.ML_SERVICE_URL ||
    'https://gridshift-ml.onrender.com'
  ).replace(/\/+$/, '')

  process.env.VITE_BACKEND_URL = resolvedBackendUrl
  process.env.VITE_ML_SERVICE_URL = resolvedBackendUrl
  process.env.ML_SERVICE_URL = resolvedBackendUrl

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'ML_SERVICE_'],
  }
})
