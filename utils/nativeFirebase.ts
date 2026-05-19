import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * True when running a custom dev/production build (not Expo Go).
 * @react-native-firebase requires native code that Expo Go does not include.
 */
export function hasNativeFirebase(): boolean {
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}
