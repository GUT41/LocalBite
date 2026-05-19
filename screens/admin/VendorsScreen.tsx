import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import SafeScreen from '../../components/SafeScreen';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getData, DB_KEYS } from '../../utils/database';
import AdminHeader from '../../components/admin/AdminHeader';

export default function VendorsScreen({ navigation }: any) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Pending', 'Active', 'Suspended'];

  useFocusEffect(
    useCallback(() => {
      loadVendors();
    }, [])
  );

  const loadVendors = async () => {
    try {
      const data = (await getData(DB_KEYS.admin_vendors)) || [];
      setVendors(data);
      applyFilter('All', data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const applyFilter = (filter: string, vendorsList: any[]) => {
    setActiveFilter(filter);
    if (filter === 'All') {
      setFiltered(vendorsList);
    } else {
      const result = vendorsList.filter((v) => v.status.toLowerCase() === filter.toLowerCase());
      setFiltered(result);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      fastfood: 'Fast Food',
      restaurant: 'Restaurant',
      stall: 'Street Stall',
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'fastfood':
        return styles.typeFastFood;
      case 'restaurant':
        return styles.typeRestaurant;
      case 'stall':
        return styles.typeStall;
      default:
        return styles.typeFastFood;
    }
  };

  const getTypeTextStyle = (type: string) => {
    switch (type) {
      case 'fastfood':
        return styles.typeFastFoodText;
      case 'restaurant':
        return styles.typeRestaurantText;
      case 'stall':
        return styles.typeStallText;
      default:
        return styles.typeFastFoodText;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'active':
        return styles.statusActive;
      case 'suspended':
        return styles.statusSuspended;
      case 'rejected':
        return styles.statusRejected;
      default:
        return styles.statusActive;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return styles.statusPendingText;
      case 'active':
        return styles.statusActiveText;
      case 'suspended':
        return styles.statusSuspendedText;
      case 'rejected':
        return styles.statusRejectedText;
      default:
        return styles.statusActiveText;
    }
  };

  const renderVendorRow = ({ item }: any) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => navigation.navigate('VendorDetail', { vendor: item })}
      activeOpacity={0.7}
    >
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={2} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={styles.vendorLocation} numberOfLines={2} ellipsizeMode="tail">
          {item.location}
        </Text>
      </View>
      <View style={styles.badgeRow}>
        <View style={[styles.typeBadge, getTypeBadgeStyle(item.type)]}>
          <Text style={[styles.typeBadgeText, getTypeTextStyle(item.type)]} numberOfLines={1}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={[styles.statusBadgeText, getStatusTextStyle(item.status)]} numberOfLines={1}>
            {String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeScreen style={styles.container}>
      <AdminHeader title="Vendors" navigation={navigation} showBack={false} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterScroll}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterPill,
              activeFilter === filter ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => applyFilter(filter, vendors)}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === filter ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
              numberOfLines={1}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length > 0 ? (
        <View style={styles.listWrap}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderVendorRow}
            scrollEnabled={true}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No vendors found.</Text>
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  filterScroll: { flexGrow: 0 },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  listWrap: { flex: 1 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, justifyContent: 'center' },
  filterPillActive: { backgroundColor: '#FF6B35' },
  filterPillInactive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  filterPillText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  filterPillTextActive: { color: '#FFFFFF' },
  filterPillTextInactive: { color: '#6B7280' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
    overflow: 'visible',
  },
  vendorInfo: { marginBottom: 10, minWidth: 0 },
  vendorName: { fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 },
  vendorLocation: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 19 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, marginRight: 8, marginBottom: 4 },
  typeFastFood: { backgroundColor: '#DBEAFE' },
  typeRestaurant: { backgroundColor: '#F3E8FF' },
  typeStall: { backgroundColor: '#FEF9C3' },
  typeBadgeText: { fontSize: 11, fontWeight: '600', lineHeight: 15 },
  typeFastFoodText: { color: '#1E40AF' },
  typeRestaurantText: { color: '#6B21A8' },
  typeStallText: { color: '#854D0E' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, marginBottom: 4 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusSuspended: { backgroundColor: '#FEE2E2' },
  statusRejected: { backgroundColor: '#F3F4F6' },
  statusBadgeText: { fontSize: 11, fontWeight: '600', lineHeight: 15 },
  statusPendingText: { color: '#92400E' },
  statusActiveText: { color: '#065F46' },
  statusSuspendedText: { color: '#991B1B' },
  statusRejectedText: { color: '#6B7280' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6B7280' },
});
