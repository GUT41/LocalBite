# Google Places integration (LocalBite)

## Architecture

```
React Native App  →  Express API (backend/)  →  Google Places API
                           ↓
                    Firestore cache
```

**Never** put `GOOGLE_PLACES_API_KEY` in the Expo app. Use `EXPO_PUBLIC_API_URL` only.

## Backend setup

1. `cd backend && npm install`
2. Copy `backend/.env.example` → `backend/.env`
3. Set variables:

```env
PORT=3001
GOOGLE_PLACES_API_KEY=your-key
JWT_SECRET=change-me
FIREBASE_CONFIG={"type":"service_account",...}
API_PUBLIC_URL=http://192.168.1.100:3001
```

4. Enable in Google Cloud Console:
   - Places API
   - Places API (New) or legacy Nearby Search / Place Details / Place Photos
   - Geocoding API (optional)

5. Start server: `npm start`

## Mobile setup

1. Add to `.env`:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

2. Physical device: use your PC LAN IP, e.g. `http://192.168.1.50:3001`

3. `npx expo start -c`

## API examples

```http
GET /api/restaurants/nearby?lat=7.0731&lng=125.6128&radius=5000
GET /api/restaurants/search?q=seafood&lat=7.0731&lng=125.6128
GET /api/restaurants/details/ChIJ...?lat=7.0731&lng=125.6128
GET /api/restaurants/recommendations?lat=7.0731&lng=125.6128&maxPrice=3
GET /api/restaurants/photo?ref=PHOTO_REF&maxwidth=400
```

## Admin JWT (dev)

```js
// Node REPL with JWT_SECRET set
const jwt = require('jsonwebtoken');
console.log(jwt.sign({ uid: 'admin1', role: 'admin' }, process.env.JWT_SECRET));
```

Use token in **Manage Restaurants** / **Manage Menus** screens.

## Firestore collections

- `restaurants` — cached Google + manual entries
- `menus` — admin menu items per `restaurantId` (placeId)
- `favorites` — user saved restaurants (`type: 'restaurant'`)
- `recommendations` — scored suggestions
- `reviews` — reserved for future user reviews

## Recommendation formula

```
Score = 0.4×Rating + 0.3×Popularity + 0.2×Distance + 0.1×BudgetMatch
```

Plus boosts for favorites, open now, and cuisine match.
