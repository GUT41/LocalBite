import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useUserLocation } from '../../hooks/useUserLocation';
import { searchRestaurantsApi } from '../../services/restaurantsApi';
import SearchBar from '../../components/restaurants/SearchBar';
import RestaurantCard from '../../components/restaurants/RestaurantCard';
import FilterBar from '../../components/restaurants/FilterBar';
import LoadingSpinner from '../../components/restaurants/LoadingSpinner';
import EmptyState from '../../components/restaurants/EmptyState';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';
import type { Restaurant, RestaurantFilters } from '../../types/restaurant.types';

export default function SearchScreen({ route, navigation }: any) {
  const initialQuery = (route.params?.initialQuery as string) ?? '';
  const { coords } = useUserLocation();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [filters, setFilters] = useState<RestaurantFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const list = await searchRestaurantsApi(coords.lat, coords.lng, trimmed, filters);
        setResults(list);
        if (list.length === 0) setError(`No results for "${trimmed}"`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [coords.lat, coords.lng, filters]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(query), 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    if (initialQuery) void runSearch(initialQuery);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
      </View>
      <View style={styles.searchPad}>
        <SearchBar value={query} onChangeText={setQuery} onSubmit={() => void runSearch(query)} />
      </View>
      <FilterBar filters={filters} onChange={setFilters} />
      {loading ? <LoadingSpinner message="Searching…" /> : null}
      {error && !loading ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={results}
        keyExtractor={(item) => item.placeId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            onPress={() => navigation.navigate('RestaurantDetails', { placeId: item.placeId })}
          />
        )}
        ListEmptyComponent={
          !loading && !query.trim() ? (
            <EmptyState title="Search restaurants" message="Try cuisine, food, or restaurant name." />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RESTAURANT_THEME.background },
  header: { paddingTop: 52, paddingHorizontal: 16 },
  back: { color: RESTAURANT_THEME.primary, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800' },
  searchPad: { paddingHorizontal: 16, marginVertical: 8 },
  error: { color: RESTAURANT_THEME.danger, paddingHorizontal: 16 },
  list: { padding: 16, paddingBottom: 32 },
});
