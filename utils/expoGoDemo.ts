import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveData, DB_KEYS } from './database';
import type { UserRole } from '../types/auth.types';
import { hasNativeFirebase } from './nativeFirebase';

const DEMO_SESSION_KEY = 'expo_go_demo_session';

export type DemoSessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  metadata?: { creationTime?: string };
};

export function isExpoGoPreview(): boolean {
  return !hasNativeFirebase();
}

export async function loadDemoSession(): Promise<{ role: UserRole; user: DemoSessionUser } | null> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { role: UserRole; user: DemoSessionUser };
  } catch {
    return null;
  }
}

export async function saveDemoSession(role: UserRole, user: DemoSessionUser): Promise<void> {
  await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ role, user }));
}

export async function clearDemoSession(): Promise<void> {
  await AsyncStorage.removeItem(DEMO_SESSION_KEY);
}

export async function startExpoGoDemo(role: UserRole): Promise<DemoSessionUser> {
  const user: DemoSessionUser = {
    uid: role === 'admin' ? 'demo-admin' : 'demo-user',
    email: role === 'admin' ? 'admin.demo@localbite.app' : 'user.demo@localbite.app',
    displayName: role === 'admin' ? 'Demo Admin' : 'Demo User',
    metadata: { creationTime: new Date().toISOString() },
  };

  if (role === 'admin') {
    await saveData(DB_KEYS.admin_session, {
      name: user.displayName,
      email: user.email,
    });
  } else {
    await saveData(DB_KEYS.USER_PROFILE, {
      firstName: 'Demo',
      lastName: 'User',
      surname: '',
      suffix: '',
      email: user.email,
      dietaryRestrictions: 'None',
    });
  }

  await saveDemoSession(role, user);
  return user;
}
