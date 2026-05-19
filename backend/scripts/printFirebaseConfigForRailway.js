/**
 * Prints FIREBASE_CONFIG as one line for Railway Variables.
 * Usage (from backend/):
 *   node scripts/printFirebaseConfigForRailway.js
 *   node scripts/printFirebaseConfigForRailway.js ./localbite-d8cc0-firebase-adminsdk-xxxxx.json
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const configured = process.argv[2] || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
let filePath = configured
  ? path.resolve(__dirname, '..', configured)
  : null;

if (!filePath || !fs.existsSync(filePath)) {
  const dir = path.join(__dirname, '..');
  const match = fs.readdirSync(dir).find((f) => f.includes('firebase-adminsdk') && f.endsWith('.json'));
  if (match) filePath = path.join(dir, match);
}

if (!filePath || !fs.existsSync(filePath)) {
  console.error('No service account JSON found. Pass path or set FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const oneLine = JSON.stringify(json);

console.log('\n--- Copy into Railway → Variables → FIREBASE_CONFIG (use Raw value) ---\n');
console.log(oneLine);
console.log('\n--- Also set: JWT_SECRET, NODE_ENV=production, PORT=3001 ---\n');
