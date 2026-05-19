import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { API_BASE_URL } from '../../constants/api';

export default function ManageMenusScreen() {
  const [restaurantId, setRestaurantId] = useState('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Main');
  const [adminToken, setAdminToken] = useState('');

  const submit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/menus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          restaurantId,
          items: [
            {
              itemName,
              price: Number(price) || 0,
              category,
              popularity: 50,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      Alert.alert('Saved', 'Menu item added.');
      setItemName('');
      setPrice('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
      <Text style={styles.title}>Manage menus</Text>
      <TextInput style={styles.input} placeholder="Admin JWT" value={adminToken} onChangeText={setAdminToken} />
      <TextInput
        style={styles.input}
        placeholder="Restaurant placeId"
        value={restaurantId}
        onChangeText={setRestaurantId}
      />
      <TextInput style={styles.input} placeholder="Item name" value={itemName} onChangeText={setItemName} />
      <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Add menu item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  pad: { padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
