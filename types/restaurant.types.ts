export type RestaurantCoordinates = {
  latitude: number;
  longitude: number;
};

export type RestaurantReview = {
  author: string;
  rating: number;
  text: string;
  time?: string;
};

export type Restaurant = {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  priceLevel: number;
  coordinates: RestaurantCoordinates;
  location?: string;
  openNow?: boolean | null;
  photos?: string[];
  photoUrl?: string | null;
  categories?: string[];
  popularity?: number;
  userRatingsTotal?: number;
  distanceKm?: number;
  featured?: boolean;
  recommendationScore?: number;
  phone?: string | null;
  website?: string | null;
  reviews?: RestaurantReview[];
  source?: string;
};

export type MenuItem = {
  id?: string;
  restaurantId: string;
  itemName: string;
  price: number;
  category?: string;
  imageUrl?: string;
  popularity?: number;
};

export type RestaurantFilters = {
  minRating?: number;
  maxPrice?: number;
  openNow?: boolean;
  radiusKm?: number;
};

export type SavedRestaurantFavorite = {
  placeId: string;
  name: string;
  photoUrl?: string | null;
  address?: string;
  rating?: number;
  savedAt: number;
};
