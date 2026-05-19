import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { API_BASE_URL } from '../../constants/api';

/**
 * Admin: manually add restaurant to Firestore cache via backend.
 * Requires JWT with role admin (set JWT_SECRET on server).
 */
export default function ManageRestaurantsScreen() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('6.9510513');
  const [lng, setLng] = useState('126.2195947');
  const [featured, setFeatured] = useState(false);
  const [adminToken, setAdminToken] = useState('');

  const submit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          placeId: `manual_${Date.now()}`,
          name,
          address,
          coordinates: { latitude: Number(lat), longitude: Number(lng) },
          rating: 4.5,
          priceLevel: 2,
          featured,
          source: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      Alert.alert('Saved', `Restaurant ${data.placeId} added.`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Manage restaurants</Text>
      <Text style={styles.hint}>Adds manual entries to Firestore. Use admin JWT from backend.</Text>
      <TextInput style={styles.input} placeholder="Admin JWT" value={adminToken} onChangeText={setAdminToken} />
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Latitude" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
      <TextInput style={styles.input} placeholder="Longitude" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Add restaurant</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  pad: { padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  hint: { color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
