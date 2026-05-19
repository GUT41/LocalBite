import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchRestaurantDetails } from '../../services/restaurantsApi';
import { useUserLocation } from '../../hooks/useUserLocation';
import LoadingSpinner from '../../components/restaurants/LoadingSpinner';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';
import type { Restaurant, MenuItem } from '../../types/restaurant.types';
import { useAuth } from '../../contexts/AuthContext';
import {
  isRestaurantFavorited,
  saveRestaurantFavorite,
  removeRestaurantFavorite,
} from '../../utils/restaurantFavorites';

export default function RestaurantDetailsScreen({ route, navigation }: any) {
  const placeId = route.params?.placeId as string;
  const { coords } = useUserLocation();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);

  const load = useCallback(async () => {
    if (!placeId) {
      setError('Invalid restaurant');
      setLoading(false);
      return;
    }
    try {
      const { restaurant: r, menus: m } = await fetchRestaurantDetails(
        placeId,
        coords.lat,
        coords.lng
      );
      setRestaurant(r);
      setMenus(m);
      if (user?.uid) {
        setFavorited(await isRestaurantFavorited(user.uid, placeId));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [placeId, coords.lat, coords.lng, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const toggleFavorite = async () => {
    if (!restaurant || !user?.uid) return;
    const fav = {
      placeId: restaurant.placeId,
      name: restaurant.name,
      photoUrl: restaurant.photoUrl,
      address: restaurant.address,
      rating: restaurant.rating,
      savedAt: Date.now(),
    };
    if (favorited) {
      await removeRestaurantFavorite(user.uid, restaurant.placeId);
      setFavorited(false);
    } else {
      await saveRestaurantFavorite(user.uid, fav);
      setFavorited(true);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading restaurant…" />;
  if (error || !restaurant) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openMaps = () => {
    const { latitude, longitude } = restaurant.coordinates;
    void Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    );
  };

  return (
    <ScrollView style={styles.container}>
      {restaurant.photoUrl ? (
        <Image source={{ uri: restaurant.photoUrl }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Ionicons name="restaurant" size={48} color={RESTAURANT_THEME.textMuted} />
        </View>
      )}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.favBtn} onPress={toggleFavorite}>
        <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={26} color={favorited ? '#FF4B4B' : '#fff'} />
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.rating}>{restaurant.rating.toFixed(1)}</Text>
          {restaurant.distanceKm != null ? (
            <Text style={styles.meta}> · {restaurant.distanceKm.toFixed(1)} km</Text>
          ) : null}
          {restaurant.openNow === true ? (
            <Text style={styles.open}> · Open</Text>
          ) : restaurant.openNow === false ? (
            <Text style={styles.closed}> · Closed</Text>
          ) : null}
        </View>
        <Text style={styles.address}>{restaurant.address}</Text>

        <TouchableOpacity style={styles.directionsBtn} onPress={openMaps}>
          <Text style={styles.directionsText}>Get directions</Text>
        </TouchableOpacity>

        {restaurant.reviews && restaurant.reviews.length > 0 ? (
          <>
            <Text style={styles.section}>Reviews</Text>
            {restaurant.reviews.map((rev, i) => (
              <View key={i} style={styles.review}>
                <Text style={styles.reviewAuthor}>{rev.author} · ★ {rev.rating}</Text>
                <Text style={styles.reviewText} numberOfLines={3}>
                  {rev.text}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.section}>Menu</Text>
        {menus.length === 0 ? (
          <Text style={styles.muted}>No menu items yet. Admins can add items in the dashboard.</Text>
        ) : (
          menus.map((item) => (
            <View key={item.id || item.itemName} style={styles.menuRow}>
              <Text style={styles.menuName}>{item.itemName}</Text>
              <Text style={styles.menuPrice}>₱{item.price}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RESTAURANT_THEME.background },
  hero: { width: '100%', height: 260 },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: RESTAURANT_THEME.border },
  backBtn: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 22, padding: 8 },
  favBtn: { position: 'absolute', top: 48, right: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 22, padding: 8 },
  body: { backgroundColor: RESTAURANT_THEME.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 24 },
  name: { fontSize: 26, fontWeight: '800', color: RESTAURANT_THEME.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rating: { fontWeight: '700', marginLeft: 4 },
  meta: { color: RESTAURANT_THEME.textMuted },
  open: { color: RESTAURANT_THEME.accent, fontWeight: '600' },
  closed: { color: RESTAURANT_THEME.danger },
  address: { marginTop: 10, color: RESTAURANT_THEME.textMuted, lineHeight: 20 },
  directionsBtn: {
    marginTop: 16,
    backgroundColor: RESTAURANT_THEME.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  directionsText: { color: '#fff', fontWeight: '700' },
  section: { fontSize: 20, fontWeight: '800', marginTop: 24, marginBottom: 10 },
  review: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: RESTAURANT_THEME.border },
  reviewAuthor: { fontWeight: '600', fontSize: 13 },
  reviewText: { color: RESTAURANT_THEME.textMuted, marginTop: 4, lineHeight: 20 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  menuName: { fontWeight: '600', flex: 1 },
  menuPrice: { color: RESTAURANT_THEME.accent, fontWeight: '700' },
  muted: { color: RESTAURANT_THEME.textMuted },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: RESTAURANT_THEME.danger },
  backLink: { color: RESTAURANT_THEME.primary, marginTop: 12, fontWeight: '600' },
});
