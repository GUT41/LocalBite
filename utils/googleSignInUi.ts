import { Alert } from 'react-native';
import { hasNativeGoogleSignInBinary } from './googleSignInRuntime';

/**
 * Shared Google Sign-In entry for Login / Register (Expo Go guard + env + dynamic import).
 */
export async function runGoogleSignInForNavigation(): Promise<void> {
  if (!hasNativeGoogleSignInBinary()) {
    Alert.alert(
      'Google Sign-In unavailable',
      'Expo Go does not include the native Google Sign-In module. Build and install a development app:\n\nnpx expo run:android\n\nThen open that app (not Expo Go) while Metro is running.'
    );
    return;
  }
  try {
    let google: typeof import('./googleSignIn');
    try {
      google = await import('./googleSignIn');
    } catch {
      Alert.alert(
        'Rebuild required',
        'The Google Sign-In native module is missing from this install. Run:\n\nnpx expo run:android\n\nUninstall the old app from the device first if the error persists.'
      );
      return;
    }
    if (!google.isGoogleSignInConfigured()) {
      Alert.alert(
        'Google Sign-In',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file (Web client ID from Firebase / Google Cloud). Restart Metro with npx expo start -c.'
      );
      return;
    }
    await google.signInWithGoogle();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    Alert.alert('Google Sign-In', message);
  }
}
