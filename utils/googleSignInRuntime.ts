import { hasNativeFirebase } from './nativeFirebase';

/** @deprecated Use hasNativeFirebase() — Google Sign-In removed; same Expo Go vs dev-build check. */
export function hasNativeGoogleSignInBinary(): boolean {
  return hasNativeFirebase();
}
