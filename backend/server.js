/**
 * LocalBite API — Firestore-only restaurant data (Firebase Spark / free tier).
 * Mobile app calls this backend only; no Google Places or Cloud billing required.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  initFirebase,
  isFirebaseConfigured,
  logFirebaseSetupHelp,
} = require('./firebase-config');
const restaurantsRouter = require('./routes/restaurants');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const firestoreDb = initFirebase();
if (!firestoreDb) {
  logFirebaseSetupHelp();
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    ok: true,
    service: 'localbite-api',
    firestoreConfigured: isFirebaseConfigured(),
    dataSource: 'firestore',
    environment: process.env.NODE_ENV || 'development',
    host: process.env.RAILWAY_PUBLIC_DOMAIN || null,
  });
});

app.use('/api/restaurants', restaurantsRouter);

app.use((err, _req, res, _next) => {
  console.error('[API]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  const publicUrl = process.env.API_PUBLIC_URL || `http://127.0.0.1:${PORT}`;
  console.log(`LocalBite API listening on port ${PORT}`);
  console.log(`  Local:    http://127.0.0.1:${PORT}`);
  console.log(`  LAN:      ${publicUrl}`);
  console.log(`  Health:   GET /health`);
  console.log(`  Nearby:   GET /api/restaurants/nearby?lat=6.95&lng=126.22`);
  console.log(`  Search:   GET /api/restaurants/search?q=chicken&lat=6.95&lng=126.22`);
  console.log(`  Featured: GET /api/restaurants/featured`);
});
