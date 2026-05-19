import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getData, saveData, DB_KEYS } from '../../utils/database';
import { ExploreItem } from '../../utils/exploreCatalog';
import { EXPLORE_DEFAULT_COORDS } from '../../utils/constants';
import {
  fetchNearbyRestaurants,
  fetchRecommendations,
  searchRestaurantsApi,
} from '../../services/restaurantsApi';
import { restaurantToExploreItem } from '../../utils/restaurantMappers';
import { resolveProductImageSource } from '../../utils/productImage';

const { height } = Dimensions.get('window');

export default function ExploreScreen({ navigation }: any) {
  const [selectedProduct, setSelectedProduct] = useState<ExploreItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<ExploreItem[]>([]);
  const [featuredRestaurants, setFeaturedRestaurants] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState(EXPLORE_DEFAULT_COORDS);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } catch {
        // Keep default Mati City coordinates
      }
    })();
  }, []);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const [nearbyRaw, recsRaw] = await Promise.all([
        fetchNearbyRestaurants(userCoords.lat, userCoords.lng, { radiusKm: 15 }),
        fetchRecommendations(userCoords.lat, userCoords.lng, { limit: 6 }),
      ]);
      setRestaurants(nearbyRaw.map(restaurantToExploreItem));
      setFeaturedRestaurants(recsRaw.map(restaurantToExploreItem));
      console.log(`[Explore] Loaded ${nearbyRaw.length} nearby via backend API`);
    } finally {
      setLoading(false);
    }
  }, [userCoords.lat, userCoords.lng]);

  useFocusEffect(
    useCallback(() => {
      const loadStored = async () => {
        const savedFavs = (await getData(DB_KEYS.FAVORITES)) || [];
        setFavorites(savedFavs);
        navigation.setParams({ currentFavorites: savedFavs });
        await loadRestaurants();
      };
      loadStored();
    }, [navigation, loadRestaurants])
  );

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    const q = searchQuery.trim();
    if (!q) {
      void loadRestaurants();
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchRestaurantsApi(userCoords.lat, userCoords.lng, q, {
          radiusKm: 50,
        });
        setRestaurants(results.map(restaurantToExploreItem));
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, userCoords.lat, userCoords.lng, loadRestaurants]);

  const toggleFavorite = async (id: string) => {
    const updated = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(updated);
    await saveData(DB_KEYS.FAVORITES, updated);
    navigation.setParams({ currentFavorites: updated });
  };

  const renderImage = (item: ExploreItem, imgStyle: object) => {
    const src = resolveProductImageSource(item.image);
    if (src) {
      return <Image source={src} style={imgStyle} />;
    }
    return (
      <View style={[imgStyle, styles.imagePlaceholder]}>
        <Ionicons name="fast-food" size={36} color="#9CA3AF" />
      </View>
    );
  };

  const renderCard = (item: ExploreItem, compact?: boolean) => (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {renderImage(item, compact ? styles.cardImgCompact : styles.cardImg)}
      <TouchableOpacity style={styles.heart} onPress={() => toggleFavorite(item.id)}>
        <Ionicons
          name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
          size={22}
          color={favorites.includes(item.id) ? '#FF4B4B' : '#FFF'}
        />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.shop ? (
          <Text style={styles.shop} numberOfLines={1}>
            {item.shop}
          </Text>
        ) : null}
        <Text style={styles.meta} numberOfLines={1}>
          {item.desc}
        </Text>
        <Text style={styles.price}>₱{item.price}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => setSelectedProduct(item)}>
          <Text style={{ color: 'white' }}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const listHeader = (
    <View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or cuisine…"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      {featuredRestaurants.length > 0 && !searchQuery.trim() ? (
        <View style={styles.featuredSection}>
          <Text style={styles.featuredTitle}>Featured</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredRestaurants.map((item) => (
              <TouchableOpacity
                key={`featured-${item.id}`}
                style={styles.featuredCard}
                onPress={() => setSelectedProduct(item)}
              >
                {renderImage(item, styles.featuredImg)}
                <Text style={styles.featuredName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.featuredDesc} numberOfLines={1}>
                  {item.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mati City Bites</Text>
        {restaurants.length === 0 && !loading ? (
          <Text style={styles.subtitle}>
            No restaurants found. Start the backend (npm start in /backend) and check EXPO_PUBLIC_API_URL.
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            {searchQuery.trim()
              ? `${restaurants.length} search results`
              : `${restaurants.length} restaurants nearby`}
          </Text>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 40 }} />
      ) : null}
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        extraData={favorites}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => renderCard(item)}
      />
      <Modal visible={!!selectedProduct} animationType="slide">
        {selectedProduct && (
          <View style={{ flex: 1 }}>
            {renderImage(selectedProduct, { height: height * 0.45, width: '100%' })}
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
              <Text style={styles.modalPrice}>₱{selectedProduct.price}</Text>
              <Text style={styles.modalText}>{selectedProduct.desc}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setSelectedProduct(null)} style={styles.backBtn}>
                  <Text>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const p = selectedProduct;
                    setSelectedProduct(null);
                    navigation.navigate('Map', { lat: p.lat, lng: p.lng, name: p.name });
                  }}
                  style={styles.mapBtn}
                >
                  <Text style={{ color: 'white' }}>View Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 50, paddingBottom: 16, backgroundColor: 'white' },
  title: { fontSize: 26, fontWeight: 'bold' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 6, lineHeight: 18 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#111827' },
  featuredSection: { marginBottom: 8 },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 15,
    marginBottom: 10,
    color: '#111827',
  },
  featuredCard: {
    width: 160,
    marginLeft: 15,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredImg: { width: 160, height: 100 },
  featuredName: { fontWeight: '700', fontSize: 14, padding: 8, paddingBottom: 2 },
  featuredDesc: { fontSize: 11, color: '#6B7280', paddingHorizontal: 8, paddingBottom: 10 },
  card: {
    flexDirection: 'row',
    margin: 15,
    marginTop: 0,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    overflow: 'hidden',
  },
  cardCompact: { marginHorizontal: 0 },
  cardImg: { width: 100, height: 100 },
  cardImgCompact: { width: 100, height: 100 },
  imagePlaceholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 5,
  },
  info: { padding: 10, flex: 1, minWidth: 0 },
  name: { fontWeight: 'bold', fontSize: 16 },
  shop: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  meta: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  price: { color: '#10B981', fontWeight: 'bold', marginTop: 4 },
  btn: { backgroundColor: '#FF6B35', padding: 8, borderRadius: 8, marginTop: 5, alignItems: 'center' },
  modalBody: {
    padding: 30,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    flex: 1,
  },
  modalTitle: { fontSize: 28, fontWeight: 'bold' },
  modalPrice: { fontSize: 22, color: '#10B981', marginVertical: 10 },
  modalText: { color: '#666', lineHeight: 22 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 30,
  },
  backBtn: { padding: 15, borderRadius: 10, backgroundColor: '#eee', width: '45%', alignItems: 'center' },
  mapBtn: { padding: 15, borderRadius: 10, backgroundColor: '#FF6B35', width: '45%', alignItems: 'center' },
});
