import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider } from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { auth, usersCollection } from './firebase';
import { GOOGLE_WEB_CLIENT_ID } from '../constants/env';
import { isUserStatus, type UserRole } from '../types/auth.types';

let configured = false;

export function isGoogleSignInConfigured(): boolean {
  return GOOGLE_WEB_CLIENT_ID.length > 0;
}

export function configureGoogleSignIn(): void {
  if (!GOOGLE_WEB_CLIENT_ID || configured) {
    return;
  }
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

async function ensureFirstPartyUserDoc(user: FirebaseAuthTypes.User): Promise<void> {
  const ref = usersCollection().doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) {
    return;
  }
  const email = user.email ?? '';
  const name = user.displayName ?? email.split('@')[0] ?? 'User';
  await ref.set({
    uid: user.uid,
    email,
    name,
    photoURL: user.photoURL ?? null,
    role: 'user' as UserRole,
    provider: 'google',
    status: 'active',
    createdAt: new Date(),
  });
}

function parseStatus(data: FirebaseFirestoreTypes.DocumentData | undefined): string {
  const raw = data?.status;
  return isUserStatus(raw) ? raw : 'active';
}

/**
 * Google sign-in → Firebase Auth → optional first Firestore profile.
 * Navigation is handled by AuthContext (role from Firestore `users/{uid}`).
 */
export async function signInWithGoogle(): Promise<void> {
  if (!isGoogleSignInConfigured()) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Add the Web client ID from Firebase Console to your .env file.'
    );
  }

  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const result = await GoogleSignin.signIn();
  if (result.type !== 'success') {
    throw new Error('Sign-in was cancelled.');
  }

  const tokens = await GoogleSignin.getTokens();
  const idToken = tokens.idToken;
  if (!idToken) {
    throw new Error(
      'No ID token from Google. In Firebase Console, add SHA-1 for your debug keystore and enable Google Sign-In; then download an updated google-services.json if needed.'
    );
  }

  const credential = GoogleAuthProvider.credential(idToken);
  await auth().signInWithCredential(credential);

  const user = auth().currentUser;
  if (!user) {
    throw new Error('Firebase sign-in did not return a user.');
  }

  await ensureFirstPartyUserDoc(user);

  const profileSnap = await usersCollection().doc(user.uid).get();
  const data = profileSnap.data();
  const status = parseStatus(data);

  if (status === 'suspended') {
    await auth().signOut();
    await GoogleSignin.signOut();
    throw new Error('This account has been suspended. Contact support.');
  }
}
