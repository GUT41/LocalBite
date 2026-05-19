import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { isUserRole, isUserStatus, type UserRole } from '../types/auth.types';
import { hasNativeFirebase } from '../utils/nativeFirebase';
import {
  clearDemoSession,
  loadDemoSession,
  startExpoGoDemo,
  type DemoSessionUser,
} from '../utils/expoGoDemo';

type AuthStatus = 'active' | 'suspended' | null;

/** Minimal Firebase Auth user shape (avoids top-level @react-native-firebase imports in Expo Go). */
export type NativeFirebaseUser = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

export type AppSessionUser = DemoSessionUser | NativeFirebaseUser;

type AuthContextValue = {
  loading: boolean;
  nativeAuthAvailable: boolean;
  isExpoGoDemo: boolean;
  user: AppSessionUser | null;
  role: UserRole | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
  signInDemo: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [nativeAuthAvailable, setNativeAuthAvailable] = useState(hasNativeFirebase());
  const [isExpoGoDemo, setIsExpoGoDemo] = useState(false);
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [status, setStatus] = useState<AuthStatus>(null);

  const readProfileAndEnforce = useCallback(async (u: NativeFirebaseUser) => {
    const { auth, usersCollection } = await import('../utils/firebase');
    const snap = await usersCollection().doc(u.uid).get();
    const data = snap.data();
    const r = isUserRole(data?.role) ? data.role : 'user';
    const s = isUserStatus(data?.status) ? data.status : 'active';
    if (s === 'suspended') {
      Alert.alert('Account suspended', 'This account has been suspended. Contact support.');
      await auth().signOut();
      return;
    }
    setRole(r);
    setStatus(s);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (isExpoGoDemo) return;
    const { auth } = await import('../utils/firebase');
    const u = auth().currentUser;
    if (!u) {
      setRole(null);
      setStatus(null);
      return;
    }
    await readProfileAndEnforce(u);
  }, [isExpoGoDemo, readProfileAndEnforce]);

  const signInDemo = useCallback(async (demoRole: UserRole) => {
    const demoUser = await startExpoGoDemo(demoRole);
    setIsExpoGoDemo(true);
    setUser(demoUser);
    setRole(demoRole);
    setStatus('active');
  }, []);

  const signOut = useCallback(async () => {
    if (isExpoGoDemo) {
      await clearDemoSession();
      setIsExpoGoDemo(false);
      setUser(null);
      setRole(null);
      setStatus(null);
      return;
    }
    if (hasNativeFirebase()) {
      const { auth } = await import('../utils/firebase');
      await auth().signOut();
    }
  }, [isExpoGoDemo]);

  useEffect(() => {
    if (!hasNativeFirebase()) {
      setNativeAuthAvailable(false);
      loadDemoSession()
        .then((session) => {
          if (session) {
            setIsExpoGoDemo(true);
            setUser(session.user);
            setRole(session.role);
            setStatus('active');
          }
        })
        .finally(() => setLoading(false));
      return;
    }

    setNativeAuthAvailable(true);
    let unsub: (() => void) | undefined;

    import('../utils/firebase')
      .then(({ auth }) => {
        unsub = auth().onAuthStateChanged(async (u) => {
          setUser(u);
          if (!u) {
            setRole(null);
            setStatus(null);
            setLoading(false);
            return;
          }
          try {
            await readProfileAndEnforce(u);
          } catch {
            setRole('user');
            setStatus('active');
          }
          setLoading(false);
        });
      })
      .catch(() => {
        setNativeAuthAvailable(false);
        setLoading(false);
      });

    return () => {
      unsub?.();
    };
  }, [readProfileAndEnforce]);

  const value = useMemo(
    () => ({
      loading,
      nativeAuthAvailable,
      isExpoGoDemo,
      user,
      role,
      status,
      refreshProfile,
      signInDemo,
      signOut,
    }),
    [loading, nativeAuthAvailable, isExpoGoDemo, user, role, status, refreshProfile, signInDemo, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
