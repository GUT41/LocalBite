import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import SafeScreen from '../../components/SafeScreen';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getData, saveData, DB_KEYS } from '../../utils/database';
import { pushLocalProductsToFirestore } from '../../utils/catalogSync';
import AdminHeader from '../../components/admin/AdminHeader';

export default function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeVendor, setActiveVendor] = useState('All');
  const [vendorNames, setVendorNames] = useState<string[]>(['All']);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const productsData = (await getData(DB_KEYS.ADMIN_PRODUCTS)) || [];
      setProducts(productsData);
      
      // Build unique vendor names list
      const names: string[] = productsData.map((p: any) => String(p.vendorName));
      const unique: string[] = ['All', ...Array.from(new Set(names))];
      setVendorNames(unique);
      
      applyFilter('All', productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFilter = (vendor: string, productsList: any[]) => {
    setActiveVendor(vendor);
    if (vendor === 'All') {
      setFiltered(productsList);
    } else {
      const result = productsList.filter((p) => p.vendorName === vendor);
      setFiltered(result);
    }
  };

  const toggleFlag = async (product: any) => {
    try {
      const updated = { ...product, isFlagged: !product.isFlagged };
      const updatedProducts = products.map((p) => (p.id === product.id ? updated : p));
      await saveData(DB_KEYS.ADMIN_PRODUCTS, updatedProducts);
      await pushLocalProductsToFirestore();
      setProducts(updatedProducts);
      applyFilter(activeVendor, updatedProducts);
      Alert.alert('Updated', `Product ${updated.isFlagged ? 'flagged' : 'unflagged'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
    }
  };

  const removeProduct = async (product: any) => {
    Alert.alert('Remove Product', `Remove ${product.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedProducts = products.filter((p) => p.id !== product.id);
            await saveData(DB_KEYS.ADMIN_PRODUCTS, updatedProducts);
            await pushLocalProductsToFirestore();
            setProducts(updatedProducts);
            applyFilter(activeVendor, updatedProducts);
            Alert.alert('Removed', 'Product has been removed');
          } catch (error) {
            Alert.alert('Error', 'Failed to remove product');
          }
        },
      },
    ]);
  };

  const renderProductCard = ({ item }: any) => (
    <View style={styles.productCard}>
      <View style={styles.productRow1}>
        <View style={styles.productTitle}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.vendorName} numberOfLines={1}>
            {item.vendorName}
          </Text>
        </View>
        <Text style={styles.price} numberOfLines={1}>
          ₱{item.price}
        </Text>
      </View>

      <View style={styles.productRow2}>
        <View style={[styles.categoryBadge]}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
        {item.isFlagged && (
          <View style={styles.flaggedBadge}>
            <Text style={styles.flaggedBadgeText}>⚠ Flagged</Text>
          </View>
        )}
      </View>

      {item.dietaryTags && item.dietaryTags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.dietaryTags.map((tag: string, index: number) => (
            <View key={index} style={[styles.tagPill, getTagStyle(tag)]}>
              <Text style={[styles.tagText, getTagTextStyle(tag)]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, item.isFlagged ? styles.unflagBtn : styles.flagBtn]}
          onPress={() => toggleFlag(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>{item.isFlagged ? 'Unflag' : 'Flag'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.removeBtn]}
          onPress={() => removeProduct(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getTagStyle = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'halal':
        return styles.tagHalal;
      case 'vegan':
        return styles.tagVegan;
      default:
        return styles.tagDefault;
    }
  };

  const getTagTextStyle = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'halal':
        return styles.tagHalalText;
      case 'vegan':
        return styles.tagVeganText;
      default:
        return styles.tagDefaultText;
    }
  };

  return (
    <SafeScreen style={styles.container}>
      <AdminHeader title="Products" navigation={navigation} showBack={false} />

      <View style={styles.filterSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {vendorNames.map((vendor) => (
            <TouchableOpacity
              key={vendor}
              style={[
                styles.filterPill,
                activeVendor === vendor ? styles.filterPillActive : styles.filterPillInactive,
              ]}
              onPress={() => applyFilter(vendor, products)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeVendor === vendor ? styles.filterPillTextActive : styles.filterPillTextInactive,
                ]}
              >
                {vendor}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      </View>

      {filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderProductCard}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found.</Text>
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  filterSection: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterScroll: { maxHeight: 56 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterPillActive: { backgroundColor: '#FF6B35' },
  filterPillInactive: { backgroundColor: '#F3F4F6' },
  filterPillText: { fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF' },
  filterPillTextInactive: { color: '#6B7280' },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 8,
  },
  productRow1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  productTitle: { flex: 1, minWidth: 0, marginRight: 8 },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  vendorName: { fontSize: 12, color: '#6B7280' },
  price: { fontSize: 16, fontWeight: '600', color: '#FF6B35', flexShrink: 0 },
  productRow2: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600', color: '#1D4ED8' },
  flaggedBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  flaggedBadgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  tagPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagHalal: { backgroundColor: '#D1FAE5' },
  tagVegan: { backgroundColor: '#CCFBF1' },
  tagDefault: { backgroundColor: '#F3F4F6' },
  tagText: { fontSize: 10, fontWeight: '600' },
  tagHalalText: { color: '#065F46' },
  tagVeganText: { color: '#0F766E' },
  tagDefaultText: { color: '#6B7280' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  flagBtn: { backgroundColor: '#FEF3C7' },
  unflagBtn: { backgroundColor: '#D1FAE5' },
  removeBtn: { backgroundColor: '#FEE2E2' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#111827' },
  removeBtnText: { fontSize: 12, fontWeight: '600', color: '#991B1B' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6B7280' },
});
