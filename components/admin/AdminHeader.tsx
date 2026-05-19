import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AdminHeaderProps = {
  title: string;
  navigation: any;
  showBack?: boolean;
};

export default function AdminHeader({ title, navigation, showBack = false }: AdminHeaderProps) {
  const openDrawer = () => {
    if (typeof navigation.openDrawer === 'function') {
      navigation.openDrawer();
      return;
    }
    let nav: any = navigation;
    for (let i = 0; i < 4 && nav; i += 1) {
      if (typeof nav.openDrawer === 'function') {
        nav.openDrawer();
        return;
      }
      nav = nav.getParent?.();
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.sideSlot}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityRole="button">
            <Ionicons name="arrow-back" size={22} color="#FF6B35" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={openDrawer} style={styles.iconButton} accessibilityRole="button">
            <Ionicons name="menu" size={22} color="#FF6B35" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.titleWrap} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={[styles.sideSlot, styles.sideSlotRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  sideSlot: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideSlotRight: {
    alignItems: 'flex-end',
  },
  iconButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'center',
  },
});
