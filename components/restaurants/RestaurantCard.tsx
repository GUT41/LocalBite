import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';
import type { Restaurant } from '../../types/restaurant.types';

type Props = {
  restaurant: Restaurant;
  onPress: () => void;
  horizontal?: boolean;
};

export default function RestaurantCard({ restaurant, onPress, horizontal }: Props) {
  const price = '₱'.repeat(Math.min(restaurant.priceLevel ?? 2, 4));
  return (
    <TouchableOpacity
      style={[styles.card, horizontal && styles.horizontal]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {restaurant.photoUrl ? (
        <Image source={{ uri: restaurant.photoUrl }} style={[styles.image, horizontal && styles.imageH]} />
      ) : (
        <View style={[styles.image, styles.placeholder, horizontal && styles.imageH]}>
          <Ionicons name="restaurant" size={32} color={RESTAURANT_THEME.textMuted} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {restaurant.name}
        </Text>
        <View style={styles.row}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.rating}>{(restaurant.rating || 0).toFixed(1)}</Text>
          <Text style={styles.meta}> · {price}</Text>
          {restaurant.distanceKm != null ? (
            <Text style={styles.meta}> · {restaurant.distanceKm.toFixed(1)} km</Text>
          ) : null}
        </View>
        {restaurant.openNow === true ? (
          <Text style={styles.open}>Open now</Text>
        ) : restaurant.openNow === false ? (
          <Text style={styles.closed}>Closed</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: RESTAURANT_THEME.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: RESTAURANT_THEME.border,
  },
  horizontal: { width: 260, marginRight: 12, marginBottom: 0 },
  image: { width: '100%', height: 140 },
  imageH: { height: 120 },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: RESTAURANT_THEME.border },
  body: { padding: 12 },
  name: { fontSize: 16, fontWeight: '700', color: RESTAURANT_THEME.text },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  rating: { fontSize: 13, fontWeight: '600', marginLeft: 4, color: RESTAURANT_THEME.text },
  meta: { fontSize: 12, color: RESTAURANT_THEME.textMuted },
  open: { fontSize: 12, color: RESTAURANT_THEME.accent, marginTop: 4, fontWeight: '600' },
  closed: { fontSize: 12, color: RESTAURANT_THEME.danger, marginTop: 4 },
});
