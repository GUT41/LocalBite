import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChangeText, onSubmit, placeholder }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name="search" size={20} color={RESTAURANT_THEME.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Search restaurants or food…'}
        placeholderTextColor={RESTAURANT_THEME.textMuted}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={20} color={RESTAURANT_THEME.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RESTAURANT_THEME.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: RESTAURANT_THEME.border,
    gap: 8,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: RESTAURANT_THEME.text },
});
