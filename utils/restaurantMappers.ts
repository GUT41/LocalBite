import type { Restaurant } from '../types/restaurant.types';
import type { ExploreItem } from './exploreCatalog';

/** Maps backend/Google restaurant → legacy Explore card shape. */
export function restaurantToExploreItem(r: Restaurant): ExploreItem {
  const level = r.priceLevel ?? 2;
  return {
    id: r.placeId,
    name: r.name,
    price: level * 80 + 49,
    shop: r.name,
    category: r.categories?.[0] ?? 'Restaurant',
    lat: r.coordinates.latitude,
    lng: r.coordinates.longitude,
    image: r.photoUrl ? { uri: r.photoUrl } : null,
    desc: `★ ${(r.rating || 0).toFixed(1)}${r.distanceKm != null ? ` · ${r.distanceKm.toFixed(1)} km` : ''}`,
    source: 'firestore',
  };
}
