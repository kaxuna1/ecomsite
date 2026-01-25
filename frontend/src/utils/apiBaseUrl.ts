const DEV_FALLBACK = 'http://localhost:4000';

const resolveBrowserOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEV_FALLBACK;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? DEV_FALLBACK : resolveBrowserOrigin());
