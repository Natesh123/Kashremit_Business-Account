import React, { memo } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { theme } from '../core/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SIZES } from 'app/constants/Assets';

type Props = {
  onPress?: () => void,
  children?: React.ReactNode,
  outerLine?: boolean,
  style?: StyleProp<ViewStyle>;
};
const Button = ({ children, onPress, style, outerLine }: Props) => (

  <TouchableOpacity onPress={onPress}>
    <LinearGradient colors={[theme.colors.buttonPrimary, theme.colors.buttonSecondary]}
      start={{ x: -0.1, y: 0.0 }}
      end={{ x: 1.1, y: 0.4 }}
      style={[{
        padding: 12,
        alignItems: 'center',
        borderRadius: 12, 
      }, style]}>
      <Text style={styles.text}>{children}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    marginVertical: 10,
    marginHorizontal: 20,
    padding: 0
  },
  text: {
    fontWeight: '500',
    fontSize: SIZES.medium,
    lineHeight: 26,
    textAlign: 'center',
    color: theme.colors.buttonColor
  },
});

export default memo(Button);
