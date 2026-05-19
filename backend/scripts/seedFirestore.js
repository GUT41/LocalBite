/**
 * Seeds sample restaurants + menus into Firestore.
 * Usage: set FIREBASE_CONFIG in backend/.env, then:
 *   node scripts/seedFirestore.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { initFirebase, getFirestore } = require('../config/firebase');

const RESTAURANTS = [
  {
    placeId: 'seed_lolas_eatery',
    name: "Lola's Eatery",
    description: 'Filipino comfort food',
    cuisine: ['Filipino', 'Fast Food'],
    rating: 4.5,
    priceLevel: 2,
    coordinates: { latitude: 6.9510513, longitude: 126.2195947 },
    imageUrl: 'https://via.placeholder.com/300',
    address: '123 Main Street, Mati City',
    featured: true,
    categories: ['restaurant', 'food'],
    popularity: 85,
    source: 'admin',
  },
  {
    placeId: 'seed_beach_grill',
    name: 'Mati Beach Grill',
    description: 'Fresh seafood by the bay',
    cuisine: ['Seafood', 'Grill'],
    rating: 4.7,
    priceLevel: 3,
    coordinates: { latitude: 6.9482, longitude: 126.2158 },
    imageUrl: 'https://via.placeholder.com/300',
    address: 'Baywalk, Mati City',
    featured: true,
    categories: ['restaurant', 'seafood'],
    popularity: 90,
    source: 'admin',
  },
  {
    placeId: 'seed_coffee_corner',
    name: 'Harbor Coffee Corner',
    description: 'Coffee and light bites',
    cuisine: ['Coffee', 'Cafe'],
    rating: 4.3,
    priceLevel: 1,
    coordinates: { latitude: 6.9535, longitude: 126.2212 },
    imageUrl: 'https://via.placeholder.com/300',
    address: 'Poblacion, Mati City',
    featured: false,
    categories: ['cafe', 'restaurant'],
    popularity: 70,
    source: 'admin',
  },
];

const MENUS = [
  { restaurantId: 'seed_lolas_eatery', itemName: 'Chicken Adobo', price: 125, category: 'Mains', imageUrl: 'https://via.placeholder.com/200', popularity: 90 },
  { restaurantId: 'seed_lolas_eatery', itemName: 'Pork Sinigang', price: 135, category: 'Mains', imageUrl: 'https://via.placeholder.com/200', popularity: 85 },
  { restaurantId: 'seed_beach_grill', itemName: 'Grilled Tuna Belly', price: 220, category: 'Seafood', imageUrl: 'https://via.placeholder.com/200', popularity: 95 },
  { restaurantId: 'seed_coffee_corner', itemName: 'Latte', price: 95, category: 'Drinks', imageUrl: 'https://via.placeholder.com/200', popularity: 80 },
];

async function main() {
  initFirebase();
  const db = getFirestore();
  if (!db) {
    console.error('FIREBASE_CONFIG missing in backend/.env — add service account JSON string.');
    process.exit(1);
  }

  const now = Date.now();
  const batch = db.batch();

  RESTAURANTS.forEach((r) => {
    const ref = db.collection('restaurants').doc(`gp_${r.placeId}`);
    batch.set(ref, { ...r, createdAt: now, cachedAt: now });
  });

  MENUS.forEach((m, i) => {
    const ref = db.collection('menus').doc(`${m.restaurantId}_menu_${i}`);
    batch.set(ref, { ...m, createdAt: now });
  });

  await batch.commit();
  console.log(`Seeded ${RESTAURANTS.length} restaurants and ${MENUS.length} menu items.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
