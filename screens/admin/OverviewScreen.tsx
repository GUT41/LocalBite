import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import { getData, DB_KEYS } from '../../utils/database';
import { loadUsersFromFirestore } from '../../utils/usersService';

export default function OverviewScreen() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    pendingApprovals: 0,
  });
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const users = await loadUsersFromFirestore();
      const vendors = (await getData(DB_KEYS.admin_vendors)) || [];
      const products = (await getData(DB_KEYS.ADMIN_PRODUCTS)) || [];

      const pending = vendors.filter((v: any) => v.status === 'pending');

      setStats({
        totalUsers: users.length,
        totalVendors: vendors.length,
        totalProducts: products.length,
        pendingApprovals: pending.length,
      });

      // Get last 3 pending vendors
      setPendingVendors(pending.slice(0, 3));
    } catch (error) {
      console.error('Error loading stats:', error);
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

  return (
    <SafeScreen style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={28} color="#FF6B35" />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="storefront" size={28} color="#10B981" />
            <Text style={styles.statValue}>{stats.totalVendors}</Text>
            <Text style={styles.statLabel}>Vendors</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="cart" size={28} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={28} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          {pendingVendors.length > 0 ? (
            <View>
              {pendingVendors.map((vendor: any, index: number) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="time-outline" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{vendor.name}</Text>
                    <Text style={styles.activityType}>{getTypeLabel(vendor.type)}</Text>
                  </View>
                  <View style={styles.needsReviewBadge}>
                    <Text style={styles.needsReviewText}>Needs Review</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>No pending approvals</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 30, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 15 },
  statCard: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 10, color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  section: { paddingHorizontal: 30, marginTop: 40, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  activityIcon: { marginRight: 15, justifyContent: 'center' },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  activityType: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  needsReviewBadge: { backgroundColor: '#FF6B3520', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  needsReviewText: { fontSize: 11, fontWeight: '600', color: '#FF6B35' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 14, color: '#9CA3AF', marginTop: 12, fontWeight: '500' },
});
