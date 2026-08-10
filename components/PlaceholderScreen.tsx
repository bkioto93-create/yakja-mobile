// مسیر فایل: components/PlaceholderScreen.tsx
// کامپوننت مشترک موقت برای صفحاتی که هنوز پیاده‌سازی نشده‌اند.
// هر فاز که پیش رفت، استفاده از این کامپوننت را در همان صفحه با محتوای واقعی جایگزین کنید.
//
// اصلاح ممیزی تسک ۹ فاز M00B: متن پیش‌فرض subtitle قبلاً مستقیم فارسی هاردکد بود («این صفحه هنوز
// ساخته نشده — به‌زودی» — نقض الزام قطعی ۲: با انتخاب پشتو از صفحه‌ی select-language، این متن
// همچنان فارسی می‌ماند). حالا از dict.common.comingSoon خوانده می‌شود — دقیقاً هم‌الگو با نحوه‌ی
// خواندن دیگر متن‌های عمومی (dict.common.back/next/...) توسط کامپوننت Wizard (تسک ۳ همین فاز).
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { StyleSheet, Text, View } from 'react-native';

export default function PlaceholderScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  const dict = useDictionary();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle ?? dict.common.comingSoon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});