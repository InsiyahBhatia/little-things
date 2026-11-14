'use client';

import { useEffect } from 'react';
import { BASE_PATH } from '@/lib/assets';

/**
 * Registers the offline service worker in production, so the game can be
 * installed to a phone's home screen and played without a connection.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch((err) => {
        console.warn('[Little Things] offline mode is unavailable', err);
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
}
