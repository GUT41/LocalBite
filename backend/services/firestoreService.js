/**
 * Firestore-only restaurant data — no Google Places / Cloud billing.
 */
const { getFirestore } = require('../firebase-config');
const { haversineKm } = require('../utils/distance');

const COLLECTION = 'restaurants';
const MENUS_COLLECTION = 'menus';

function docIdForPlaceId(placeId) {
  if (!placeId) return null;
  return placeId.startsWith('gp_') ? placeId : `gp_${placeId}`;
}

/** Normalize Firestore document → API restaurant shape. */
function normalizeRestaurant(doc, userLat, userLng) {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  const placeId = data.placeId || (id?.startsWith('gp_') ? id.slice(3) : id);

  const lat = data.coordinates?.latitude;
  const lng = data.coordinates?.longitude;

  let distanceKm = data.distanceKm ?? null;
  if (userLat != null && userLng != null && lat != null && lng != null) {
    distanceKm = haversineKm(userLat, userLng, lat, lng);
  }

  const photoUrl = data.photoUrl || data.imageUrl || null;
  const categories = data.categories || data.cuisine || ['restaurant'];

  return {
    placeId,
    id,
    name: data.name || 'Restaurant',
    address: data.address || data.location || '',
    rating: typeof data.rating === 'number' ? data.rating : 0,
    priceLevel: data.priceLevel ?? 2,
    coordinates: lat != null && lng != null ? { latitude: lat, longitude: lng } : data.coordinates,
    location: data.location || data.address || '',
    openNow: data.openNow ?? null,
    photos: data.photos || (photoUrl ? [photoUrl] : []),
    photoUrl,
    categories: Array.isArray(categories) ? categories : [categories],
    cuisine: data.cuisine,
    popularity: data.popularity ?? 0,
    userRatingsTotal: data.userRatingsTotal ?? 0,
    distanceKm,
    featured: Boolean(data.featured),
    phone: data.phone ?? null,
    website: data.website ?? null,
    reviews: data.reviews,
    description: data.description,
    source: data.source || 'firestore',
  };
}

async function loadAllRestaurants(userLat, userLng) {
  const db = getFirestore();
  if (!db) return [];
  const snap = await db.collection(COLLECTION).limit(200).get();
  return snap.docs.map((d) => normalizeRestaurant(d, userLat, userLng));
}

/** Nearby restaurants sorted by distance (Haversine). */
async function getRestaurantsFromFirestore(lat, lng, radiusKm = 15, limit = 24) {
  try {
    const restaurants = await loadAllRestaurants(lat, lng);
    return restaurants
      .filter((r) => {
        const km = r.distanceKm;
        return km != null && km <= radiusKm;
      })
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      .slice(0, limit);
  } catch (error) {
    console.error('[Firestore] getRestaurantsFromFirestore:', error.message);
    return [];
  }
}

/** Search by name, cuisine, categories, or address. */
async function searchRestaurantsInFirestore(keyword, lat, lng, limit = 40) {
  try {
    const q = String(keyword || '').trim().toLowerCase();
    if (!q) return [];

    const restaurants = await loadAllRestaurants(lat, lng);
    const results = restaurants
      .filter((r) => {
        const cuisine = Array.isArray(r.cuisine) ? r.cuisine.join(' ') : '';
        const cats = (r.categories || []).join(' ');
        const searchStr = `${r.name} ${cuisine} ${cats} ${r.address || ''}`.toLowerCase();
        return searchStr.includes(q);
      })
      .map((r) => {
        if (lat != null && lng != null && r.coordinates?.latitude != null) {
          r.distanceKm = haversineKm(lat, lng, r.coordinates.latitude, r.coordinates.longitude);
        }
        return r;
      })
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('[Firestore] searchRestaurantsInFirestore:', error.message);
    return [];
  }
}

/** Restaurants with featured: true. */
async function getFeaturedRestaurants(limit = 20) {
  try {
    const db = getFirestore();
    if (!db) return [];

    const snap = await db.collection(COLLECTION).where('featured', '==', true).limit(limit).get();
    if (!snap.empty) {
      return snap.docs.map((d) => normalizeRestaurant(d));
    }

    return (await loadAllRestaurants()).filter((r) => r.featured).slice(0, limit);
  } catch (error) {
    console.error('[Firestore] getFeaturedRestaurants:', error.message);
    return [];
  }
}

async function findRestaurantDoc(placeId) {
  const db = getFirestore();
  if (!db || !placeId) return null;

  const candidates = [docIdForPlaceId(placeId), placeId];
  for (const id of candidates) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (doc.exists) return doc;
  }

  const byField = await db.collection(COLLECTION).where('placeId', '==', placeId).limit(1).get();
  return byField.empty ? null : byField.docs[0];
}

/** Single restaurant by placeId or document id. */
async function getRestaurantDetails(restaurantId, userLat, userLng) {
  try {
    const doc = await findRestaurantDoc(restaurantId);
    if (!doc) return null;
    return normalizeRestaurant(doc, userLat, userLng);
  } catch (error) {
    console.error('[Firestore] getRestaurantDetails:', error.message);
    return null;
  }
}

/** Menu items for a restaurant. */
async function getRestaurantMenus(restaurantId) {
  try {
    const db = getFirestore();
    if (!db) return [];

    const placeId = restaurantId.startsWith('gp_') ? restaurantId.slice(3) : restaurantId;
    const ids = [restaurantId, placeId, docIdForPlaceId(placeId)];

    const seen = new Set();
    const menus = [];

    for (const id of ids) {
      const snap = await db.collection(MENUS_COLLECTION).where('restaurantId', '==', id).limit(50).get();
      snap.docs.forEach((d) => {
        if (seen.has(d.id)) return;
        seen.add(d.id);
        menus.push({ id: d.id, ...d.data() });
      });
    }

    return menus;
  } catch (error) {
    console.error('[Firestore] getRestaurantMenus:', error.message);
    return [];
  }
}

async function upsertManualRestaurant(data) {
  const db = getFirestore();
  if (!db) throw new Error('Firestore not configured');

  const placeId = data.placeId || `manual_${Date.now()}`;
  const ref = db.collection(COLLECTION).doc(docIdForPlaceId(placeId));
  const now = Date.now();

  const payload = {
    ...data,
    placeId,
    photoUrl: data.photoUrl || data.imageUrl || null,
    imageUrl: data.imageUrl || data.photoUrl || null,
    source: data.source || 'admin',
    updatedAt: now,
    createdAt: data.createdAt || now,
  };

  await ref.set(payload, { merge: true });
  return { id: ref.id, placeId };
}

function filterOpenNow(restaurants) {
  return restaurants.filter((r) => r.openNow === true);
}

function filterByMaxPrice(restaurants, maxPriceLevel) {
  const max = Number(maxPriceLevel);
  if (!Number.isFinite(max)) return restaurants;
  return restaurants.filter((r) => (r.priceLevel ?? 2) <= max);
}

function filterByMinRating(restaurants, minRating) {
  const min = Number(minRating);
  if (!Number.isFinite(min)) return restaurants;
  return restaurants.filter((r) => (r.rating || 0) >= min);
}

module.exports = {
  getRestaurantsFromFirestore,
  searchRestaurantsInFirestore,
  getFeaturedRestaurants,
  getRestaurantDetails,
  getRestaurantMenus,
  upsertManualRestaurant,
  filterOpenNow,
  filterByMaxPrice,
  filterByMinRating,
  normalizeRestaurant,
  docIdForPlaceId,
};
