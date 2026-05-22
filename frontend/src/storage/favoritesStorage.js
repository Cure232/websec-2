const FAVORITES_STORAGE_KEY = import.meta.env.VITE_FAVORITES_STORAGE_KEY;

export function loadFavoritesFromStorage() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        item =>
          item &&
          typeof item === 'object' &&
          item.station &&
          typeof item.station === 'object' &&
          typeof item.station.code === 'string'
      )
      .map(item => ({ station: item.station }));
  } catch {
    return [];
  }
}

export function saveFavoritesToStorage(favorites) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore storage errors (private mode, quota, etc.) so schedule page stays usable.
  }
}
