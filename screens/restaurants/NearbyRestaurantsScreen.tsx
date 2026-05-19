import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUserLocation } from '../../hooks/useUserLocation';
import { fetchNearbyRestaurants } from '../../services/restaurantsApi';
import RestaurantCard from '../../components/restaurants/RestaurantCard';
import FilterBar from '../../components/restaurants/FilterBar';
import LoadingSpinner from '../../components/restaurants/LoadingSpinner';
import EmptyState from '../../components/restaurants/EmptyState';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';
import type { Restaurant, RestaurantFilters } from '../../types/restaurant.types';

export default function NearbyRestaurantsScreen({ navigation }: any) {
  const { coords } = useUserLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filters, setFilters] = useState<RestaurantFilters>({ radiusKm: 12 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      let list = await fetchNearbyRestaurants(coords.lat, coords.lng, filters);
      if (filters.minRating != null) {
        list = list.filter((r) => (r.rating || 0) >= filters.minRating!);
      }
      setRestaurants(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords.lat, coords.lng, filters]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  useEffect(() => {
    void load();
  }, [filters.openNow, filters.maxPrice, filters.minRating, filters.radiusKm]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nearby</Text>
      </View>
      <FilterBar filters={filters} onChange={setFilters} />
      {loading ? <LoadingSpinner /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.placeId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => navigation.navigate('RestaurantDetails', { placeId: item.placeId })}
          />
        )}
        ListEmptyComponent={
          !loading ? <EmptyState title="No restaurants found" message="Adjust filters or try again." /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RESTAURANT_THEME.background },
  header: { paddingTop: 52, paddingHorizontal: 16 },
  back: { color: RESTAURANT_THEME.primary, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: RESTAURANT_THEME.text },
  error: { color: RESTAURANT_THEME.danger, padding: 16 },
  list: { padding: 16, paddingBottom: 32 },
});
