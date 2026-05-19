const firestore = require('../services/firestoreService');
const { requireLatLng } = require('../utils/validation');

const API_PUBLIC_URL = process.env.API_PUBLIC_URL || '';

function withAbsolutePhotoUrls(restaurants, req) {
  const base = API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return restaurants.map((r) => ({
    ...r,
    photoUrl: r.photoUrl?.startsWith('http') ? r.photoUrl : r.photoUrl ? `${base}${r.photoUrl}` : null,
    photos: (r.photos || []).map((p) =>
      typeof p === 'string' && p.startsWith('http') ? p : p?.startsWith?.('/') ? `${base}${p}` : p
    ),
  }));
}

async function nearby(req, res) {
  try {
    const { lat, lng } = requireLatLng(req.query);
    const radiusKm = Number(req.query.radiusKm) || 15;
    const limit = Number(req.query.limit) || 24;

    let restaurants = await firestore.getRestaurantsFromFirestore(lat, lng, radiusKm, limit);

    if (req.query.opennow === 'true') {
      restaurants = firestore.filterOpenNow(restaurants);
    }
    if (req.query.maxprice != null) {
      restaurants = firestore.filterByMaxPrice(restaurants, req.query.maxprice);
    }

    res.json({
      restaurants: withAbsolutePhotoUrls(restaurants, req),
      count: restaurants.length,
      source: restaurants.length ? 'firestore' : 'empty',
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid request' });
  }
}

async function search(req, res) {
  try {
    const { lat, lng } = requireLatLng(req.query);
    const q = String(req.query.q || req.query.keyword || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'q or keyword is required' });
    }

    let restaurants = await firestore.searchRestaurantsInFirestore(q, lat, lng);

    restaurants = firestore.filterByMinRating(restaurants, req.query.minRating);
    if (req.query.maxprice != null) {
      restaurants = firestore.filterByMaxPrice(restaurants, req.query.maxprice);
    }
    if (req.query.opennow === 'true') {
      restaurants = firestore.filterOpenNow(restaurants);
    }

    res.json({
      restaurants: withAbsolutePhotoUrls(restaurants, req),
      count: restaurants.length,
      source: 'firestore',
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Search failed' });
  }
}

async function featured(req, res) {
  try {
    const limit = Number(req.query.limit) || 20;
    const restaurants = await firestore.getFeaturedRestaurants(limit);
    res.json({
      restaurants: withAbsolutePhotoUrls(restaurants, req),
      count: restaurants.length,
      source: 'firestore',
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load featured restaurants' });
  }
}

async function details(req, res) {
  try {
    const placeId = req.params.placeId;
    if (!placeId) return res.status(400).json({ error: 'placeId required' });

    const lat = req.query.lat != null ? Number(req.query.lat) : null;
    const lng = req.query.lng != null ? Number(req.query.lng) : null;

    const restaurant = await firestore.getRestaurantDetails(placeId, lat, lng);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const menus = await firestore.getRestaurantMenus(placeId);
    const [mapped] = withAbsolutePhotoUrls([restaurant], req);
    res.json({ restaurant: mapped, menus });
  } catch (err) {
    res.status(502).json({ error: err.message || 'Failed to load details' });
  }
}

async function menus(req, res) {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId required' });

    const menuItems = await firestore.getRestaurantMenus(restaurantId);
    res.json({ menus: menuItems, count: menuItems.length });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to load menus' });
  }
}

async function createManual(req, res) {
  try {
    const result = await firestore.upsertManualRestaurant(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateMenu(req, res) {
  try {
    const { getFirestore } = require('../firebase-config');
    const db = getFirestore();
    if (!db) return res.status(503).json({ error: 'Firestore not configured' });
    const { restaurantId, items } = req.body;
    if (!restaurantId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'restaurantId and items[] required' });
    }
    const batch = db.batch();
    items.forEach((item, index) => {
      const id = item.id || `${restaurantId}_menu_${index}`;
      const ref = db.collection('menus').doc(id);
      batch.set(ref, { restaurantId, ...item, updatedAt: Date.now() }, { merge: true });
    });
    await batch.commit();
    res.json({ ok: true, count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { nearby, search, featured, details, menus, createManual, updateMenu };
