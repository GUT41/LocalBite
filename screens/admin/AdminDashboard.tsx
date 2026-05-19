import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { saveData, getData, DB_KEYS } from '../../utils/database';

export default function AdminPanel({ navigation }: any) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [shop, setShop] = useState('');
  const [desc, setDesc] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [category, setCategory] = useState('Fast Food');

  const handleAddProduct = async () => {
    if (!name || !price || !lat || !lng) {
      Alert.alert("Error", "Please fill in the Name, Price, and Coordinates.");
      return;
    }

    const newProduct = {
      id: Date.now().toString(), // Unique ID
      name,
      price: parseFloat(price),
      shop,
      category,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      desc,
      image: { uri: 'https://via.placeholder.com/150' }, // Default placeholder for admin-added items
    };

    const existingProducts = await getData('ADMIN_PRODUCTS') || [];
    const updatedProducts = [...existingProducts, newProduct];
    
    await saveData('ADMIN_PRODUCTS', updatedProducts);
    
    Alert.alert("Success", "Product added to the app database!");
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Admin Console</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Product Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Aloha Burger" />

        <Text style={styles.label}>Price (₱)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="99" />

        <Text style={styles.label}>Store Origin (Shop Name)</Text>
        <TextInput style={styles.input} value={shop} onChangeText={setShop} placeholder="e.g. Jollibee Mati" />

        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Fast Food / Street Food" />

        <Text style={styles.label}>Latitude</Text>
        <TextInput style={styles.input} value={lat} onChangeText={setLat} keyboardType="numeric" placeholder="6.9510" />

        <Text style={styles.label}>Longitude</Text>
        <TextInput style={styles.input} value={lng} onChangeText={setLng} keyboardType="numeric" placeholder="126.2196" />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, { height: 100 }]} value={desc} onChangeText={setDesc} multiline placeholder="Describe the product..." />

        <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}>
          <Text style={styles.saveBtnText}>Add Product to App</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 25 },
  header: { fontSize: 26, fontWeight: 'bold', marginTop: 40, color: '#111827' },
  form: { marginTop: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 5 },
  input: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  saveBtn: { backgroundColor: '#FF6B35', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});