# LocalBite Deployment Guide

Full lifecycle for deploying the **backend API** to Railway and shipping the **Expo mobile app**.

## Architecture

```
Mobile App (Expo/APK)
        ↓ HTTPS
Railway (Node.js + Express)
        ↓ Admin SDK
Firebase Firestore (localbite-d8cc0)
```

- **No Google Places / Cloud billing** for restaurant data
- **Firestore** is the only data source for restaurants and menus
- Business logic and API routes live in `backend/` — not modified by deployment changes

---

## Phase 1 — Repository layout

| Path | Role |
|------|------|
| `backend/` | Express API, Dockerfile, `railway.toml` |
| `backend/firebase-config.js` | Firebase Admin (env-based on Railway) |
| `backend/services/firestoreService.js` | Firestore queries |
| `.github/` | No Fly.io workflows (removed) |
| Root `.env` | `EXPO_PUBLIC_API_URL` for mobile |

---

## Phase 2 — Push to deploy (Railway)

1. Commit deployment changes on `main`.
2. Push to GitHub: `GUT4I/LocalBite`.
3. Railway auto-builds from `backend/Dockerfile` when `backend/` changes.

Detailed Railway steps: **[backend/RAILWAY_DEPLOY.md](backend/RAILWAY_DEPLOY.md)**

### Railway project setup (summary)

1. [railway.app](https://railway.app) → GitHub login  
2. New Project → Deploy from GitHub → `GUT4I/LocalBite`  
3. **Root Directory:** `backend` ← **critical** (see troubleshooting below)  
4. Add variables (see below)  
5. Generate public domain  

### Troubleshooting: Railway deploying Expo instead of Express

If `curl https://YOUR_RAILWAY_URL/health` returns JSON containing `expoGo`, `sdkVersion`, or `index.bundle`, Railway is running the **Expo frontend** from the repo root, not the API.

**Fix:** Service → **Settings** → **Root Directory** → set to `backend` → **Redeploy**.

| Root Directory | Deploys |
|----------------|---------|
| `backend` | Express API ✅ |
| empty / `/` | Expo Metro ❌ (or root `Dockerfile` API fallback) |

**Pass:** `{"status":"ok","service":"localbite-api",...}`  
**Fail:** Expo manifest / Metro JSON → do not build APK until fixed.

---

## Phase 3 — Environment variable mapping

### Railway (backend service)

| Variable | Purpose |
|----------|---------|
| `FIREBASE_CONFIG` | Full Firebase service account JSON (required on Railway) |
| `JWT_SECRET` | Signs admin JWTs |
| `NODE_ENV` | `production` |
| `PORT` | `3001` (must match Dockerfile / server) |

### Local development (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to JSON key file (local only) |
| `JWT_SECRET` | Dev JWT secret |
| `API_PUBLIC_URL` | LAN URL for photo links (optional) |
| `PORT` | `3001` |

### Mobile app (root `.env`)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Backend base URL (no trailing slash) |
| `EXPO_PUBLIC_FIREBASE_*` | Client Firebase config (unchanged) |

**Examples:**

```properties
# Local phone (same Wi-Fi as PC)
EXPO_PUBLIC_API_URL=http://192.168.254.107:3001

# Production (after Railway deploy)
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
```

`EXPO_PUBLIC_API_URL` is baked in at **build time** for release APKs — set it before `eas build`.

---

## Phase 4 — Mandatory backend validation (hard gate)

Do **not** build an APK until every check passes.

```bash
export API=https://YOUR_RAILWAY_URL

curl -s "$API/health" | jq .
curl -s "$API/api/restaurants/nearby?lat=6.95&lng=126.22" | jq .
curl -s "$API/api/restaurants/featured" | jq .
```

**Pass criteria:**

- `/health` → `"status": "ok"`, `"firestoreConfigured": true`
- Nearby/featured return JSON (200), not 500
- Railway logs: Firebase ready, no crash loops, no missing env errors

**On failure:** stop → fix variables / logs → redeploy → retest. **No APK until green.**

---

## Phase 5 — Mobile app update

1. Set `EXPO_PUBLIC_API_URL=https://YOUR_RAILWAY_URL` in root `.env`
2. Restart Metro: `npx expo start -c`
3. Confirm log: `[LocalBite] API_BASE_URL: https://YOUR_RAILWAY_URL`
4. Confirm home screen loads restaurants

---

## Phase 6 — APK build (final step only)

After validation:

```bash
eas build -p android
```

Ensure `EXPO_PUBLIC_API_URL` points at Railway **before** starting the EAS build.

---

## Monitoring

- **Railway:** Deployments → Logs (errors, Firebase init, port)
- **Firebase:** Console → Firestore → `restaurants`, `menus` collections
- **Health:** `GET /health` on a schedule or manual curl

---

## Rollback

1. Railway → Deployments → redeploy last good build, **or**
2. `git revert` on `main` and push to trigger a previous version

---

## Success checklist

**Deployment**

- [ ] Fly.io config removed
- [ ] `backend/railway.toml` present
- [ ] GitHub push to `main`
- [ ] Railway auto-deploy green

**Backend validation**

- [ ] `/health` OK
- [ ] API endpoints OK
- [ ] Firebase connected in logs
- [ ] No crash loops

**Mobile**

- [ ] `EXPO_PUBLIC_API_URL` updated
- [ ] Expo restarted, app loads data

**Release**

- [ ] `eas build -p android` only after all above pass

---

## Core rule

**No validated backend → no APK build.**
