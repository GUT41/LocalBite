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

  const saveProduct = async () => {
    const newItem = { id: Date.now().toString(), name, price: Number(price), shop, lat: Number(lat), lng: Number(lng), desc, image: { uri: 'https://via.placeholder.com/150' } };
    const list = await getData(DB_KEYS.ADMIN_PRODUCTS) || [];
    await saveData(DB_KEYS.ADMIN_PRODUCTS, [...list, newItem]);
    Alert.alert("Saved", "Product added.");
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      <TextInput placeholder="Product Name" style={styles.input} onChangeText={setName} />
      <TextInput placeholder="Price" style={styles.input} onChangeText={setPrice} keyboardType="numeric" />
      <TextInput placeholder="Store Name" style={styles.input} onChangeText={setShop} />
      <TextInput placeholder="Lat" style={styles.input} onChangeText={setLat} keyboardType="numeric" />
      <TextInput placeholder="Lng" style={styles.input} onChangeText={setLng} keyboardType="numeric" />
      <TextInput placeholder="Desc" style={styles.input} onChangeText={setDesc} multiline />
      <TouchableOpacity onPress={saveProduct} style={styles.btn}><Text style={{color:'white'}}>Add Product</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: 'white' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  input: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, marginBottom: 15 },
  btn: { backgroundColor: '#FF6B35', padding: 18, borderRadius: 10, alignItems: 'center' }
});