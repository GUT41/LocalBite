import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getRestaurantFavorites } from '../../utils/restaurantFavorites';
import type { SavedRestaurantFavorite } from '../../types/restaurant.types';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';
import EmptyState from '../../components/restaurants/EmptyState';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<SavedRestaurantFavorite[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!user?.uid) {
          setItems([]);
          return;
        }
        setItems(await getRestaurantFavorites(user.uid));
      };
      void load();
    }, [user?.uid])
  );

  const openDetails = (placeId: string) => {
    navigation.navigate('Discover', {
      screen: 'RestaurantDetails',
      params: { placeId },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved restaurants</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.placeId}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openDetails(item.placeId)}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.img} />
            ) : (
              <View style={[styles.img, styles.placeholder]}>
                <Ionicons name="restaurant" size={28} color={RESTAURANT_THEME.textMuted} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              {item.address ? (
                <Text style={styles.address} numberOfLines={1}>
                  {item.address}
                </Text>
              ) : null}
              {item.rating != null ? (
                <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No favorites yet"
            message="Tap the heart on a restaurant to save it here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RESTAURANT_THEME.background, padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: RESTAURANT_THEME.text },
  card: {
    flexDirection: 'row',
    backgroundColor: RESTAURANT_THEME.card,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RESTAURANT_THEME.border,
  },
  img: { width: 88, height: 88 },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: RESTAURANT_THEME.border },
  info: { padding: 14, flex: 1 },
  name: { fontWeight: 'bold', fontSize: 16 },
  address: { fontSize: 12, color: RESTAURANT_THEME.textMuted, marginTop: 4 },
  rating: { color: RESTAURANT_THEME.accent, marginTop: 6, fontWeight: '600' },
});
