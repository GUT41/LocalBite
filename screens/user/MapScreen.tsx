import React, { useCallback, useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { EXPLORE_DEFAULT_COORDS } from '../../utils/constants';
import { isExpoGoPreview } from '../../utils/expoGoDemo';
import { useUserLocation } from '../../hooks/useUserLocation';
import { fetchNearbyRestaurants } from '../../services/restaurantsApi';
import type { Restaurant } from '../../types/restaurant.types';
import LoadingSpinner from '../../components/restaurants/LoadingSpinner';
import { RESTAURANT_THEME } from '../../constants/restaurantTheme';

export default function MapScreen({ route, navigation }: any) {
  const passed: Restaurant[] | undefined = route.params?.restaurants;
  const { coords, loading: locLoading } = useUserLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>(passed ?? []);
  const [loading, setLoading] = useState(!passed?.length);

  const focusLat = safeCoord(route.params?.lat, coords.lat);
  const focusLng = safeCoord(route.params?.lng, coords.lng);
  const placeName = route.params?.name ? String(route.params.name) : 'Nearby restaurants';

  useFocusEffect(
    useCallback(() => {
      if (passed?.length) {
        setRestaurants(passed);
        setLoading(false);
        return;
      }
      const load = async () => {
        setLoading(true);
        try {
          const list = await fetchNearbyRestaurants(coords.lat, coords.lng, { radiusKm: 8 });
          setRestaurants(list);
        } catch {
          setRestaurants([]);
        } finally {
          setLoading(false);
        }
      };
      if (!locLoading) void load();
    }, [coords.lat, coords.lng, locLoading, passed])
  );

  const region = useMemo(
    () => ({
      latitude: focusLat,
      longitude: focusLng,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    }),
    [focusLat, focusLng]
  );

  const openInMaps = (lat: number, lng: number) => {
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  if (isExpoGoPreview()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Map (Expo Go)</Text>
          <Text style={styles.headerSubtitle}>{placeName}</Text>
          <Text style={styles.coords}>
            {focusLat.toFixed(5)}, {focusLng.toFixed(5)}
          </Text>
          <Text style={styles.count}>{restaurants.length} restaurants loaded</Text>
        </View>
        <TouchableOpacity style={styles.mapsLinkBtn} onPress={() => openInMaps(focusLat, focusLng)}>
          <Text style={styles.mapsLinkText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
        <Text style={styles.headerSubtitle}>{placeName}</Text>
        {loading ? <LoadingSpinner message="Loading markers…" /> : null}
      </View>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
      >
        {restaurants.map((r) => (
          <Marker
            key={r.placeId}
            coordinate={{
              latitude: r.coordinates.latitude,
              longitude: r.coordinates.longitude,
            }}
            title={r.name}
            description={r.address}
            pinColor="#FF6B35"
            onCalloutPress={() =>
              navigation.navigate('Discover', {
                screen: 'RestaurantDetails',
                params: { placeId: r.placeId },
              })
            }
          />
        ))}
      </MapView>
    </View>
  );
}

function safeCoord(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#374151', marginTop: 4 },
  coords: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  count: { fontSize: 12, color: RESTAURANT_THEME.primary, marginTop: 4 },
  map: { flex: 1 },
  mapsLinkBtn: {
    margin: 24,
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapsLinkText: { color: '#fff', fontWeight: '700' },
});
