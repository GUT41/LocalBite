/**
 * Lazy Firebase access — no top-level @react-native-firebase imports (Expo Go safe).
 */
import { hasNativeFirebase } from './nativeFirebase';

function requireFirebaseAuth() {
  if (!hasNativeFirebase()) {
    throw new Error('Firebase requires a development build. Use Expo Go demo mode to preview UI.');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-firebase/auth').default;
}

function requireFirebaseFirestore() {
  if (!hasNativeFirebase()) {
    throw new Error('Firebase requires a development build.');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-firebase/firestore').default;
}

export function auth() {
  return requireFirebaseAuth()();
}

export function firestore() {
  return requireFirebaseFirestore()();
}

export const usersCollection = () => firestore().collection('users');
export const vendorsCollection = () => firestore().collection('vendors');
export const productsCollection = () => firestore().collection('products');
export const restaurantsCollection = () => firestore().collection('restaurants');
export const menusCollection = () => firestore().collection('menus');
