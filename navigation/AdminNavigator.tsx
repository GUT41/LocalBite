import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, useDrawerStatus } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { getData, DB_KEYS } from '../utils/database';
import { hasNativeFirebase } from '../utils/nativeFirebase';
import { useAuth } from '../contexts/AuthContext';
import { isExpoGoPreview } from '../utils/expoGoDemo';
import DashboardScreen from '../screens/admin/DashboardScreen';
import UsersScreen from '../screens/admin/UsersScreen';
import VendorsScreen from '../screens/admin/VendorsScreen';
import ProductsScreen from '../screens/admin/ProductsScreen';
import PendingScreen from '../screens/admin/PendingScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import ManageRestaurantsScreen from '../screens/admin/ManageRestaurantsScreen';
import ManageMenusScreen from '../screens/admin/ManageMenusScreen';
import UserDetailScreen from '../screens/admin/UserDetailScreen';
import VendorDetailScreen from '../screens/admin/VendorDetailScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawer(props: any) {
  const { signOut, isExpoGoDemo } = useAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminInitials, setAdminInitials] = useState('A');
  const drawerStatus = useDrawerStatus();

  const loadSession = useCallback(async () => {
    try {
      const sessionData = await getData(DB_KEYS.admin_session);
      const session =
        sessionData && typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
      let email = session?.email || '';
      let name = session?.name || '';
      if (!isExpoGoDemo && hasNativeFirebase() && (!email || !name)) {
        try {
          const { auth } = await import('../utils/firebase');
          const u = auth().currentUser;
          if (u) {
            email = email || u.email || '';
            name = name || u.displayName || (email ? email.split('@')[0] : '') || 'Admin';
          }
        } catch {
          // ignore
        }
      }
      if (!name) name = 'Admin';
      setAdminEmail(email);
      const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      setAdminInitials(initials || 'A');
    } catch {
      setAdminEmail('');
      setAdminInitials('A');
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (drawerStatus === 'open') {
      loadSession();
    }
  }, [drawerStatus, loadSession]);

  const confirmLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(DB_KEYS.admin_session);
            await signOut();
          } catch {
            Alert.alert('Error', 'Failed to log out');
          }
        },
      },
    ]);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerScrollContent}
      style={styles.drawerScroll}
    >
      <View style={styles.drawerTop}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{adminInitials}</Text>
        </View>
        <Text style={styles.drawerTitle}>LocalBite Admin</Text>
        {isExpoGoPreview() ? <Text style={styles.drawerDemoTag}>Expo Go demo</Text> : null}
        <Text style={styles.drawerEmail}>{adminEmail}</Text>
      </View>

      <View style={styles.divider} />

      <DrawerItemList {...props} />

      <View style={styles.drawerSpacer} />

      <View style={styles.divider} />

      <TouchableOpacity style={styles.logoutRow} onPress={confirmLogout} accessibilityRole="button">
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

function AdminDrawerNavigator() {
  return (
    <Drawer.Navigator
      id="AdminDrawer"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: styles.drawerStyle,
        drawerActiveBackgroundColor: '#FFF7ED',
        drawerActiveTintColor: '#FF6B35',
        drawerInactiveTintColor: '#6B7280',
        drawerLabelStyle: styles.drawerLabelStyle,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Users"
        component={UsersScreen}
        options={{
          drawerLabel: 'Users',
          drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Vendors"
        component={VendorsScreen}
        options={{
          drawerLabel: 'Vendors',
          drawerIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          drawerLabel: 'Products',
          drawerIcon: ({ color, size }) => <Ionicons name="fast-food-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="PendingApprovals"
        component={PendingScreen}
        options={{
          drawerLabel: 'Pending',
          drawerIcon: ({ color, size }) => (
            <View style={styles.drawerIconRow}>
              <Ionicons name="time-outline" size={size} color={color} />
              <PendingDrawerBadge />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="ManageRestaurants"
        component={ManageRestaurantsScreen}
        options={{
          drawerLabel: 'Restaurants',
          drawerIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="ManageMenus"
        component={ManageMenusScreen}
        options={{
          drawerLabel: 'Menus',
          drawerIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

function PendingDrawerBadge() {
  const [count, setCount] = useState(0);
  const drawerStatus = useDrawerStatus();

  useEffect(() => {
    if (drawerStatus !== 'open') return;
    let cancelled = false;
    (async () => {
      try {
        const vendors = (await getData(DB_KEYS.admin_vendors)) || [];
        const n = vendors.filter((v: any) => v.status === 'pending').length;
        if (!cancelled) setCount(n);
      } catch {
        if (!cancelled) setCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drawerStatus]);

  if (count <= 0) return null;
  return (
    <View style={styles.pendingBadge}>
      <Text style={styles.pendingBadgeText}>{count}</Text>
    </View>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator id="AdminStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDrawer" component={AdminDrawerNavigator} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="VendorDetail" component={VendorDetailScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerStyle: {
    backgroundColor: '#FFFFFF',
    width: 280,
  },
  drawerLabelStyle: {
    fontSize: 15,
    fontWeight: '500',
  },
  drawerScroll: {
    backgroundColor: '#FFFFFF',
  },
  drawerScrollContent: {
    flexGrow: 1,
  },
  drawerTop: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  drawerDemoTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C2410C',
    marginBottom: 4,
  },
  drawerEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  drawerSpacer: {
    flex: 1,
    minHeight: 24,
  },
  logoutRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  drawerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadge: {
    marginLeft: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
});
