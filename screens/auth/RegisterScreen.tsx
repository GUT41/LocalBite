import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { saveData, DB_KEYS } from '../../utils/database';
import { hasNativeFirebase } from '../../utils/nativeFirebase';

const DEV_BUILD_MESSAGE =
  'Registration requires a development or production build with Firebase (not Expo Go).\n\nUse: npx expo run:android';

export default function RegisterScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    if (!fn || !ln) {
      Alert.alert('Missing info', 'Please enter your first and last name.');
      return;
    }
    if (!em) {
      Alert.alert('Missing info', 'Please enter your email.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password', 'Password must be at least 6 characters.');
      return;
    }
    if (!hasNativeFirebase()) {
      Alert.alert('Development build required', DEV_BUILD_MESSAGE);
      return;
    }

    setRegistering(true);
    try {
      const { auth, usersCollection } = await import('../../utils/firebase');
      const credential = await auth().createUserWithEmailAndPassword(em, password);
      const user = credential.user;
      const displayName = `${fn} ${ln}`.trim();
      await user.updateProfile({ displayName });
      await usersCollection().doc(user.uid).set({
        uid: user.uid,
        email: user.email ?? em,
        name: displayName,
        photoURL: user.photoURL ?? null,
        role: 'user',
        provider: 'email',
        status: 'active',
        createdAt: new Date(),
      });
      await saveData(DB_KEYS.USER_PROFILE, {
        firstName: fn,
        lastName: ln,
        surname: '',
        suffix: '',
        email: em,
        dietaryRestrictions: '',
      });
    } catch (err: unknown) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: string }).code) : '';
      let message = err instanceof Error ? err.message : 'Registration failed.';
      if (code === 'auth/email-already-in-use') {
        message = 'That email is already registered. Try logging in.';
      } else if (code === 'auth/invalid-email') {
        message = 'That email address is invalid.';
      } else if (code === 'auth/weak-password') {
        message = 'Password is too weak. Use at least 6 characters.';
      }
      Alert.alert('Registration', message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create account</Text>

        {!hasNativeFirebase() ? <Text style={styles.hint}>{DEV_BUILD_MESSAGE}</Text> : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor="#6B7280"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            editable={hasNativeFirebase()}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Last name</Text>
          <TextInput
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor="#6B7280"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            editable={hasNativeFirebase()}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={hasNativeFirebase()}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={hasNativeFirebase()}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, (registering || !hasNativeFirebase()) && styles.btnDisabled]}
          onPress={() => void handleRegister()}
          disabled={registering || !hasNativeFirebase()}
        >
          {registering ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryBtnText}>Create account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 24, paddingTop: 56, paddingBottom: 40, backgroundColor: '#FFFFFF' },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 16 },
  hint: { fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 18 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#111827',
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  backBtn: { marginTop: 24, alignItems: 'center' },
  backText: { color: '#6B7280', fontSize: 14 },
});
