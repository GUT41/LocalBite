/**
 * Weighted recommendation score:
 * (0.4 × Rating) + (0.3 × Popularity) + (0.2 × DistanceScore) + (0.1 × BudgetMatch)
 */
const { distanceScore } = require('../utils/distance');

function normalizeRating(rating) {
  return Math.min(1, Math.max(0, (rating || 0) / 5));
}

function normalizePopularity(popularity) {
  return Math.min(1, Math.max(0, (popularity || 0) / 100));
}

function budgetMatch(priceLevel, preferredMaxPrice) {
  if (preferredMaxPrice == null) return 0.7;
  const p = priceLevel ?? 2;
  if (p <= preferredMaxPrice) return 1;
  return Math.max(0, 1 - (p - preferredMaxPrice) * 0.25);
}

function computeRecommendationScore(restaurant, options = {}) {
  const {
    preferredMaxPrice = 4,
    maxDistanceKm = 15,
    cuisineKeywords = [],
    favoritePlaceIds = [],
    preferOpenNow = false,
  } = options;

  const ratingN = normalizeRating(restaurant.rating);
  const popN = normalizePopularity(restaurant.popularity);
  const distN = distanceScore(restaurant.distanceKm ?? 5, maxDistanceKm);
  const budgetN = budgetMatch(restaurant.priceLevel, preferredMaxPrice);

  let score =
    0.4 * ratingN + 0.3 * popN + 0.2 * distN + 0.1 * budgetN;

  if (favoritePlaceIds.includes(restaurant.placeId)) score += 0.15;
  if (preferOpenNow && restaurant.openNow) score += 0.1;

  if (cuisineKeywords.length > 0) {
    const cats = (restaurant.categories || []).join(' ').toLowerCase();
    const cuisine = Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(' ').toLowerCase() : '';
    const name = (restaurant.name || '').toLowerCase();
    const match = cuisineKeywords.some(
      (k) => cats.includes(k) || cuisine.includes(k) || name.includes(k)
    );
    if (match) score += 0.1;
  }

  return Math.round(score * 1000) / 1000;
}

function getRecommendedRestaurants(restaurants, options = {}) {
  const limit = options.limit ?? 12;
  return [...restaurants]
    .map((r) => ({
      ...r,
      recommendationScore: computeRecommendationScore(r, options),
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);
}

module.exports = {
  computeRecommendationScore,
  getRecommendedRestaurants,
};
