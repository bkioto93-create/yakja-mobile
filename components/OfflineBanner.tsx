// مسیر فایل: components/OfflineBanner.tsx — فاز M07، تسک ۲
//
// «پیام واضح» (متن دقیق تسک) وقتی اتصال اینترنت قطع است — یک نوار سراسری، دقیقاً هم‌الگو با نحوه‌ی
// قرارگیری <DisclaimerModal /> در app/_layout.tsx (یک‌بار در ریشه‌ی اپ، نه تکرار در هر صفحه).
// برخلاف Toast.tsx (که یک پیام گذرا و خودکار-محو‌شونده است)، این نوار تا وقتی useIsOffline true
// برمی‌گرداند ثابت روی صفحه می‌ماند — چون قطعی اینترنت یک وضعیت پایدار است، نه یک رویداد لحظه‌ای؛
// به محض وصل شدن مجدد (useIsOffline خودش false می‌شود)، این کامپوننت خودکار ناپدید می‌شود — «تلاش
// خودکار مجدد»ِ خودِ داده (useAutoRetryOnReconnect در هر ۴ صفحه‌ی فهرست) کاملاً مستقل از این نوار
// انجام می‌شود؛ این کامپوننت فقط پیام است، نه منطق تلاش مجدد.
//
// در بالای صفحه (نه پایین، جایی که Toast است) تا با آن تداخل نکند؛ pointerEvents="none" تا لمس
// محتوای زیرش را مسدود نکند (این فقط یک پیام است، نه یک مودال مسدودکننده).
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { useIsOffline } from '@/lib/network';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OfflineBanner() {
  const isOffline = useIsOffline();
  const dict = useDictionary();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <Text pointerEvents="none" style={[styles.container, { top: insets.top }]}>
      {dict.common.offlineNotice}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 50,
    backgroundColor: Colors.danger,
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
});