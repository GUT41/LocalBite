/**
 * Public config only (safe to ship in client). Add real values in `.env` with EXPO_PUBLIC_ prefix.
 * After changing .env: restart Metro with `npx expo start -c`.
 */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const firebaseEnvConfigured = (): boolean => {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
  return projectId.length > 0 && apiKey.length > 0;
};
