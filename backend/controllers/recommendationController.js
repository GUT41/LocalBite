const firestore = require('../services/firestoreService');
const { getRecommendedRestaurants } = require('../services/recommendationService');
const { requireLatLng } = require('../utils/validation');

const API_PUBLIC_URL = process.env.API_PUBLIC_URL || '';

function withAbsolutePhotoUrls(restaurants, req) {
  const base = API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return restaurants.map((r) => ({
    ...r,
    photoUrl: r.photoUrl?.startsWith('http') ? r.photoUrl : r.photoUrl ? `${base}${r.photoUrl}` : null,
  }));
}

async function recommendations(req, res) {
  try {
    const { lat, lng } = requireLatLng(req.query);
    const preferredMaxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : 4;
    const cuisine = req.query.cuisine ? String(req.query.cuisine).split(',').map((s) => s.trim().toLowerCase()) : [];
    const favoritePlaceIds = req.query.favorites ? String(req.query.favorites).split(',') : [];
    const preferOpenNow = req.query.opennow === 'true';
    const radiusKm = Number(req.query.radiusKm) || 15;

    const restaurants = await firestore.getRestaurantsFromFirestore(lat, lng, radiusKm, 50);

    const recommended = getRecommendedRestaurants(restaurants, {
      limit: Number(req.query.limit) || 12,
      preferredMaxPrice,
      cuisineKeywords: cuisine,
      favoritePlaceIds,
      preferOpenNow,
      maxDistanceKm: radiusKm,
    });

    res.json({
      recommendations: withAbsolutePhotoUrls(recommended, req),
      count: recommended.length,
      source: 'firestore',
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Recommendations failed' });
  }
}

module.exports = { recommendations };
