import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';
import type { RestaurantFilters } from '../../types/restaurant.types';

type Props = {
  filters: RestaurantFilters;
  onChange: (f: RestaurantFilters) => void;
};

export default function FilterBar({ filters, onChange }: Props) {
  const toggleOpen = () => onChange({ ...filters, openNow: !filters.openNow });
  const cyclePrice = () => {
    const next = filters.maxPrice == null ? 2 : filters.maxPrice >= 4 ? undefined : filters.maxPrice + 1;
    onChange({ ...filters, maxPrice: next });
  };
  const cycleRating = () => {
    const next = filters.minRating == null ? 4 : filters.minRating >= 4.5 ? undefined : filters.minRating + 0.5;
    onChange({ ...filters, minRating: next });
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <TouchableOpacity
        style={[styles.chip, filters.openNow && styles.chipOn]}
        onPress={toggleOpen}
      >
        <Text style={[styles.chipText, filters.openNow && styles.chipTextOn]}>Open now</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.chip, filters.maxPrice != null && styles.chipOn]} onPress={cyclePrice}>
        <Text style={[styles.chipText, filters.maxPrice != null && styles.chipTextOn]}>
          {filters.maxPrice != null ? `≤ ₱${filters.maxPrice}` : 'Price'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.chip, filters.minRating != null && styles.chipOn]}
        onPress={cycleRating}
      >
        <Text style={[styles.chipText, filters.minRating != null && styles.chipTextOn]}>
          {filters.minRating != null ? `★ ${filters.minRating}+` : 'Rating'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: 8, paddingHorizontal: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: RESTAURANT_THEME.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: RESTAURANT_THEME.border,
  },
  chipOn: { backgroundColor: RESTAURANT_THEME.primary, borderColor: RESTAURANT_THEME.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: RESTAURANT_THEME.text },
  chipTextOn: { color: '#fff' },
});
