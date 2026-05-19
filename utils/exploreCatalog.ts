import { EXPLORE_DEFAULT_COORDS } from './constants';
import { hasNativeFirebase } from './nativeFirebase';

/** Explore list card shape (used by Explore, Favorites, Map). */
export type ExploreItem = {
  id: string;
  name: string;
  price: number;
  shop: string;
  category: string;
  lat: number;
  lng: number;
  image: { uri: string } | null;
  desc: string;
  source: 'firestore';
};

/** Raw restaurant document from Firestore `restaurants` collection. */
export type FirestoreRestaurant = {
  id: string;
  name: string;
  description?: string;
  cuisine?: string[];
  rating?: number;
  priceLevel?: number;
  coordinates?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
  imageUrl?: string;
  address?: string;
  featured?: boolean;
  [key: string]: unknown;
};

export type RestaurantMenuItem = {
  id: string;
  restaurantId?: string;
  name?: string;
  price?: number;
  [key: string]: unknown;
};

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Haversine distance between two coordinates (kilometers).
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getRestaurantCoords(r: FirestoreRestaurant): { lat: number; lng: number } | null {
  const c = r.coordinates;
  if (!c) return null;
  const lat = c.latitude ?? c.lat;
  const lng = c.longitude ?? c.lng;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

function priceFromLevel(priceLevel?: number): number {
  const level = typeof priceLevel === 'number' ? priceLevel : 2;
  return level * 80 + 49;
}

/** Maps a Firestore restaurant document to an Explore list item. */
export function mapRestaurantToExploreItem(
  r: FirestoreRestaurant,
  options?: { distanceKm?: number; featuredLabel?: boolean }
): ExploreItem {
  const coords = getRestaurantCoords(r) ?? EXPLORE_DEFAULT_COORDS;
  const rating = typeof r.rating === 'number' ? r.rating.toFixed(1) : '4.5';
  let desc = `★ ${rating}`;
  if (options?.distanceKm != null) {
    desc += ` · ${options.distanceKm.toFixed(1)} km`;
  }
  if (options?.featuredLabel) {
    desc += ' · Featured';
  }
  if (r.description && typeof r.description === 'string') {
    desc = `${r.description} · ${desc}`;
  }

  return {
    id: r.id,
    name: r.name || 'Restaurant',
    price: priceFromLevel(r.priceLevel),
    shop: r.name || 'Local Restaurant',
    category: Array.isArray(r.cuisine) && r.cuisine.length > 0 ? r.cuisine[0] : 'Restaurant',
    lat: coords.lat,
    lng: coords.lng,
    image: r.imageUrl ? { uri: r.imageUrl } : null,
    desc,
    source: 'firestore',
  };
}

async function loadRestaurantsCollection(): Promise<FirestoreRestaurant[]> {
  if (!hasNativeFirebase()) {
    return [];
  }
  try {
    const { restaurantsCollection } = await import('./firebase');
    const snap = await restaurantsCollection().get();
    return snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as object) } as FirestoreRestaurant))
      .filter((r) => Boolean(r.name && getRestaurantCoords(r)));
  } catch (error) {
    console.warn('[Explore] Failed to load restaurants:', error);
    return [];
  }
}

/**
 * Fetches nearby restaurants from Firestore, sorted by distance.
 */
export async function fetchFirestoreRestaurants(options?: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}): Promise<ExploreItem[]> {
  const lat = options?.lat ?? EXPLORE_DEFAULT_COORDS.lat;
  const lng = options?.lng ?? EXPLORE_DEFAULT_COORDS.lng;
  const radiusKm = options?.radiusKm ?? 15;
  const limit = options?.limit ?? 24;

  const restaurants = await loadRestaurantsCollection();
  const nearby = restaurants
    .map((r) => {
      const coords = getRestaurantCoords(r)!;
      const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
      return { r, distance };
    })
    .filter(({ distance }) => distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ r, distance }) => mapRestaurantToExploreItem(r, { distanceKm: distance }));

  console.log(`[Explore] Loaded ${nearby.length} nearby restaurants`);
  return nearby;
}

/**
 * Returns all explore items (wide radius) — used by Favorites to resolve saved IDs.
 */
export async function loadExploreProductList(): Promise<ExploreItem[]> {
  return fetchFirestoreRestaurants({ radiusKm: 500, limit: 500 });
}

/**
 * Menu items for a restaurant from Firestore `menus` collection.
 */
export async function fetchRestaurantMenuItems(restaurantId: string): Promise<RestaurantMenuItem[]> {
  if (!hasNativeFirebase() || !restaurantId) {
    return [];
  }
  try {
    const { menusCollection } = await import('./firebase');
    const snap = await menusCollection().where('restaurantId', '==', restaurantId).get();
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as object),
    }));
  } catch (error) {
    console.warn('[Explore] Failed to load menu items:', error);
    return [];
  }
}

/**
 * Search restaurants by name or cuisine (client-side filter).
 */
export async function searchRestaurants(
  keyword: string,
  options?: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    limit?: number;
  }
): Promise<ExploreItem[]> {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }

  const lat = options?.lat ?? EXPLORE_DEFAULT_COORDS.lat;
  const lng = options?.lng ?? EXPLORE_DEFAULT_COORDS.lng;
  const radiusKm = options?.radiusKm ?? 50;
  const limit = options?.limit ?? 48;
  const needle = trimmed.toLowerCase();

  const restaurants = await loadRestaurantsCollection();
  const results = restaurants
    .filter((r) => {
      const searchStr = `${r.name || ''} ${(r.cuisine || []).join(' ')} ${r.description || ''}`.toLowerCase();
      return searchStr.includes(needle);
    })
    .map((r) => {
      const coords = getRestaurantCoords(r)!;
      const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
      return { r, distance };
    })
    .filter(({ distance }) => distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ r, distance }) => mapRestaurantToExploreItem(r, { distanceKm: distance }));

  console.log(`[Explore] Search "${trimmed}" → ${results.length} results`);
  return results;
}

/**
 * Restaurants with `featured: true` in Firestore.
 */
export async function getFeaturedRestaurants(limitCount: number = 6): Promise<ExploreItem[]> {
  if (!hasNativeFirebase()) {
    return [];
  }
  try {
    const { restaurantsCollection } = await import('./firebase');
    const snap = await restaurantsCollection().where('featured', '==', true).get();
    const featured = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as object) } as FirestoreRestaurant))
      .filter((r) => r.name && getRestaurantCoords(r))
      .slice(0, limitCount)
      .map((r) => mapRestaurantToExploreItem(r, { featuredLabel: true }));

    console.log(`[Explore] Loaded ${featured.length} featured restaurants`);
    return featured;
  } catch (error) {
    console.warn('[Explore] Failed to load featured restaurants:', error);
    return [];
  }
}
