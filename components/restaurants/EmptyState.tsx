import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';

type Props = { title: string; message?: string };

export default function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="restaurant-outline" size={48} color={RESTAURANT_THEME.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 40 },
  title: { fontSize: 18, fontWeight: '700', marginTop: 12, color: RESTAURANT_THEME.text },
  message: { fontSize: 14, color: RESTAURANT_THEME.textMuted, textAlign: 'center', marginTop: 8 },
});
