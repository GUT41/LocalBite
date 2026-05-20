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
      const firestore = await import('@react-native-firebase/firestore');
      
      // Sign in with email and password
      const userCredential = await auth().signInWithEmailAndPassword(em, password);
      const uid = userCredential.user.uid;
      
      // Wait a brief moment to ensure auth state is fully propagated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        // Fetch user document from Firestore to check role
        const userDocSnapshot = await firestore.default().collection('user').doc(uid).get();
        
        if (!userDocSnapshot.exists) {
          // User doesn't have a document in Firestore
          Alert.alert('Error', 'User profile not found. Please contact support.');
          await auth().signOut();
          return;
        }
        
        const userData = userDocSnapshot.data();
        const role = userData?.role || 'user'; // Default to 'user' if no role specified
        
        // Route based on role
        if (role === 'admin') {
          navigation.replace('Admin');
        } else {
          navigation.replace('User');
        }
      } catch (firestoreErr: unknown) {
        // Handle Firestore-specific errors
        const errMsg = firestoreErr instanceof Error ? firestoreErr.message : '';
        if (errMsg.includes('permission-denied') || errMsg.includes('PERMISSION_DENIED')) {
          Alert.alert(
            'Access Denied',
            'Your account does not have permission to access this app. Please contact support.'
          );
        } else {
          Alert.alert('Error', 'Could not load user profile. Please try again.');
        }
        await auth().signOut();
        return;
      }
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
                  placeholderTextColor="#888888"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#888888"
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
  title: { fontSize: 30, fontWeight: 'bold', color: '#C2410C', marginBottom: 12 },
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: '#333333',
    fontSize: 16,
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
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#C2410C', marginTop: 20, fontSize: 15, fontWeight: '500' },
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
