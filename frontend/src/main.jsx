import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Tier 1: Global Google Maps Platform authentication & quota failure listeners
window.gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const _origConsoleError = console.error;
console.error = (...args) => {
  _origConsoleError.apply(console, args);
  if (args.some((a) => typeof a === 'string' && a.includes('OverQuotaMapError'))) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

// Handle redirect from 404.html fallback (for static hosts without rewrite rules)
const redirectPath = new URLSearchParams(window.location.search).get('redirect');
if (redirectPath) {
  window.history.replaceState(null, '', redirectPath);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
