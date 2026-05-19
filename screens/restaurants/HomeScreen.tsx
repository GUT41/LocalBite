import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUserLocation } from '../../hooks/useUserLocation';
import {
  fetchNearbyRestaurants,
  fetchRecommendations,
} from '../../services/restaurantsApi';
import SearchBar from '../../components/restaurants/SearchBar';
import RestaurantCard from '../../components/restaurants/RestaurantCard';
import { CategoryChip, FOOD_CATEGORIES } from '../../components/restaurants/CategoryChip';
import LoadingSpinner from '../../components/restaurants/LoadingSpinner';
import EmptyState from '../../components/restaurants/EmptyState';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';
import type { Restaurant } from '../../types/restaurant.types';
import { getRestaurantFavorites } from '../../utils/restaurantFavorites';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/constants';

export default function HomeScreen({ navigation }: any) {
  const { coords, loading: locLoading } = useUserLocation();
  const { user } = useAuth();
  const [nearby, setNearby] = useState<Restaurant[]>([]);
  const [recommended, setRecommended] = useState<Restaurant[]>([]);
  const [trending, setTrending] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const favs = user?.uid ? await getRestaurantFavorites(user.uid) : [];
      const favIds = favs.map((f) => f.placeId);
      const [near, recs] = await Promise.all([
        fetchNearbyRestaurants(coords.lat, coords.lng, { radiusKm: 10 }),
        fetchRecommendations(coords.lat, coords.lng, {
          favorites: favIds,
          limit: 8,
        }),
      ]);
      setNearby(near);
      setRecommended(recs);
      setTrending([...near].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, 8));
      console.log(`[Home] Loaded ${near.length} nearby, ${recs.length} recommended`);
    } catch (e) {
      const base = e instanceof Error ? e.message : 'Failed to load restaurants.';
      setError(`${base}\n(API: ${API_BASE_URL})`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords.lat, coords.lng, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (!locLoading) {
        setLoading(true);
        void load();
      }
    }, [load, locLoading])
  );

  if (loading || locLoading) {
    return <LoadingSpinner message="Finding restaurants near you…" fullScreen />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={RESTAURANT_THEME.primary}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>LocalBite</Text>
          <Text style={styles.title}>Restaurants near you</Text>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={() => navigation.navigate('Search', { initialQuery: searchQuery })}
          />
        </View>

        <TouchableOpacity
          style={styles.mapPreview}
          onPress={() => navigation.getParent()?.navigate('Map', { restaurants: nearby })}
        >
          <Text style={styles.mapPreviewText}>🗺 View on map ({nearby.length} places)</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.section}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {FOOD_CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              onPress={() => navigation.navigate('Search', { initialQuery: c })}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Recommended</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Recommendations')}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>
        {recommended.length === 0 ? (
          <EmptyState title="No recommendations" message="Try searching or pull to refresh." />
        ) : (
          <FlatList
            horizontal
            data={recommended}
            keyExtractor={(item) => item.placeId}
            renderItem={({ item }) => (
              <RestaurantCard
                horizontal
                restaurant={item}
                onPress={() => navigation.navigate('RestaurantDetails', { placeId: item.placeId })}
              />
            )}
            contentContainerStyle={styles.hList}
            scrollEnabled={false}
          />
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Trending</Text>
          <TouchableOpacity onPress={() => navigation.navigate('NearbyRestaurants')}>
            <Text style={styles.link}>Nearby</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={trending}
          keyExtractor={(item) => `t-${item.placeId}`}
          renderItem={({ item }) => (
            <RestaurantCard
              horizontal
              restaurant={item}
              onPress={() => navigation.navigate('RestaurantDetails', { placeId: item.placeId })}
            />
          )}
          contentContainerStyle={styles.hList}
          scrollEnabled={false}
        />

        <Text style={styles.section}>Nearby</Text>
        {nearby.slice(0, 5).map((item) => (
          <View key={item.placeId} style={styles.listPad}>
            <RestaurantCard
              restaurant={item}
              onPress={() => navigation.navigate('RestaurantDetails', { placeId: item.placeId })}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RESTAURANT_THEME.background },
  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  brand: { color: RESTAURANT_THEME.primary, fontWeight: '700', fontSize: 14 },
  title: { fontSize: 26, fontWeight: '800', color: RESTAURANT_THEME.text },
  searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
  mapPreview: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: RESTAURANT_THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RESTAURANT_THEME.border,
  },
  mapPreviewText: { fontWeight: '600', color: RESTAURANT_THEME.text },
  error: { color: RESTAURANT_THEME.danger, marginHorizontal: 20, marginBottom: 8 },
  section: { fontSize: 18, fontWeight: '800', marginLeft: 20, marginTop: 12, marginBottom: 8 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },
  link: { color: RESTAURANT_THEME.primary, fontWeight: '600' },
  catScroll: { paddingLeft: 16, marginBottom: 8 },
  hList: { paddingLeft: 16, paddingBottom: 8 },
  listPad: { paddingHorizontal: 16 },
});
