import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type GoogleSignInButtonProps = {
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
};

export default function GoogleSignInButton({ onPress, loading, disabled }: GoogleSignInButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.button, isDisabled ? styles.buttonDisabled : null]}
      onPress={() => void onPress()}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
    >
      {loading ? (
        <ActivityIndicator color="#111827" />
      ) : (
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconG}>G</Text>
          </View>
          <Text style={styles.label}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconG: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
});
