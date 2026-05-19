import Constants from 'expo-constants';

/** Production Railway API (used when EXPO_PUBLIC_API_URL is not set at build time). */
export const PRODUCTION_API_URL =
  'https://optimistic-art-production-b170.up.railway.app';

function fromExpoExtra(): string {
  const extra = Constants.expoConfig?.extra?.apiUrl;
  return typeof extra === 'string' ? extra.trim() : '';
}

/**
 * Backend base URL — no emulator or LAN fallbacks.
 * Set EXPO_PUBLIC_API_URL in `.env` before `eas build`.
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  fromExpoExtra() ||
  PRODUCTION_API_URL
).replace(/\/$/, '');

/** @deprecated Use API_URL — kept for existing imports */
export const API_BASE_URL = API_URL;

export const API_TIMEOUT = 15000;

if (__DEV__) {
  console.log('[LocalBite] API_URL:', API_URL);
}
