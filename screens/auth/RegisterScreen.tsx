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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import SafeScreen from '../../components/SafeScreen';
import { saveData, DB_KEYS } from '../../utils/database';
import { hasNativeFirebase } from '../../utils/nativeFirebase';
import { validateSignupForm } from '../../utils/authValidation';

const DEV_BUILD_MESSAGE =
  'Registration requires a development or production build with Firebase (not Expo Go).\n\nUse: npx expo run:android';

const PRIMARY = '#FF6B35';
const TEXT = '#111827';
const LABEL = '#374151';
const PLACEHOLDER = '#6B7280';
const INPUT_BG = '#F3F4F6';
const BORDER = '#E5E7EB';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisible: () => void;
  editable: boolean;
};

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggleVisible,
  editable,
}: PasswordFieldProps) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          editable={editable}
          selectionColor={PRIMARY}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={onToggleVisible}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={LABEL} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registering, setRegistering] = useState(false);

  const canRegister = hasNativeFirebase();

  const handleRegister = async () => {
    const validationError = validateSignupForm({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });
    if (validationError) {
      Alert.alert('Check your details', validationError);
      return;
    }

    if (!canRegister) {
      Alert.alert('Development build required', DEV_BUILD_MESSAGE);
      return;
    }

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();

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
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      let message = err instanceof Error ? err.message : 'Registration failed.';
      if (code === 'auth/email-already-in-use') {
        message = 'That email is already registered. Try logging in.';
      } else if (code === 'auth/invalid-email') {
        message = 'Please enter a valid email.';
      } else if (code === 'auth/weak-password') {
        message = 'Password must contain at least 8 characters with upper, lower, and a number.';
      }
      Alert.alert('Registration', message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <LinearGradient colors={['#FF6B35', '#FF8C5A']} style={styles.gradient}>
      <SafeScreen style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join LocalBite to discover food near you</Text>

              {!canRegister ? (
                <View style={styles.banner}>
                  <Text style={styles.bannerText}>{DEV_BUILD_MESSAGE}</Text>
                </View>
              ) : null}

              <View style={styles.row}>
                <View style={[styles.formGroup, styles.half]}>
                  <Text style={styles.label}>First name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="First name"
                    placeholderTextColor={PLACEHOLDER}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    editable={canRegister}
                    selectionColor={PRIMARY}
                  />
                </View>
                <View style={[styles.formGroup, styles.half]}>
                  <Text style={styles.label}>Last name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Last name"
                    placeholderTextColor={PLACEHOLDER}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    editable={canRegister}
                    selectionColor={PRIMARY}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={PLACEHOLDER}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={canRegister}
                  selectionColor={PRIMARY}
                />
              </View>

              <PasswordField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 8 chars, upper, lower, number"
                visible={showPassword}
                onToggleVisible={() => setShowPassword((v) => !v)}
                editable={canRegister}
              />

              <PasswordField
                label="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                visible={showConfirmPassword}
                onToggleVisible={() => setShowConfirmPassword((v) => !v)}
                editable={canRegister}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, (registering || !canRegister) && styles.btnDisabled]}
                onPress={() => void handleRegister()}
                disabled={registering || !canRegister}
                activeOpacity={0.85}
              >
                {registering ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                disabled={registering}
              >
                <Text style={styles.backText}>Already have an account? </Text>
                <Text style={styles.backLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeScreen>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: PLACEHOLDER,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  banner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  bannerText: { fontSize: 12, color: '#9A3412', lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: LABEL, marginBottom: 6 },
  input: {
    height: 50,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingRight: 4,
  },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  eyeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    height: 52,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.65 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  backBtn: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { color: PLACEHOLDER, fontSize: 14 },
  backLink: { color: PRIMARY, fontSize: 14, fontWeight: '700' },
});
