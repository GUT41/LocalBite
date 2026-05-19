import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Default coordinates for Mati City (Davao Oriental, Philippines).
 */
export const EXPLORE_DEFAULT_COORDS = { lat: 6.9510513, lng: 126.2195947 };

/**
 * LocalBite Express API — all restaurant data via backend (never Google from the app).
 * Set EXPO_PUBLIC_API_URL in `.env` (see app.config.js → extra.apiUrl).
 */
const DEFAULT_API =
  Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://127.0.0.1:3001';

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  const extra = Constants.expoConfig?.extra?.apiUrl;
  const fromExtra = typeof extra === 'string' ? extra.trim() : '';
  const url = fromEnv || fromExtra || DEFAULT_API;
  return url.replace(/\/$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

if (__DEV__) {
  console.log('[LocalBite] API_BASE_URL:', API_BASE_URL);
}

export const API_TIMEOUT = 15000;
