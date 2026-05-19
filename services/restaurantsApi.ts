/**
 * LocalBite backend client — never calls Google APIs directly.
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../utils/constants';
import type { Restaurant, RestaurantFilters, MenuItem } from '../types/restaurant.types';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/restaurants`,
  timeout: API_TIMEOUT,
  headers: { Accept: 'application/json' },
});

function handleError(label: string, error: unknown): never {
  let msg =
    axios.isAxiosError(error)
      ? error.response?.data?.error || error.message
      : error instanceof Error
        ? error.message
        : 'Request failed';
  if (msg === 'Network Error' || msg === 'Network request failed') {
    msg = `Cannot reach backend at ${API_BASE_URL}. Check EXPO_PUBLIC_API_URL in .env and rebuild if needed.`;
  }
  console.warn(`[RestaurantsAPI] ${label}:`, msg);
  throw new Error(msg);
}

export async function fetchNearbyRestaurants(
  lat: number,
  lng: number,
  options?: RestaurantFilters & { keyword?: string; radius?: number }
): Promise<Restaurant[]> {
  try {
    const { data } = await client.get('/nearby', {
      params: {
        lat,
        lng,
        radius: (options?.radiusKm ?? 8) * 1000,
        radiusKm: options?.radiusKm ?? 15,
        keyword: options?.keyword,
        maxprice: options?.maxPrice,
        opennow: options?.openNow ? 'true' : undefined,
        minRating: options?.minRating,
      },
    });
    return data.restaurants ?? [];
  } catch (e) {
    handleError('fetchNearbyRestaurants', e);
  }
}

export async function searchRestaurantsApi(
  lat: number,
  lng: number,
  query: string,
  filters?: RestaurantFilters
): Promise<Restaurant[]> {
  try {
    const { data } = await client.get('/search', {
      params: {
        lat,
        lng,
        q: query,
        minRating: filters?.minRating,
        maxprice: filters?.maxPrice,
        opennow: filters?.openNow ? 'true' : undefined,
      },
    });
    return data.restaurants ?? [];
  } catch (e) {
    handleError('searchRestaurantsApi', e);
  }
}

export async function fetchRestaurantDetails(
  placeId: string,
  lat?: number,
  lng?: number
): Promise<{ restaurant: Restaurant; menus: MenuItem[] }> {
  try {
    const { data } = await client.get(`/details/${placeId}`, {
      params: lat != null && lng != null ? { lat, lng } : {},
    });
    return { restaurant: data.restaurant, menus: data.menus ?? [] };
  } catch (e) {
    handleError('fetchRestaurantDetails', e);
  }
}

export async function fetchRecommendations(
  lat: number,
  lng: number,
  options?: {
    maxPrice?: number;
    cuisine?: string;
    favorites?: string[];
    openNow?: boolean;
    limit?: number;
  }
): Promise<Restaurant[]> {
  try {
    const { data } = await client.get('/recommendations', {
      params: {
        lat,
        lng,
        maxPrice: options?.maxPrice,
        cuisine: options?.cuisine,
        favorites: options?.favorites?.join(','),
        opennow: options?.openNow ? 'true' : undefined,
        limit: options?.limit ?? 12,
      },
    });
    return data.recommendations ?? [];
  } catch (e) {
    handleError('fetchRecommendations', e);
  }
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
