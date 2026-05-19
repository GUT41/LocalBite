import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SafeScreen from '../../components/SafeScreen';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getData, DB_KEYS } from '../../utils/database';
import { useAuth } from '../../contexts/AuthContext';
import { isExpoGoPreview } from '../../utils/expoGoDemo';
import AdminHeader from '../../components/admin/AdminHeader';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

export default function SettingsScreen({ navigation }: any) {
  const { signOut, isExpoGoDemo } = useAuth();
  const [adminName, setAdminName] = useState('Admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [memberSince, setMemberSince] = useState('—');

  const loadAdminSession = useCallback(async () => {
    let name = 'Admin';
    let email = '';
    let joined = '—';

    try {
      const sessionData = await getData(DB_KEYS.admin_session);
      if (sessionData) {
        const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
        name = session.name || name;
        email = session.email || email;
      }
    } catch {
      // ignore
    }

    if (!isExpoGoDemo) {
      try {
        const { auth } = await import('../../utils/firebase');
        const u = auth().currentUser;
        if (u) {
          email = email || u.email || '';
          name = name || u.displayName || (email ? email.split('@')[0] : '') || 'Admin';
          if (u.metadata?.creationTime) {
            joined = new Date(u.metadata.creationTime).toLocaleDateString();
          }
        }
      } catch {
        // ignore
      }
    }

    setAdminName(name);
    setAdminEmail(email);
    setMemberSince(joined);
  }, [isExpoGoDemo]);

  useFocusEffect(
    useCallback(() => {
      loadAdminSession();
    }, [loadAdminSession])
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'A';

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(DB_KEYS.admin_session);
            await signOut();
          } catch {
            Alert.alert('Error', 'Failed to log out');
          }
        },
      },
    ]);
  };

  return (
    <SafeScreen style={styles.container}>
      <AdminHeader title="Settings" navigation={navigation} showBack={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isExpoGoPreview() ? (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Expo Go demo — admin data is local sample only.</Text>
          </View>
        ) : null}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{getInitials(adminName)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.adminName} numberOfLines={2}>
                {adminName}
              </Text>
              <Text
                style={[styles.adminEmail, !adminEmail ? styles.adminEmailPlaceholder : null]}
                numberOfLines={2}
              >
                {adminEmail || 'No email on file'}
              </Text>
            </View>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Administrator</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <InfoRow label="Display name" value={adminName} />
          <View style={styles.infoDivider} />
          <InfoRow label="Email" value={adminEmail} />
          <View style={styles.infoDivider} />
          <InfoRow label="Role" value="Admin — full access" />
          <View style={styles.infoDivider} />
          <InfoRow label="Member since" value={memberSince} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Admin panel</Text>
          <InfoRow label="Manage users" value="Users tab" />
          <View style={styles.infoDivider} />
          <InfoRow label="Vendors & menus" value="Vendors, Products, Pending" />
          <View style={styles.infoDivider} />
          <InfoRow label="Data store" value="Firestore + local cache" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>App</Text>
          <InfoRow label="Version" value="1.0.0" />
          <View style={styles.infoDivider} />
          <InfoRow label="Build" value="LocalBite Admin" />
          <View style={styles.infoDivider} />
          <InfoRow label="Support" value="admin@localbite.app" />
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Notifications', 'Push notifications can be enabled in a future update.')}
          >
            <Ionicons name="notifications-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.infoDivider} />
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('About', 'LocalBite Admin — manage users, vendors, and products.')}
          >
            <Ionicons name="information-circle-outline" size={22} color="#6B7280" />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 },
  demoBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  demoBannerText: { fontSize: 12, color: '#9A3412', lineHeight: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  initialsCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  initialsText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1, minWidth: 0 },
  adminName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  adminEmail: { fontSize: 14, color: '#6B7280' },
  adminEmailPlaceholder: { fontStyle: 'italic', color: '#9CA3AF' },
  roleBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: '#C2410C' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 14, color: '#6B7280', flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'right' },
  infoDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  menuText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  logoutButton: {
    marginTop: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
