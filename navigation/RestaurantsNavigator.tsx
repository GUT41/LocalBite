import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/restaurants/HomeScreen';
import NearbyRestaurantsScreen from '../screens/restaurants/NearbyRestaurantsScreen';
import RestaurantDetailsScreen from '../screens/restaurants/RestaurantDetailsScreen';
import SearchScreen from '../screens/restaurants/SearchScreen';
import RecommendationsScreen from '../screens/restaurants/RecommendationsScreen';
import { RESTAURANT_THEME } from '../constants/restaurantTheme';

export type RestaurantsStackParamList = {
  DiscoverHome: undefined;
  NearbyRestaurants: undefined;
  RestaurantDetails: { placeId: string };
  Search: { initialQuery?: string } | undefined;
  Recommendations: undefined;
};

const Stack = createStackNavigator<RestaurantsStackParamList>();

export default function RestaurantsNavigator() {
  return (
    <Stack.Navigator
      id="RestaurantsStack"
      initialRouteName="DiscoverHome"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: RESTAURANT_THEME.background },
      }}
    >
      <Stack.Screen name="DiscoverHome" component={HomeScreen} />
      <Stack.Screen name="NearbyRestaurants" component={NearbyRestaurantsScreen} />
      <Stack.Screen name="RestaurantDetails" component={RestaurantDetailsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
    </Stack.Navigator>
  );
}
