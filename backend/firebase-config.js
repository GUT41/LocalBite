/**
 * Firebase Admin initialization — Spark plan / Firestore only (no Google Cloud billing).
 * Supports:
 *   - FIREBASE_SERVICE_ACCOUNT_PATH (recommended) — path to downloaded JSON key file
 *   - FIREBASE_CONFIG — single-line JSON string
 *   - FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

let db = null;

function loadServiceAccountFromFile() {
  const configured = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const candidates = configured
    ? [configured]
    : [];

  if (!configured) {
    const backendDir = path.join(__dirname);
    try {
      const matches = fs
        .readdirSync(backendDir)
        .filter((f) => f.includes('firebase-adminsdk') && f.endsWith('.json'));
      candidates.push(...matches.map((f) => path.join(backendDir, f)));
    } catch {
      /* ignore */
    }
  }

  for (const candidate of candidates) {
    const filePath = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(__dirname, candidate);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  }
  return null;
}

function buildServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) return null;

  return {
    type: process.env.FIREBASE_TYPE || 'service_account',
    project_id: projectId,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: clientEmail,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CERT_URL,
  };
}

function getServiceAccount() {
  const fromFile = loadServiceAccountFromFile();
  if (fromFile) return fromFile;

  const raw = process.env.FIREBASE_CONFIG;
  if (raw?.trim()) {
    return JSON.parse(raw);
  }
  return buildServiceAccountFromEnv();
}

function initFirebase() {
  if (db) return db;

  let serviceAccount;
  try {
    serviceAccount = getServiceAccount();
  } catch (err) {
    console.error('[Firebase] Invalid FIREBASE_CONFIG JSON:', err.message);
    return null;
  }

  if (!serviceAccount?.project_id && !serviceAccount?.projectId) {
    console.warn(
      '[Firebase] Not configured — set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_CONFIG, or FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL'
    );
    return null;
  }

  try {
    if (!admin.apps.length) {
      const projectId =
        serviceAccount.project_id ||
        serviceAccount.projectId ||
        process.env.FIREBASE_PROJECT_ID ||
        'localbite-d8cc0';
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
    }
    db = admin.firestore();
    const pid = admin.app().options.projectId || 'localbite-d8cc0';
    console.log(`[Firebase] Firestore ready (project: ${pid})`);
    return db;
  } catch (err) {
    console.error('[Firebase] Init failed:', err.message);
    return null;
  }
}

function getFirestore() {
  return db || initFirebase();
}

function isFirebaseConfigured() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) {
    const p = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(p)) return true;
  }
  if (loadServiceAccountFromFile()) return true;
  if (process.env.FIREBASE_CONFIG?.trim()) return true;
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
  );
}

function getAuth() {
  if (!admin.apps.length) initFirebase();
  return admin.apps.length ? admin.auth() : null;
}

module.exports = {
  initFirebase,
  getFirestore,
  getAuth,
  isFirebaseConfigured,
  admin,
};
