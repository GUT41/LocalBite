# LocalBite setup checklist

## 1. Backend (`backend/.env`)

```env
GOOGLE_PLACES_API_KEY=your-key
JWT_SECRET=localbite-secret-key-2024
API_PUBLIC_URL=http://192.168.254.107:3001
PORT=3001
# Optional Firestore cache:
# FIREBASE_CONFIG={"type":"service_account",...}
```

```bash
cd backend
npm install
npm start
```

Test:

```bash
curl http://127.0.0.1:3001/health
curl "http://127.0.0.1:3001/api/restaurants/nearby?lat=6.95&lng=126.22"
```

## 2. Mobile (root `.env`)

Set `EXPO_PUBLIC_API_URL`:

- **Android emulator:** `http://10.0.2.2:3001`
- **Physical device:** `http://192.168.254.107:3001` (your PC LAN IP)

```bash
npx expo start -c
```

## 3. Firestore test data

**Option A — Console:** Add documents to `restaurants` and `menus` (see prompt samples).

**Option B — Script:**

```bash
# Add FIREBASE_CONFIG to backend/.env first
cd backend
node scripts/seedFirestore.js
```

## 4. Verify app

- **Discover** tab → nearby + recommended (Google Places via backend)
- **Map** → markers from same API
- **Favorites** → saved restaurants
- No GrabFood / TheMealDB code in the app

## Troubleshooting

| Issue | Fix |
|--------|-----|
| Network request failed | Backend running? Correct `EXPO_PUBLIC_API_URL`? |
| 0 restaurants | Enable Places API in Google Cloud; check API key billing |
| Expo Go + Firebase | Use dev build for native Firebase; API still works in Expo Go |
