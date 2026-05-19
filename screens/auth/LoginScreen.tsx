import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hasNativeFirebase } from '../../utils/nativeFirebase';
import { isExpoGoPreview } from '../../utils/expoGoDemo';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'user' | 'admin' | null>(null);

  const expoGo = isExpoGoPreview();

  const handleLogin = async () => {
    const em = email.trim();
    if (!em || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    if (!hasNativeFirebase()) {
      Alert.alert('Expo Go', 'Use the demo buttons below to preview the app in Expo Go.');
      return;
    }

    setEmailLoading(true);
    try {
      const { auth } = await import('../../utils/firebase');
      await auth().signInWithEmailAndPassword(em, password);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: string }).code) : '';
      let message = err instanceof Error ? err.message : 'Login failed.';
      if (code === 'auth/invalid-email') {
        message = 'That email address is invalid.';
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        message = 'Incorrect email or password.';
      } else if (code === 'auth/user-disabled') {
        message = 'This account has been disabled.';
      }
      Alert.alert('Login', message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDemo = async (role: 'user' | 'admin') => {
    setDemoLoading(role);
    try {
      await signInDemo(role);
    } catch (e) {
      Alert.alert('Demo', e instanceof Error ? e.message : 'Could not start demo session.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <LinearGradient colors={['#FF6B35', '#FF8C5A']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.card}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>LocalBite</Text>

          {expoGo ? (
            <View style={styles.expoBanner}>
              <Text style={styles.expoBannerTitle}>Expo Go preview</Text>
              <Text style={styles.expoBannerText}>
                Firebase login is disabled here. Use demo mode to open User or Admin screens and find UI issues.
              </Text>
            </View>
          ) : null}

          {!expoGo ? (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, emailLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={emailLoading}
              >
                {emailLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>Create an account</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {expoGo ? (
            <View style={styles.demoBlock}>
              <TouchableOpacity
                style={[styles.demoBtn, styles.demoUserBtn]}
                onPress={() => handleDemo('user')}
                disabled={demoLoading !== null}
              >
                {demoLoading === 'user' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.demoBtnText}>Preview as User</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoBtn, styles.demoAdminBtn]}
                onPress={() => handleDemo('admin')}
                disabled={demoLoading !== null}
              >
                {demoLoading === 'admin' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.demoBtnText}>Preview as Admin</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', maxWidth: 400, padding: 28, borderRadius: 25, backgroundColor: '#FFFFFF', alignItems: 'center' },
  logo: { width: 88, height: 88, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#FF6B35', marginBottom: 12 },
  expoBanner: {
    width: '100%',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  expoBannerTitle: { fontSize: 14, fontWeight: '700', color: '#C2410C', marginBottom: 4 },
  expoBannerText: { fontSize: 12, color: '#9A3412', lineHeight: 18 },
  inputContainer: { width: '100%' },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.75 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  link: { color: '#FF6B35', marginTop: 20 },
  demoBlock: { width: '100%', gap: 10 },
  demoBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoUserBtn: { backgroundColor: '#10B981' },
  demoAdminBtn: { backgroundColor: '#6366F1' },
  demoBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
