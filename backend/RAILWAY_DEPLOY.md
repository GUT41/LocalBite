# Deploy LocalBite API to Railway

Backend: Node.js + Express + Firebase Firestore (`localbite-d8cc0`).  
Repo: [GUT41/LocalBite](https://github.com/GUT41/LocalBite)

## Prerequisites

- [Railway](https://railway.app) account (sign in with GitHub)
- Firebase service account JSON (Firebase Console → Project settings → Service accounts)
- Firestore enabled and data seeded (`npm run seed` run once against the same project)

## 1. Connect GitHub

1. Go to [railway.app](https://railway.app) and sign up / log in with **GitHub**.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select **`GUT41/LocalBite`**.

### ⚠️ Root Directory (required)

Railway must **not** deploy the Expo app at the repo root.

**Railway Dashboard → your service → Settings → Root Directory**

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |

Save, then **Redeploy**.

| Root Directory | What Railway runs |
|----------------|-------------------|
| `backend` ✅ | Express API (`node server.js`) |
| *(empty / `/`)* ❌ | Expo Metro (`expo start`) — wrong |

If Root Directory is empty, the repo root `Dockerfile` + `railway.toml` still build **only** `backend/` (fallback), but setting `backend` is strongly recommended.

## Troubleshooting: Railway deploying Expo instead of Express

### Symptoms (wrong deploy)

Opening your Railway URL shows JSON with any of:

- `expoGo`
- `sdkVersion`
- `index.bundle`
- Metro / manifest fields

That is the **Expo dev server**, not the API.

### Fix

1. **Settings → Root Directory → `backend`**
2. **Settings → Build** → Builder should be **Dockerfile** (not Nixpacks on root `package.json`)
3. **Redeploy** (Deployments → Redeploy)
4. Validate:

```bash
curl https://YOUR_RAILWAY_URL/health
```

**Must return:** `{"status":"ok",...}`  
**Must NOT return:** Expo / Metro JSON

### Correct vs incorrect targets

| Deploy target | Result |
|---------------|--------|
| `backend/` ✅ | Express on port 3001, `/health` works |
| Repo root (Expo) ❌ | Metro bundler JSON |

## 2. Environment variables

In Railway → your service → **Variables**, add:

| Variable | Value |
|----------|--------|
| `FIREBASE_CONFIG` | Full service account JSON (single line) |
| `JWT_SECRET` | Strong production secret |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

**`FIREBASE_CONFIG`:** Copy the entire contents of your `*-firebase-adminsdk-*.json` file. Paste as one line in Railway’s variable editor (or use Railway’s JSON secret UI).

Optional (local dev only — do not rely on file path in Railway):

| Variable | Value |
|----------|--------|
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Not used in Railway Docker builds |

## 3. Auto deploy

Every **push to `main`** that changes `backend/` triggers a new Railway build and deploy.

Manual redeploy: Railway dashboard → **Deployments** → **Redeploy**.

## 4. Get your public URL

Railway → service → **Settings** → **Networking** → **Generate Domain**.

Example: `https://localbite-api-production.up.railway.app`

Use this URL for all tests and for the mobile app.

## 5. Monitor logs

Railway → **Deployments** → latest deployment → **View Logs**.

Healthy logs should show:

```
[Firebase] Firestore ready (project: localbite-d8cc0)
LocalBite API listening on port 3001
```

Watch for:

- Missing `FIREBASE_CONFIG` / Firebase init errors
- Crash loops or repeated restarts
- `EADDRINUSE` or port binding errors

## 6. Rollback

1. Railway → **Deployments**
2. Select a previous **successful** deployment
3. Click **Redeploy** (or **Rollback** if offered)

Alternatively, revert the commit on `main` and push — Railway will deploy the previous code.

## 7. Test endpoints (mandatory before APK)

Replace `YOUR_RAILWAY_URL` with your generated domain (no trailing slash).

```bash
# Health
curl https://YOUR_RAILWAY_URL/health

# Expected: {"status":"ok","ok":true,...}

# Nearby restaurants
curl "https://YOUR_RAILWAY_URL/api/restaurants/nearby?lat=6.95&lng=126.22"

# Featured
curl https://YOUR_RAILWAY_URL/api/restaurants/featured

# Recommendations
curl "https://YOUR_RAILWAY_URL/api/restaurants/recommendations?lat=6.95&lng=126.22"
```

### Hard gate — do not build APK unless:

- [ ] `/health` returns `status: ok`
- [ ] `/api/restaurants/nearby` returns restaurants (or empty array without 500)
- [ ] Logs show Firebase connected, no crash loops
- [ ] No missing env variable errors

If any test fails → fix Railway variables or logs → redeploy → retest.

## 8. Update mobile app

Root `.env`:

```properties
EXPO_PUBLIC_API_URL=https://YOUR_RAILWAY_URL
```

Restart Expo:

```bash
npx expo start -c
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Confirm root directory is `backend` |
| Firebase init failed | Set `FIREBASE_CONFIG` to valid one-line JSON |
| Empty restaurants | Run `npm run seed` locally (same Firebase project) |
| 502 / timeout | Check deploy logs; confirm `PORT=3001` and Dockerfile `EXPOSE 3001` |
