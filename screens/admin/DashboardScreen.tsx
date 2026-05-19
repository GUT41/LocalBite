import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../components/admin/AdminHeader';
import SafeScreen from '../../components/SafeScreen';
import { getData, saveData, DB_KEYS } from '../../utils/database';
import { loadUsersFromFirestore } from '../../utils/usersService';

export default function DashboardScreen({ navigation }: any) {
  const [userCount, setUserCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [flaggedProducts, setFlaggedProducts] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const users = await loadUsersFromFirestore();
      const vendors = (await getData(DB_KEYS.admin_vendors)) || [];
      const products = (await getData(DB_KEYS.ADMIN_PRODUCTS)) || [];

      setUserCount(users.length);
      setVendorCount(vendors.length);
      setProductCount(products.length);

      const pending = vendors.filter((v: any) => v.status === 'pending');
      setPendingCount(pending.length);
      setPendingVendors(pending.slice(0, 3));

      const flagged = products.filter((p: any) => p.isFlagged);
      setFlaggedProducts(flagged.slice(0, 3));

      setRecentUsers(users.slice(-3).reverse());
    } catch {
      setUserCount(0);
      setVendorCount(0);
      setProductCount(0);
      setPendingCount(0);
      setPendingVendors([]);
      setFlaggedProducts([]);
      setRecentUsers([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const persistVendors = async (list: any[]) => {
    await saveData(DB_KEYS.admin_vendors, list);
  };

  const approveVendor = (v: any) => {
    Alert.alert('Approve Vendor', `Approve ${v.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          const all = (await getData(DB_KEYS.admin_vendors)) || [];
          const next = all.map((x: any) => (x.id === v.id ? { ...x, status: 'active' } : x));
          await persistVendors(next);
          await loadDashboard();
        },
      },
    ]);
  };

  const rejectVendor = (v: any) => {
    Alert.alert('Reject Vendor', `Reject ${v.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          const all = (await getData(DB_KEYS.admin_vendors)) || [];
          const next = all.map((x: any) =>
            x.id === v.id ? { ...x, status: 'rejected', rejectionReason: 'Rejected from dashboard' } : x
          );
          await persistVendors(next);
          await loadDashboard();
        },
      },
    ]);
  };

  const unflagProduct = async (p: any) => {
    const all = (await getData(DB_KEYS.ADMIN_PRODUCTS)) || [];
    const next = all.map((x: any) => (x.id === p.id ? { ...x, isFlagged: false } : x));
    await saveData(DB_KEYS.ADMIN_PRODUCTS, next);
    await loadDashboard();
  };

  const removeProduct = (p: any) => {
    Alert.alert('Remove Product', `Remove ${p.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const all = (await getData(DB_KEYS.ADMIN_PRODUCTS)) || [];
          const next = all.filter((x: any) => x.id !== p.id);
          await saveData(DB_KEYS.ADMIN_PRODUCTS, next);
          await loadDashboard();
        },
      },
    ]);
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      fastfood: 'Fast Food',
      restaurant: 'Restaurant',
      stall: 'Stall',
    };
    return map[type] || type;
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

  const getUserInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <SafeScreen style={styles.safe}>
      <AdminHeader title="Dashboard" navigation={navigation} showBack={false} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Good morning, Admin 👋</Text>
          <Text style={styles.welcomeSub}>{"Here's what's happening on LocalBite today."}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, styles.statIconUsers]}>
                <Ionicons name="people-outline" size={20} color="#1D4ED8" />
              </View>
              <Text style={[styles.statNumber, styles.statNumberUsers]}>{userCount}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, styles.statIconVendors]}>
                <Ionicons name="storefront-outline" size={20} color="#15803D" />
              </View>
              <Text style={[styles.statNumber, styles.statNumberVendors]}>{vendorCount}</Text>
              <Text style={styles.statLabel}>Total Vendors</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, styles.statIconProducts]}>
                <Ionicons name="fast-food-outline" size={20} color="#C2410C" />
              </View>
              <Text style={[styles.statNumber, styles.statNumberProducts]}>{productCount}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, styles.statIconPending]}>
                <Ionicons name="time-outline" size={20} color="#D97706" />
              </View>
              <Text style={[styles.statNumber, styles.statNumberPending]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
              {pendingCount > 0 ? <Text style={styles.pendingHint}>needs review</Text> : null}
            </View>
          </View>
        </View>

        {pendingCount > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Pending Approvals
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('PendingApprovals')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.viewAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            {pendingVendors.map((v) => (
              <View key={v.id} style={styles.pendingCard}>
                <Text style={styles.pendingName} numberOfLines={2}>
                  {v.name}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.typeBadge, getTypeBadgeStyle(v.type)]}>
                    <Text style={[styles.typeBadgeText, getTypeTextStyle(v.type)]}>{getTypeLabel(v.type)}</Text>
                  </View>
                  <View style={styles.pendingStatusBadge}>
                    <Text style={styles.pendingStatusText}>Pending</Text>
                  </View>
                </View>
                <Text style={styles.pendingLocation}>{v.location}</Text>
                <View style={styles.pendingActions}>
                  <TouchableOpacity style={styles.approveSm} onPress={() => approveVendor(v)}>
                    <Text style={styles.approveSmText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectSm} onPress={() => rejectVendor(v)}>
                    <Text style={styles.rejectSmText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {flaggedProducts.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Flagged Items
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Products')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.viewAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            {flaggedProducts.map((p) => (
              <View key={p.id} style={styles.flaggedCard}>
                <View style={styles.flaggedTop}>
                  <Text style={styles.flaggedName} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <View style={styles.flaggedBadge}>
                    <Text style={styles.flaggedBadgeText}>⚠ Flagged</Text>
                  </View>
                </View>
                <View style={styles.flaggedMid}>
                  <Text style={styles.flaggedVendor}>{p.vendorName}</Text>
                  <Text style={styles.flaggedPrice}>₱{p.price}</Text>
                </View>
                <View style={styles.flaggedActions}>
                  <TouchableOpacity style={styles.unflagBtn} onPress={() => unflagProduct(p)}>
                    <Text style={styles.unflagBtnText}>Unflag</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeProduct(p)}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              New Members
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Users')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {recentUsers.map((u) => (
            <View key={u.id} style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{getUserInitials(u.name)}</Text>
              </View>
              <View style={styles.userMeta}>
                <Text style={styles.userName} numberOfLines={1}>
                  {u.name}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {u.email}
                </Text>
              </View>
              <View
                style={[
                  styles.userStatusPill,
                  u.status === 'active' ? styles.userStatusActive : styles.userStatusSuspended,
                ]}
              >
                <Text
                  style={[
                    styles.userStatusText,
                    u.status === 'active' ? styles.userStatusTextActive : styles.userStatusTextSuspended,
                  ]}
                >
                  {u.status === 'active' ? 'Active' : 'Suspended'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 15,
  },
  welcomeTitle: { fontSize: 20, color: '#111827', fontWeight: '700', marginBottom: 6 },
  welcomeSub: { fontSize: 14, color: '#6B7280' },
  statsGrid: { paddingHorizontal: 16, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconUsers: { backgroundColor: '#EFF6FF' },
  statIconVendors: { backgroundColor: '#F0FDF4' },
  statIconProducts: { backgroundColor: '#FFF7ED' },
  statIconPending: { backgroundColor: '#FFFBEB' },
  statNumber: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  statNumberUsers: { color: '#1D4ED8' },
  statNumberVendors: { color: '#15803D' },
  statNumberProducts: { color: '#C2410C' },
  statNumberPending: { color: '#D97706' },
  statLabel: { fontSize: 13, color: '#6B7280' },
  pendingHint: { fontSize: 12, color: '#D97706', fontWeight: '600', marginTop: 4 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '600', marginRight: 8 },
  viewAll: { fontSize: 14, color: '#FF6B35', fontWeight: '600', flexShrink: 0 },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  pendingName: { fontSize: 15, color: '#111827', fontWeight: '600', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  typeFastFood: { backgroundColor: '#DBEAFE' },
  typeRestaurant: { backgroundColor: '#F3E8FF' },
  typeStall: { backgroundColor: '#FEF9C3' },
  typeFastFoodText: { color: '#1E40AF' },
  typeRestaurantText: { color: '#6B21A8' },
  typeStallText: { color: '#854D0E' },
  pendingStatusBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  pendingStatusText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  pendingLocation: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  pendingActions: { flexDirection: 'row', gap: 10 },
  approveSm: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveSmText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  rejectSm: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rejectSmText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  flaggedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  flaggedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  flaggedName: { fontSize: 15, color: '#111827', fontWeight: '600', flex: 1, marginRight: 8 },
  flaggedBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  flaggedBadgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  flaggedMid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  flaggedVendor: { fontSize: 13, color: '#6B7280' },
  flaggedPrice: { fontSize: 13, color: '#FF6B35', fontWeight: '600' },
  flaggedActions: { flexDirection: 'row', gap: 10 },
  unflagBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  unflagBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  removeBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  removeBtnText: { fontSize: 13, fontWeight: '600', color: '#991B1B' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  userMeta: { flex: 1, minWidth: 0 },
  userName: { fontSize: 15, color: '#111827', fontWeight: '500' },
  userEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  userStatusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexShrink: 0 },
  userStatusActive: { backgroundColor: '#D1FAE5' },
  userStatusSuspended: { backgroundColor: '#FEE2E2' },
  userStatusText: { fontSize: 12, fontWeight: '600' },
  userStatusTextActive: { color: '#065F46' },
  userStatusTextSuspended: { color: '#991B1B' },
});
