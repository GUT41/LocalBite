/**
 * LOCALBITE — Auto-generate food items JSON with Unsplash images.
 *
 * Usage (from backend/):
 *   node seeds/generateFoodItems.js
 *
 * Requires UNSPLASH_ACCESS_KEY in backend/.env
 * Output: ../seed-data/foodItems.json
 */
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const UNSPLASH_BASE = 'https://api.unsplash.com/search/photos';
const FALLBACK_IMAGE = 'https://via.placeholder.com/400x300?text=LOCALBITE';
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'seed-data', 'foodItems.json');

/** In-memory cache: search query → image URL */
const imageCache = new Map();

/** Food catalog — 22 items across categories */
const FOOD_CATALOG = [
  { name: 'Chicken Burger', category: 'Burgers', searchQuery: 'burger' },
  { name: 'Beef Burger', category: 'Burgers', searchQuery: 'beef burger' },
  { name: 'French Fries', category: 'Sides', searchQuery: 'french fries' },
  { name: 'Fried Chicken', category: 'Fast Food', searchQuery: 'fried chicken' },
  { name: 'Pepperoni Pizza', category: 'Pizza', searchQuery: 'pizza' },
  { name: 'Hawaiian Pizza', category: 'Pizza', searchQuery: 'hawaiian pizza' },
  { name: 'Chicken Rice Meal', category: 'Rice Meals', searchQuery: 'chicken rice' },
  { name: 'Beef Rice Bowl', category: 'Rice Meals', searchQuery: 'beef rice bowl' },
  { name: 'Spaghetti', category: 'Noodles', searchQuery: 'spaghetti' },
  { name: 'Pancit Canton', category: 'Noodles', searchQuery: 'noodles' },
  { name: 'Milk Tea', category: 'Drinks', searchQuery: 'milk tea' },
  { name: 'Iced Coffee', category: 'Drinks', searchQuery: 'iced coffee' },
  { name: 'Donut', category: 'Desserts', searchQuery: 'donut' },
  { name: 'Ice Cream', category: 'Desserts', searchQuery: 'ice cream' },
  { name: 'Hotdog Sandwich', category: 'Street Food', searchQuery: 'hotdog' },
  { name: 'Shawarma', category: 'Street Food', searchQuery: 'shawarma' },
  { name: 'Sisig Rice', category: 'Rice Meals', searchQuery: 'filipino food' },
  { name: 'BBQ Skewers', category: 'Street Food', searchQuery: 'bbq skewers' },
  { name: 'Tacos', category: 'Street Food', searchQuery: 'tacos' },
  { name: 'Cheesecake', category: 'Desserts', searchQuery: 'cheesecake' },
  { name: 'Fish and Chips', category: 'Fast Food', searchQuery: 'fish and chips' },
  { name: 'Caesar Salad', category: 'Healthy', searchQuery: 'caesar salad' },
];

function getAccessKey() {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) {
    throw new Error('UNSPLASH_ACCESS_KEY is missing. Add it to backend/.env');
  }
  return key;
}

function randomPrice(min = 50, max = 250) {
  const steps = [5, 10];
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / 5) * 5;
}

function randomRating() {
  return Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
}

function slugId(name, index) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `food_${base}_${index}`;
}

/**
 * Fetches a food image from Unsplash (cached by query).
 * @param {string} query - Unsplash search term
 * @returns {Promise<string>} image URL
 */
async function fetchFoodImage(query) {
  const normalized = String(query || 'food').trim().toLowerCase();
  if (!normalized) return FALLBACK_IMAGE;

  if (imageCache.has(normalized)) {
    return imageCache.get(normalized);
  }

  const accessKey = getAccessKey();

  try {
    const { data } = await axios.get(UNSPLASH_BASE, {
      params: {
        query: normalized,
        per_page: 1,
        orientation: 'landscape',
        content_filter: 'high',
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      timeout: 15000,
    });

    const photo = data?.results?.[0];
    const url =
      photo?.urls?.regular ||
      photo?.urls?.small ||
      photo?.urls?.thumb ||
      null;

    const finalUrl = url || FALLBACK_IMAGE;
    imageCache.set(normalized, finalUrl);
    return finalUrl;
  } catch (err) {
    const message = err.response?.data?.errors?.[0] || err.message;
    console.warn(`[Unsplash] "${normalized}": ${message} — using fallback`);
    imageCache.set(normalized, FALLBACK_IMAGE);
    return FALLBACK_IMAGE;
  }
}

/** Small delay to respect Unsplash rate limits */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Builds 20+ food items with categories, prices, ratings, and images.
 */
async function generateFoodItems() {
  const items = [];
  const usedQueries = new Set();

  for (let i = 0; i < FOOD_CATALOG.length; i++) {
    const entry = FOOD_CATALOG[i];
    const query = entry.searchQuery;

    // Only log API fetch when query is new (cache handles duplicates)
    const isNewQuery = !imageCache.has(query.toLowerCase());
    if (isNewQuery && !usedQueries.has(query)) {
      usedQueries.add(query);
    }

    const imageUrl = await fetchFoodImage(query);

    items.push({
      id: slugId(entry.name, i + 1),
      name: entry.name,
      category: entry.category,
      price: randomPrice(),
      rating: randomRating(),
      imageUrl,
      createdAt: Date.now(),
    });

    // Brief pause between unique API calls
    if (isNewQuery) {
      await delay(200);
    }
  }

  return items;
}

/**
 * Writes dataset to seed-data/foodItems.json
 * @param {object[]} data
 */
function saveToJson(data) {
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    count: data.length,
    source: 'unsplash',
    items: data,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Saved ${data.length} items → ${OUTPUT_FILE}`);
}

async function main() {
  console.log('LOCALBITE — Generating food items with Unsplash images…');
  const items = await generateFoodItems();
  saveToJson(items);
  console.log(`Unique Unsplash queries cached: ${imageCache.size}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Generation failed:', err.message);
  process.exit(1);
});

module.exports = {
  generateFoodItems,
  fetchFoodImage,
  saveToJson,
  FOOD_CATALOG,
};
