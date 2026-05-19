# Firebase Authentication Setup for Local Bite

This project uses Firebase for authentication with support for Email/Password and Google Sign-In.

## Current Configuration

✅ **Completed:**
- Firebase credentials configured in `.env` file
- Firebase initialization setup in `App.tsx`
- Google Sign-In utility functions created
- Environment variables properly prefixed with `EXPO_PUBLIC_`

## Environment Variables

All Firebase credentials are stored in `.env` (already created):
```
EXPO_PUBLIC_FIREBASE_PROJECT_ID=localbite-d8cc0
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

## IMPORTANT: Next Steps for Android Build

Since Firebase requires native configuration, follow these steps to build for Android:

### 1. Download google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **localbite-d8cc0**
3. Click **⚙️ Project Settings**
4. Go to **Your apps** section
5. Select the Android app
6. Click **Download google-services.json**
7. Place the file in your project root: `./google-services.json`

### 2. Set Up Android Build with Prebuild

The Expo managed build system will automatically handle native configuration:

```bash
# For development
npx eas build --platform android --profile development

# For production
npx eas build --platform android --profile production
```

### 3. Local Android Development (if needed)

For running on emulator with `expo run:android`:

```bash
# Prebuild will generate the native Android project
npx expo prebuild --clean

# Then run
npx expo run:android
```

**Note:** Ensure `google-services.json` is in the root directory before running `expo prebuild`.

## Firebase Modules Used

- **`@react-native-firebase/app`** - Core Firebase
- **`@react-native-firebase/auth`** - Authentication
- **`@react-native-firebase/firestore`** - Database

## Google Sign-In Configuration

### Android Setup (Automatic via Prebuild)

When you run `npx expo prebuild`:
- The `google-services.json` is automatically processed
- Android build.gradle is configured by Expo
- Signing configuration is handled

### Web Client ID

The Google Web Client ID is used for cross-platform authentication:
```
YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

## Firestore Security Rules

Your firestore.rules file is already configured to:
- Allow public read access to vendors and products
- Restrict admin operations to authenticated admins
- Enforce user profile security

## AuthContext

The `AuthContext` in `contexts/AuthContext.tsx` already handles:
- ✅ Auth state persistence
- ✅ User role checking (admin vs user)
- ✅ Account status verification (active/suspended)
- ✅ Profile data fetching from Firestore

## Usage Example

In your components:

```tsx
import { useAuth } from './contexts/AuthContext';

export default function MyComponent() {
  const { user, role, loading } = useAuth();

  if (loading) return <ActivityIndicator />;
  if (!user) return <LoginScreen />;

  return (
    <Text>
      Welcome {user.email} ({role})
    </Text>
  );
}
```

## Troubleshooting

### Firebase not initializing?
- Check that `.env` file exists and has EXPO_PUBLIC_* variables
- Ensure `google-services.json` is present for Android builds
- Verify `initializeFirebase()` is called in App.tsx

### Google Sign-In fails?
- Confirm webClientId is correctly set in `.env`
- Ensure Google Play Services are installed on device/emulator
- Check that signing certificate is registered in Google Cloud Console

### Build fails after prebuild?
- Delete `android/` and `ios/` folders
- Run `npx expo prebuild --clean` again
- Ensure `google-services.json` is in root directory

## Resources

- [Expo Firebase Documentation](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Firebase Console](https://console.firebase.google.com/)
