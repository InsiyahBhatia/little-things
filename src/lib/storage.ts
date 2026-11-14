/**
 * localStorage wrapper that never throws. Storage can be missing or throw in
 * private browsing, sandboxed iframes, or when the quota is full; the game
 * must keep running in all of those cases.
 */
function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  get(key: string): string | null {
    try {
      return getStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },

  set(key: string, value: string): boolean {
    try {
      const storage = getStorage();
      if (!storage) return false;
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): void {
    try {
      getStorage()?.removeItem(key);
    } catch {
      /* nothing to clean up */
    }
  },
};
