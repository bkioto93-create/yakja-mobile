// مسیر فایل: components/ui/Toast.tsx
// کامپوننت پایه‌ی Toast سراسری — تسک ۱ فاز M00B.
// دقیقاً هم‌الگو با context/LanguageContext.tsx (Provider + hook در یک فایل)، چون Toast هم
// ذاتاً یک وضعیت سراسری است (هر صفحه باید بتونه بدون props-drilling پیامی نشون بده) — نه یک
// کامپوننت صرفاً نمایشی مثل Button/Card. ToastProvider باید فقط یک‌بار، در ریشه‌ی اپ
// (app/_layout.tsx)، دور کل درخت کامپوننت‌ها قرار بگیرد.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { createContext, PropsWithChildren, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info';

type ToastState = { message: string; type: ToastType } | null;

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DURATION_MS = 2800;

export function ToastProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(20, { duration: 200 }, (finished) => {
      if (finished) runOnJS(setToast)(null);
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type });
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      hideTimer.current = setTimeout(hide, DURATION_MS);
    },
    [hide, opacity, translateY]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const bgColor =
    toast?.type === 'success' ? Colors.success : toast?.type === 'error' ? Colors.danger : Colors.textMain;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            { backgroundColor: bgColor, bottom: insets.bottom + Spacing.lg },
            animatedStyle,
          ]}>
          <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  text: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 14,
    textAlign: 'center',
  },
});