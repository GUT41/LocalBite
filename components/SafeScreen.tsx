import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SafeScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
};

/** Replaces deprecated react-native SafeAreaView. */
export default function SafeScreen({ children, style, edges }: SafeScreenProps) {
  return (
    <SafeAreaView style={style} edges={edges ?? ['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}
