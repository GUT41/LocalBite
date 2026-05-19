import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';

type Props = { message?: string; fullScreen?: boolean };

export default function LoadingSpinner({ message = 'Loading…', fullScreen }: Props) {
  return (
    <View style={[styles.wrap, fullScreen && styles.full]}>
      <ActivityIndicator size="large" color={RESTAURANT_THEME.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, alignItems: 'center' },
  full: { flex: 1, backgroundColor: RESTAURANT_THEME.background },
  text: { marginTop: 12, color: RESTAURANT_THEME.textMuted },
});
