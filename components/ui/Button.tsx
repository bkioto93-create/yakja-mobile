// مسیر فایل: components/ui/Button.tsx
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { Pressable, PressableProps, StyleSheet, Text } from 'react-native';

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ title, variant = 'primary', style, ...rest }: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style as object,
      ]}
      {...rest}>
      <Text style={isPrimary ? styles.primaryText : styles.secondaryText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryText: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  secondaryText: {
    color: Colors.textMain,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
});