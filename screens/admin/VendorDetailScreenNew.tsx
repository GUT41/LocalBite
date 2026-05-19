import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import SafeScreen from '../../components/SafeScreen';
import { Ionicons } from '@expo/vector-icons';
import { getData, saveData, DB_KEYS } from '../../utils/database';

export default function VendorDetailScreen({ route, navigation }: any) {
  const { vendor: initialVendor } = route.params;
  const [vendor, setVendor] = useState(initialVendor);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [selectedTier, setSelectedTier] = useState(vendor.subscriptionTier);

  const updateVendor = async (updated: any) => {
    try {
      const allVendors = (await getData(DB_KEYS.admin_vendors)) || [];
      const newList = allVendors.map((v: any) => (v.id === updated.id ? updated : v));
      await saveData(DB_KEYS.admin_vendors, newList);
      setVendor(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update vendor');
    }
  };

  const handleApprove = async () => {
    Alert.alert('Approve Vendor', `Approve ${vendor.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        style: 'default',
        onPress: async () => {
          const updated = { ...vendor, status: 'active' };
          await updateVendor(updated);
          Alert.alert('Approved', 'Vendor is now live on the map.');
          navigation.goBack();
        },
      },
    ]);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Missing Info', 'Please enter a rejection reason');
      return;
    }
    const updated = { ...vendor, status: 'rejected', rejectionReason };
    await updateVendor(updated);
    Alert.alert('Rejected', 'Vendor has been rejected.');
    setShowRejectInput(false);
    setRejectionReason('');
    navigation.goBack();
  };

  const handleSuspend = async () => {
    Alert.alert('Suspend Vendor', `Suspend ${vendor.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend',
        style: 'destructive',
        onPress: async () => {
          const updated = { ...vendor, status: 'suspended' };
          await updateVendor(updated);
          Alert.alert('Suspended', 'Vendor has been suspended.');
          navigation.goBack();
        },
      },
    ]);
  };

  const handleReactivate = async () => {
    Alert.alert('Reactivate Vendor', `Reactivate ${vendor.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reactivate',
        style: 'default',
        onPress: async () => {
          const updated = { ...vendor, status: 'active' };
          await updateVendor(updated);
          Alert.alert('Reactivated', 'Vendor is now active again.');
          navigation.goBack();
        },
      },
    ]);
  };

  const updateTier = async (tier: string) => {
    const updated = { ...vendor, subscriptionTier: tier };
    await updateVendor(updated);
    setSelectedTier(tier);
    Alert.alert('Updated', 'Subscription tier updated.');
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

  return (
    <SafeScreen style={styles.container}>
      {/* Back Header */}
      <View style={styles.backHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FF6B35" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Vendor Header Card */}
        <View style={styles.card}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <View style={styles.badgesRow}>
            <View style={[styles.typeBadge, getTypeBadgeStyle(vendor.type)]}>
              <Text style={[styles.badgeText, getTypeTextStyle(vendor.type)]}>
                {getTypeLabel(vendor.type)}
              </Text>
            </View>
            <View style={[styles.statusBadge, getStatusBadgeStyle(vendor.status)]}>
              <Text style={[styles.badgeText, getStatusTextStyle(vendor.status)]}>
                {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{vendor.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{vendor.operatingHours}</Text>
          </View>
        </View>

        {/* Subscription Tier Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subscription Tier</Text>
          <View style={styles.tierGrid}>
            {['basic', 'pro', 'premium'].map((tier) => (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.tierPill,
                  selectedTier === tier ? styles.tierPillActive : styles.tierPillInactive,
                ]}
                onPress={() => updateTier(tier)}
              >
                <Text
                  style={[
                    styles.tierPillText,
                    selectedTier === tier ? styles.tierPillTextActive : styles.tierPillTextInactive,
                  ]}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          {vendor.status === 'pending' && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.approveBtn]} onPress={handleApprove}>
                <Text style={styles.actionButtonText}>Approve Vendor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.rejectBtn]} onPress={() => setShowRejectInput(true)}>
                <Text style={styles.actionButtonText}>Reject Vendor</Text>
              </TouchableOpacity>
            </>
          )}

          {vendor.status === 'active' && (
            <TouchableOpacity style={[styles.actionButton, styles.suspendBtn]} onPress={handleSuspend}>
              <Text style={styles.actionButtonText}>Suspend Vendor</Text>
            </TouchableOpacity>
          )}

          {vendor.status === 'suspended' && (
            <TouchableOpacity style={[styles.actionButton, styles.reactivateBtn]} onPress={handleReactivate}>
              <Text style={styles.actionButtonText}>Reactivate Vendor</Text>
            </TouchableOpacity>
          )}

          {vendor.status === 'rejected' && (
            <Text style={styles.rejectedInfo}>This vendor has been rejected.</Text>
          )}
        </View>

        {/* Rejection Reason Input */}
        {showRejectInput && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Rejection Reason</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for rejection..."
              placeholderTextColor="#6B7280"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={[styles.actionButton, styles.confirmRejectBtn]} onPress={handleReject}>
              <Text style={styles.actionButtonText}>Confirm Rejection</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backHeader: { paddingHorizontal: 30, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, fontWeight: '600', color: '#FF6B35', marginLeft: 4 },
  scrollContent: { paddingHorizontal: 30, paddingVertical: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  vendorName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  typeFastFood: { backgroundColor: '#DBEAFE' },
  typeRestaurant: { backgroundColor: '#F3E8FF' },
  typeStall: { backgroundColor: '#FEF9C3' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusSuspended: { backgroundColor: '#FEE2E2' },
  statusRejected: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  typeFastFoodText: { color: '#1E40AF' },
  typeRestaurantText: { color: '#6B21A8' },
  typeStallText: { color: '#854D0E' },
  statusPendingText: { color: '#92400E' },
  statusActiveText: { color: '#065F46' },
  statusSuspendedText: { color: '#991B1B' },
  statusRejectedText: { color: '#6B7280' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  tierGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 0 },
  tierPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  tierPillActive: { backgroundColor: '#FF6B35' },
  tierPillInactive: { backgroundColor: '#F3F4F6' },
  tierPillText: { fontSize: 14, fontWeight: '600' },
  tierPillTextActive: { color: '#FFFFFF' },
  tierPillTextInactive: { color: '#6B7280' },
  actionButton: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  suspendBtn: { backgroundColor: '#F59E0B' },
  reactivateBtn: { backgroundColor: '#10B981' },
  confirmRejectBtn: { backgroundColor: '#EF4444' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  rejectedInfo: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 10 },
  reasonInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    color: '#111827',
  },
});
