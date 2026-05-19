import AsyncStorage from '@react-native-async-storage/async-storage';

export const DB_KEYS = {
  USER_PROFILE: 'user_profile',
  ADMIN_PRODUCTS: 'admin_products',
  FAVORITES: 'user_favorites',
  admin_users: 'admin_users',
  admin_vendors: 'admin_vendors',
  admin_reviews: 'admin_reviews',
  admin_session: 'admin_session'
};

export const saveData = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Save Error", e);
  }
};

export const getData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value != null ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
};

export const seedAdminData = async () => {
  try {
    const existingVendors = await getData(DB_KEYS.admin_vendors);
    if (existingVendors) return;

    // No demo users — admin Users list comes from Firestore `users` after real sign-up.
    await saveData(DB_KEYS.admin_users, []);

    // Seed vendors
    const vendors = [
      { id: 'v1', name: 'Aling Nena\'s Carinderia', type: 'restaurant', status: 'active',    subscriptionTier: 'pro',     location: 'Poblacion, Davao City',    operatingHours: '7:00 AM - 8:00 PM',  ownerId: 'u1', registeredDate: '2024-01-20' },
      { id: 'v2', name: 'Kuya Ben BBQ',             type: 'stall',      status: 'pending',   subscriptionTier: 'basic',   location: 'Bangkal, Davao City',      operatingHours: '5:00 PM - 12:00 AM', ownerId: 'u2', registeredDate: '2024-02-25' },
      { id: 'v3', name: 'Jollibee-style Burger',    type: 'fastfood',   status: 'active',    subscriptionTier: 'premium', location: 'Buhangin, Davao City',     operatingHours: '8:00 AM - 10:00 PM', ownerId: 'u4', registeredDate: '2024-04-10' },
      { id: 'v4', name: 'Mang Tomas Lutong Bahay',  type: 'restaurant', status: 'pending',   subscriptionTier: 'basic',   location: 'Toril, Davao City',        operatingHours: '6:00 AM - 3:00 PM',  ownerId: 'u5', registeredDate: '2024-05-25' },
      { id: 'v5', name: 'Street Taho Vendor',       type: 'stall',      status: 'suspended', subscriptionTier: 'basic',   location: 'Agdao, Davao City',        operatingHours: '5:00 AM - 9:00 AM',  ownerId: 'u3', registeredDate: '2024-03-15' },
      { id: 'v6', name: 'Crispy Pata House',        type: 'restaurant', status: 'active',    subscriptionTier: 'pro',     location: 'Matina, Davao City',       operatingHours: '10:00 AM - 9:00 PM', ownerId: 'u4', registeredDate: '2024-04-05' }
    ];

    // Seed products
    const products = [
      { id: 'p1', vendorId: 'v1', vendorName: 'Aling Nena\'s Carinderia', name: 'Sinigang na Baboy',  price: 85,  category: 'Soup',       dietaryTags: [],           isFlagged: false },
      { id: 'p2', vendorId: 'v1', vendorName: 'Aling Nena\'s Carinderia', name: 'Adobong Manok',      price: 75,  category: 'Rice Meal',  dietaryTags: [],           isFlagged: false },
      { id: 'p3', vendorId: 'v2', vendorName: 'Kuya Ben BBQ',             name: 'Pork Barbecue',      price: 35,  category: 'Grilled',    dietaryTags: [],           isFlagged: true  },
      { id: 'p4', vendorId: 'v3', vendorName: 'Jollibee-style Burger',    name: 'Cheese Burger',      price: 59,  category: 'Fast Food',  dietaryTags: [],           isFlagged: false },
      { id: 'p5', vendorId: 'v3', vendorName: 'Jollibee-style Burger',    name: 'Chicken Joy',        price: 89,  category: 'Fast Food',  dietaryTags: [],           isFlagged: false },
      { id: 'p6', vendorId: 'v4', vendorName: 'Mang Tomas Lutong Bahay',  name: 'Tinolang Manok',     price: 70,  category: 'Soup',       dietaryTags: ['halal'],    isFlagged: false },
      { id: 'p7', vendorId: 'v6', vendorName: 'Crispy Pata House',        name: 'Crispy Pata',        price: 450, category: 'Pork',       dietaryTags: [],           isFlagged: false },
      { id: 'p8', vendorId: 'v6', vendorName: 'Crispy Pata House',        name: 'Kare-Kare',          price: 180, category: 'Stew',       dietaryTags: ['halal'],    isFlagged: true  }
    ];

    await saveData(DB_KEYS.admin_vendors, vendors);
    await saveData(DB_KEYS.ADMIN_PRODUCTS, products);
  } catch (error) {
    console.error('Error seeding admin data:', error);
  }
};

const MIGRATION_CLEAR_DEMO_USERS = 'migration_clear_demo_users_v1';

/** Removes legacy seeded demo users from AsyncStorage (users now come from Firestore). */
export async function migrateClearDemoUsers(): Promise<void> {
  try {
    const done = await getData(MIGRATION_CLEAR_DEMO_USERS);
    if (done) return;
    await saveData(DB_KEYS.admin_users, []);
    await saveData(MIGRATION_CLEAR_DEMO_USERS, true);
  } catch (e) {
    console.warn('migrateClearDemoUsers', e);
  }
}