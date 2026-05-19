import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AdminHeader from '../../components/admin/AdminHeader';
import SafeScreen from '../../components/SafeScreen';
import { getData, saveData, DB_KEYS } from '../../utils/database';

export default function PendingScreen({ navigation }: any) {
  const [list, setList] = useState<any[]>([]);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [showInputById, setShowInputById] = useState<Record<string, boolean>>({});

  const loadPending = useCallback(async () => {
    try {
      const vendors = (await getData(DB_KEYS.admin_vendors)) || [];
      setList(vendors.filter((v: any) => v.status === 'pending'));
    } catch {
      setList([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPending();
    }, [loadPending])
  );

  const setReason = (id: string, text: string) => {
    setReasonById((prev) => ({ ...prev, [id]: text }));
  };

  const toggleRejectInput = (id: string) => {
    setShowInputById((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const persist = async (next: any[]) => {
    await saveData(DB_KEYS.admin_vendors, next);
    await loadPending();
  };

  const approve = (v: any) => {
    Alert.alert('Approve Vendor', `Approve ${v.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          const all = (await getData(DB_KEYS.admin_vendors)) || [];
          const next = all.map((x: any) => (x.id === v.id ? { ...x, status: 'active' } : x));
          await persist(next);
        },
      },
    ]);
  };

  const reject = (v: any) => {
    const reason = (reasonById[v.id] || '').trim();
    if (!reason) {
      setShowInputById((prev) => ({ ...prev, [v.id]: true }));
      return;
    }
    Alert.alert('Reject Vendor', `Reject ${v.name} with this reason?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          const all = (await getData(DB_KEYS.admin_vendors)) || [];
          const next = all.map((x: any) =>
            x.id === v.id ? { ...x, status: 'rejected', rejectionReason: reason } : x
          );
          await persist(next);
          setReasonById((prev) => {
            const n = { ...prev };
            delete n[v.id];
            return n;
          });
          setShowInputById((prev) => {
            const n = { ...prev };
            delete n[v.id];
            return n;
          });
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

  const renderItem = ({ item }: { item: any }) => {
    const reason = reasonById[item.id] || '';
    const showInput = !!showInputById[item.id];
    const tierLabel = item.subscriptionTier
      ? String(item.subscriptionTier).charAt(0).toUpperCase() + String(item.subscriptionTier).slice(1)
      : '';
    const rejectFilled = reason.trim().length > 0;
    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.vendorTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending</Text>
          </View>
        </View>
        <View style={styles.row2}>
          <View style={[styles.typeBadge, getTypeBadgeStyle(item.type)]}>
            <Text style={[styles.typeBadgeText, getTypeTextStyle(item.type)]}>{getTypeLabel(item.type)}</Text>
          </View>
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.hoursText}>{item.operatingHours}</Text>
          {tierLabel ? (
            <View style={styles.tierPill}>
              <Text style={styles.tierPillText}>{tierLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.ownerRow}>Registered by: {item.ownerId}</Text>
        <View style={styles.divider} />
        {showInput ? (
          <TextInput
            style={styles.reasonInput}
            placeholder="Enter rejection reason..."
            placeholderTextColor="#6B7280"
            value={reason}
            onChangeText={(t) => setReason(item.id, t)}
            multiline
          />
        ) : null}
        <TouchableOpacity style={styles.approveBtn} onPress={() => approve(item)} activeOpacity={0.85}>
          <Text style={styles.approveBtnText}>✓ Approve Vendor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectBtn, rejectFilled ? styles.rejectBtnSolid : styles.rejectBtnOutline]}
          activeOpacity={0.85}
          onPress={() => {
            if (!rejectFilled) {
              if (!showInput) {
                toggleRejectInput(item.id);
                return;
              }
              Alert.alert('Missing reason', 'Please enter a rejection reason.');
              return;
            }
            reject(item);
          }}
        >
          <Text style={[styles.rejectBtnLabel, rejectFilled ? styles.rejectBtnLabelOn : styles.rejectBtnLabelOff]}>
            ✗ Reject Vendor
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const count = list.length;

  return (
    <SafeScreen style={styles.safe}>
      <AdminHeader title="Pending Approvals" navigation={navigation} showBack={false} />
      {count === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySub}>No vendors waiting for approval.</Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <View style={styles.countBanner}>
            <Text style={styles.countBannerText}>
              {count} vendor{count === 1 ? '' : 's'} waiting for your review
            </Text>
          </View>
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, color: '#111827', fontWeight: '600', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  listWrap: { flex: 1 },
  countBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 14,
    borderRadius: 12,
  },
  countBannerText: { fontSize: 15, color: '#92400E', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  vendorTitle: { flex: 1, fontSize: 17, color: '#111827', fontWeight: '700', marginRight: 8, minWidth: 0 },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexShrink: 0 },
  pendingBadgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  row2: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  typeFastFood: { backgroundColor: '#DBEAFE' },
  typeRestaurant: { backgroundColor: '#F3E8FF' },
  typeStall: { backgroundColor: '#FEF9C3' },
  typeFastFoodText: { color: '#1E40AF' },
  typeRestaurantText: { color: '#6B21A8' },
  typeStallText: { color: '#854D0E' },
  locationText: { fontSize: 13, color: '#6B7280', flex: 1 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  hoursText: { fontSize: 13, color: '#6B7280', flex: 1, marginRight: 8 },
  tierPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierPillText: { fontSize: 12, color: '#111827', fontWeight: '600' },
  ownerRow: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 10 },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 72,
  },
  approveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  approveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  rejectBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectBtnSolid: {
    backgroundColor: '#EF4444',
  },
  rejectBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  rejectBtnLabel: { fontSize: 15, fontWeight: '600' },
  rejectBtnLabelOn: { color: '#FFFFFF' },
  rejectBtnLabelOff: { color: '#EF4444' },
});
