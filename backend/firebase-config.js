/**
 * Firebase Admin — Spark plan / Firestore only.
 *
 * Local dev:  FIREBASE_SERVICE_ACCOUNT_PATH=./your-adminsdk.json
 * Railway:    FIREBASE_CONFIG=<full service account JSON>  (required — file path does not work in Docker)
 * Or:         FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

let db = null;

function isRailway() {
  return Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_ID
  );
}

function parseJsonEnv(raw) {
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }
  return JSON.parse(s);
}

function loadServiceAccountFromFile() {
  const configured = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const candidates = configured ? [configured] : [];

  if (!configured) {
    try {
      const matches = fs
        .readdirSync(__dirname)
        .filter((f) => f.includes('firebase-adminsdk') && f.endsWith('.json'));
      candidates.push(...matches.map((f) => path.join(__dirname, f)));
    } catch {
      /* ignore */
    }
  }

  for (const candidate of candidates) {
    const filePath = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(__dirname, candidate);
    if (!fs.existsSync(filePath)) continue;
    return parseJsonEnv(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

function loadServiceAccountFromConfigEnv() {
  const sources = [
    process.env.FIREBASE_CONFIG,
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  ];

  for (const raw of sources) {
    if (!raw?.trim()) continue;
    try {
      return parseJsonEnv(raw);
    } catch (err) {
      throw new Error(`Invalid Firebase JSON env: ${err.message}`);
    }
  }

  if (process.env.FIREBASE_CONFIG_BASE64?.trim()) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_CONFIG_BASE64.trim(), 'base64').toString(
        'utf8'
      );
      return parseJsonEnv(decoded);
    } catch (err) {
      throw new Error(`Invalid FIREBASE_CONFIG_BASE64: ${err.message}`);
    }
  }

  return null;
}

function buildServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();

  if (!projectId || !privateKey || !clientEmail) return null;

  privateKey = privateKey.replace(/\\n/g, '\n');
  if (!privateKey.includes('\n') && privateKey.includes('BEGIN PRIVATE KEY')) {
    privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n');
    privateKey = privateKey.replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
  }

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

  const fromJson = loadServiceAccountFromConfigEnv();
  if (fromJson) return fromJson;

  return buildServiceAccountFromEnv();
}

function getFirebaseEnvStatus() {
  const pathVar = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const pathResolved = pathVar
    ? path.resolve(__dirname, pathVar)
    : null;
  const pathExists = pathResolved ? fs.existsSync(pathResolved) : false;

  return {
    railway: isRailway(),
    filePathSet: Boolean(pathVar),
    filePathExists: pathExists,
    firebaseConfigSet: Boolean(process.env.FIREBASE_CONFIG?.trim()),
    firebaseJsonAliasSet: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()),
    individualVarsSet: Boolean(
      process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_CLIENT_EMAIL
    ),
  };
}

function logFirebaseSetupHelp() {
  const s = getFirebaseEnvStatus();
  console.error('[Firebase] Not configured — Firestore API will return empty data.');
  console.error('[Firebase] Railway / production: add variable FIREBASE_CONFIG (full service account JSON).');
  console.error('[Firebase] Do NOT use FIREBASE_SERVICE_ACCOUNT_PATH on Railway — the JSON file is not in the Docker image.');

  if (s.filePathSet && !s.filePathExists) {
    console.error(
      `[Firebase] FIREBASE_SERVICE_ACCOUNT_PATH is set but file is missing${s.railway ? ' (expected on Railway)' : ''}.`
    );
  }

  if (s.railway) {
    console.error('[Firebase] Railway → Service → Variables → New variable:');
    console.error('[Firebase]   Name:  FIREBASE_CONFIG');
    console.error('[Firebase]   Value: paste entire *-firebase-adminsdk-*.json (use Raw editor)');
    console.error('[Firebase] Also set: JWT_SECRET, NODE_ENV=production, PORT=3001');
    console.error('[Firebase] Local helper: node scripts/printFirebaseConfigForRailway.js');
  } else {
    console.error('[Firebase] Local: set FIREBASE_SERVICE_ACCOUNT_PATH=./your-adminsdk.json in backend/.env');
  }
}

function initFirebase() {
  if (db) return db;

  let serviceAccount;
  try {
    serviceAccount = getServiceAccount();
  } catch (err) {
    console.error('[Firebase] Credential parse error:', err.message);
    logFirebaseSetupHelp();
    return null;
  }

  if (!serviceAccount?.project_id && !serviceAccount?.projectId) {
    logFirebaseSetupHelp();
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
  try {
    return Boolean(getServiceAccount());
  } catch {
    return false;
  }
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
  getFirebaseEnvStatus,
  logFirebaseSetupHelp,
  admin,
};
