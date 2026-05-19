import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { loadUsersFromFirestore } from '../../utils/usersService';
import { isExpoGoPreview } from '../../utils/expoGoDemo';
import SafeScreen from '../../components/SafeScreen';
import AdminHeader from '../../components/admin/AdminHeader';

export default function UsersScreen({ navigation }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    try {
      const data = await loadUsersFromFirestore();
      setUsers(data);
      setFiltered(data);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setFiltered([]);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const lowerText = text.toLowerCase();
    const result = users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerText) ||
        user.email.toLowerCase().includes(lowerText)
    );
    setFiltered(result);
  };

  const renderUserRow = ({ item }: any) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate('UserDetail', { user: item })}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">
          {item.email}
        </Text>
      </View>
      <View style={[styles.statusPill, item.status === 'suspended' ? styles.statusSuspended : styles.statusActive]}>
        <Text style={[styles.statusText, item.status === 'suspended' ? styles.statusTextSuspended : styles.statusTextActive]}>
          {String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeScreen style={styles.container}>
      <AdminHeader title="Users" navigation={navigation} showBack={false} />

      {isExpoGoPreview() ? (
        <Text style={styles.hint}>Expo Go: user list is empty until Firebase dev build + registered accounts.</Text>
      ) : (
        <Text style={styles.hint}>Shows accounts from Firebase Authentication / Firestore users.</Text>
      )}

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderUserRow}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No registered users yet. Accounts appear here after users sign up with Firebase.
          </Text>
        }
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  hint: { fontSize: 12, color: '#6B7280', paddingHorizontal: 16, marginBottom: 8, lineHeight: 18 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#111827' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  userInfo: { flex: 1, minWidth: 0, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 },
  userEmail: { fontSize: 13, color: '#6B7280', marginTop: 2, lineHeight: 18 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexShrink: 0 },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusSuspended: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '600', lineHeight: 15 },
  statusTextActive: { color: '#065F46' },
  statusTextSuspended: { color: '#991B1B' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 48, paddingHorizontal: 24, lineHeight: 22 },
});
