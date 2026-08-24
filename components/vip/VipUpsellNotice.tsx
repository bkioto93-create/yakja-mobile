// مسیر فایل: components/vip/VipUpsellNotice.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، آپلود ویدئوی VIP) — معادلِ موبایلیِ VipUpsellNotice
// وب: کارتِ کوچکِ دعوت‌به‌عضویت، به‌جای ابزار آپلودِ ویدئو، برای کاربرِ غیر-VIP. طراحیِ شفافِ
// عمدی (طبق پرامپتِ VIP: «پنهان‌کردنِ صرفِ دکمه کافی نیست، ولی همیشه باید بدونِ گیج‌کنندگی به
// کاربر بگوید *چرا* این قابلیت الان در دسترسش نیست»). قابل‌استفاده‌ی مجدد در هر ۴ ویزارد که
// ویدئوی VIP دارند (کالا، راننده، متخصص، ملک).
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../ui/Icons';

export function VipUpsellNotice({ message, buttonLabel }: { message: string; buttonLabel: string }) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Icons.CheckCircle size={20} color="#d97706" />
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={() => router.push('/vip')} style={styles.button}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#fcd34d',
    backgroundColor: '#fffbeb',
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  message: {
    fontSize: 12.5,
    fontFamily: Fonts.bold,
    color: '#b45309',
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    marginTop: 2,
    borderRadius: Radii.full,
    backgroundColor: '#d97706',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#fff',
  },
});