/**
 * Native Firebase (@react-native-firebase) initializes from google-services.json on Android.
 * This module only marks JS-side readiness and exposes config from `.env` for helpers.
 */
import { firebaseConfig, isFirebaseConfigComplete } from '../constants/firebase';

let initialized = false;

export function initializeFirebase(): void {
  if (initialized) {
    return;
  }
  if (!isFirebaseConfigComplete()) {
    console.warn(
      'Firebase .env config is incomplete. Set EXPO_PUBLIC_FIREBASE_* in .env and restart Metro (npx expo start -c).'
    );
  }
  initialized = true;
}

export function getFirebaseConfig() {
  return { ...firebaseConfig };
}

export function getGoogleWebClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
}
