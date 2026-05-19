import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';

const CATEGORIES = ['Filipino', 'Seafood', 'Pizza', 'Coffee', 'Fast Food', 'Dessert', 'Chinese', 'Grill'];

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function CategoryChip({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.text, selected && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export const FOOD_CATEGORIES = CATEGORIES;

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: RESTAURANT_THEME.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: RESTAURANT_THEME.border,
  },
  chipActive: { backgroundColor: RESTAURANT_THEME.primary, borderColor: RESTAURANT_THEME.primary },
  text: { fontWeight: '600', color: RESTAURANT_THEME.text, fontSize: 13 },
  textActive: { color: '#fff' },
});
