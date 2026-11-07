import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function scrollToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const mainViewport = document.querySelector('.main-viewport');
    if (mainViewport) {
      mainViewport.scrollTop = 0;
    }
  }
}

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    scrollToTop();
  }, [pathname, search]);

  return null;
}

