import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import SafeScreen from '../../components/SafeScreen';
import { hasNativeFirebase } from '../../utils/nativeFirebase';

export default function UserDetailScreen({ route, navigation }: any) {
  const { user: initialUser } = route.params;
  const [user, setUser] = useState(initialUser);

  const toggleUserStatus = async () => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'Suspend' : 'Restore';

    Alert.alert(
      `${action} Account`,
      `Are you sure you want to ${action.toLowerCase()} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: action === 'Suspend' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const updated = { ...user, status: newStatus };
              if (hasNativeFirebase()) {
                const { usersCollection } = await import('../../utils/firebase');
                await usersCollection().doc(user.id).set({ status: newStatus }, { merge: true });
              }
              setUser(updated);
              Alert.alert(
                'Done',
                newStatus === 'suspended' ? 'User has been suspended.' : 'User account has been restored.'
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeScreen style={styles.container}>
      <AdminHeader title="User Details" navigation={navigation} showBack={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View
              style={[
                styles.statusPill,
                user.status === 'suspended' ? styles.statusSuspended : styles.statusActive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  user.status === 'suspended' ? styles.statusTextSuspended : styles.statusTextActive,
                ]}
              >
                {String(user.status).charAt(0).toUpperCase() + String(user.status).slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>{user.joinedDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reviews</Text>
            <Text style={styles.infoValue}>{user.reviewCount}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, user.status === 'active' ? styles.suspendBtn : styles.restoreBtn]}
          onPress={toggleUserStatus}
        >
          <Text style={styles.actionBtnText}>
            {user.status === 'active' ? 'Suspend Account' : 'Restore Account'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, alignItems: 'center' },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  email: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusSuspended: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextActive: { color: '#065F46' },
  statusTextSuspended: { color: '#991B1B' },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  suspendBtn: { backgroundColor: '#DC2626' },
  restoreBtn: { backgroundColor: '#059669' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
