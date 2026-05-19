import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useUserLocation } from '../../hooks/useUserLocation';
import { fetchRecommendations } from '../../services/restaurantsApi';
import RestaurantCard from '../../components/restaurants/RestaurantCard';
import LoadingSpinner from '../../components/restaurants/LoadingSpinner';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';
import type { Restaurant } from '../../types/restaurant.types';
import { useAuth } from '../../contexts/AuthContext';
import { getRestaurantFavorites } from '../../utils/restaurantFavorites';

export default function RecommendationsScreen({ navigation }: any) {
  const { coords } = useUserLocation();
  const { user } = useAuth();
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const favs = user?.uid ? await getRestaurantFavorites(user.uid) : [];
      const list = await fetchRecommendations(coords.lat, coords.lng, {
        favorites: favs.map((f) => f.placeId),
        limit: 20,
      });
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords.lat, coords.lng, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Building your picks…" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recommended for you</Text>
        <Text style={styles.sub}>
          Score = 40% rating + 30% popularity + 20% distance + 10% budget match
        </Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.placeId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View>
            {item.recommendationScore != null ? (
              <Text style={styles.score}>Match {Math.round(item.recommendationScore * 100)}%</Text>
            ) : null}
            <RestaurantCard
              restaurant={item}
              onPress={() => navigation.navigate('RestaurantDetails', { placeId: item.placeId })}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RESTAURANT_THEME.background },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 8 },
  back: { color: RESTAURANT_THEME.primary, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { fontSize: 12, color: RESTAURANT_THEME.textMuted, marginTop: 6, lineHeight: 18 },
  error: { color: RESTAURANT_THEME.danger, padding: 16 },
  score: { fontSize: 11, color: RESTAURANT_THEME.primary, fontWeight: '700', marginLeft: 4, marginBottom: 4 },
  list: { padding: 16, paddingBottom: 32 },
});
