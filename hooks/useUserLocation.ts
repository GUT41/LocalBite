import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { EXPLORE_DEFAULT_COORDS } from '../utils/constants';

export type UserCoords = { lat: number; lng: number };

export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoords>(EXPLORE_DEFAULT_COORDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied — using default area.');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setError('Could not get location.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { coords, loading, error };
}
