import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getData, DB_KEYS } from '../../utils/database';
import { useAuth } from '../../contexts/AuthContext';
import { isExpoGoPreview } from '../../utils/expoGoDemo';
import { isUserRole } from '../../types/auth.types';

type ProfileData = {
  displayName: string;
  email: string;
  dietary: string;
  role: string;
  memberSince: string;
};

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

export default function ProfileScreen() {
  const { user: authUser, role, isExpoGoDemo, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = useCallback(async () => {
    const local = await getData(DB_KEYS.USER_PROFILE);
    let displayName = '';
    if (local?.firstName || local?.lastName) {
      displayName = [local.firstName, local.surname, local.lastName, local.suffix].filter(Boolean).join(' ').trim();
    }
    let email = local?.email ?? '';
    let dietary = local?.dietaryRestrictions ?? '';
    let memberSince = '—';
    let userRole = role ?? 'user';

    if (authUser) {
      email = authUser.email ?? email;
      displayName = displayName || authUser.displayName || email.split('@')[0] || 'User';
      const creationTime =
        'metadata' in authUser && authUser.metadata?.creationTime
          ? authUser.metadata.creationTime
          : null;
      if (creationTime) {
        try {
          memberSince = new Date(creationTime).toLocaleDateString();
        } catch {
          memberSince = '—';
        }
      }
      if (!isExpoGoDemo) {
        try {
          const { usersCollection } = await import('../../utils/firebase');
          const snap = await usersCollection().doc(authUser.uid).get();
          const data = snap.data();
          if (data?.name) displayName = String(data.name);
          if (isUserRole(data?.role)) userRole = data.role;
        } catch {
          // offline or rules
        }
      }
    }

    setProfile({
      displayName: displayName || 'Guest',
      email: email || 'Not signed in',
      dietary: dietary || 'None',
      role: userRole,
      memberSince,
    });
  }, [authUser, role, isExpoGoDemo]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch (e) {
            Alert.alert('Sign out', e instanceof Error ? e.message : 'Could not sign out.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const initials =
    profile?.displayName
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.screenTitle}>Settings</Text>

      {isExpoGoPreview() ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>Expo Go demo — data is local sample only, not Firebase.</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={2}>
              {profile?.displayName ?? 'Loading…'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={2}>
              {profile?.email ?? ''}
            </Text>
          </View>
        </View>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{profile?.role === 'admin' ? 'Administrator' : 'Food Explorer'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <InfoRow label="Full name" value={profile?.displayName ?? ''} />
        <View style={styles.divider} />
        <InfoRow label="Email" value={profile?.email ?? ''} />
        <View style={styles.divider} />
        <InfoRow label="Dietary preferences" value={profile?.dietary ?? ''} />
        <View style={styles.divider} />
        <InfoRow label="Member since" value={profile?.memberSince ?? ''} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>App</Text>
        <InfoRow label="Version" value="1.0.0" />
        <View style={styles.divider} />
        <InfoRow label="Region" value="Mati City, Davao Oriental" />
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Support</Text>
          <Text style={styles.infoValue}>support@localbite.app</Text>
        </View>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.menuRow} onPress={() => Alert.alert('About', 'LocalBite — discover food around Mati City.')}>
          <Ionicons name="information-circle-outline" size={22} color="#6B7280" />
          <Text style={styles.menuText}>About LocalBite</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Privacy', 'Your data is stored securely with Firebase.')}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color="#6B7280" />
          <Text style={styles.menuText}>Privacy & data</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.signOut, signingOut && styles.signOutDisabled]}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.signOutText}>Sign out</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 40 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 16 },
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
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileMeta: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rolePillText: { fontSize: 12, fontWeight: '600', color: '#C2410C' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 14, color: '#6B7280', flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  menuText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  signOut: {
    marginTop: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutDisabled: { opacity: 0.7 },
  signOutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
