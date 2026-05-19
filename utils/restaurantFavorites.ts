import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasNativeFirebase } from './nativeFirebase';
import type { SavedRestaurantFavorite } from '../types/restaurant.types';

const KEY_PREFIX = 'restaurant_favorites_';

async function readLocal(userId: string): Promise<SavedRestaurantFavorite[]> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeLocal(userId: string, list: SavedRestaurantFavorite[]) {
  await AsyncStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(list.slice(0, 50)));
}

export async function getRestaurantFavorites(userId: string): Promise<SavedRestaurantFavorite[]> {
  if (!userId) return [];
  if (hasNativeFirebase()) {
    try {
      const { firestore } = await import('./firebase');
      const snap = await firestore()
        .collection('favorites')
        .where('userId', '==', userId)
        .where('type', '==', 'restaurant')
        .limit(50)
        .get();
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          placeId: data.placeId || data.mealId,
          name: data.name || data.mealName,
          photoUrl: data.photoUrl || data.mealThumb,
          address: data.address,
          rating: data.rating,
          savedAt: data.savedAt ?? 0,
        } as SavedRestaurantFavorite;
      });
    } catch {
      // fallback
    }
  }
  return readLocal(userId);
}

export async function saveRestaurantFavorite(
  userId: string,
  fav: SavedRestaurantFavorite
): Promise<void> {
  if (!userId) return;
  const record = { ...fav, savedAt: Date.now() };

  if (hasNativeFirebase()) {
    try {
      const { firestore } = await import('./firebase');
      await firestore()
        .collection('favorites')
        .doc(`${userId}_${fav.placeId}`)
        .set({
          userId,
          type: 'restaurant',
          placeId: fav.placeId,
          name: fav.name,
          photoUrl: fav.photoUrl,
          address: fav.address,
          rating: fav.rating,
          savedAt: record.savedAt,
        });
      return;
    } catch {
      // fallback
    }
  }

  const list = await readLocal(userId);
  await writeLocal(
    userId,
    [record, ...list.filter((f) => f.placeId !== fav.placeId)]
  );
}

export async function removeRestaurantFavorite(userId: string, placeId: string): Promise<void> {
  if (!userId) return;
  if (hasNativeFirebase()) {
    try {
      const { firestore } = await import('./firebase');
      await firestore().collection('favorites').doc(`${userId}_${placeId}`).delete();
      return;
    } catch {
      // fallback
    }
  }
  const list = await readLocal(userId);
  await writeLocal(
    userId,
    list.filter((f) => f.placeId !== placeId)
  );
}

export async function isRestaurantFavorited(userId: string, placeId: string): Promise<boolean> {
  const list = await getRestaurantFavorites(userId);
  return list.some((f) => f.placeId === placeId);
}
