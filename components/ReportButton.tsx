// مسیر فایل: components/ReportButton.tsx — فاز M06، تسک ۱
//
// کامپوننت مشترک «گزارش تخلف»، برای استفاده روی هر ۴ ماژول (کالا، حمل‌ونقل، خدمات، املاک) —
// دقیقاً هم‌الگو با src/components/reports/ReportButton.tsx وب (تسک ۳ فاز ۰۶ وب): یک کامپوننت
// مشترک واحد ساخته شد (نه تکرار در هر فایل) چون منطق و ظاهر دکمه در همه‌جا یکسان است؛ فقط
// targetType/targetId فرق می‌کند — دقیقاً هم‌روح با تک‌نقطه‌ی حقیقتِ lib/reports/reportTargets.ts
// (که خودش از قبل، در همان دسته‌بندی M00، کپی شده بود).
//
// طراحی عمدی، دقیقاً طبق متن دقیق تسک («آیکونی، نه دکمه‌ی اصلی»): برخلاف دکمه‌ی «تماس»
// (Button اصلی/تمام‌عرض)، این یک لینک متنی کوچک با آیکون (Icons.Flag) است — چون «گزارش تخلف» یک
// اقدام ثانویه و کم‌تکرار است، نه اقدام اصلی صفحه؛ وزن بصری پایین‌تر از دکمه‌ی تماس، اما همیشه در
// دسترس. این همان چیزی است که پیش از این تسک، در هر ۴ ماژول (M02/M03/M04/M05)، موقتاً با یک
// Button ثانویه‌ی تمام‌عرض جایگزین شده بود — این کامپوننت اکنون آن چهار نمونه‌ی موقت را با یک
// پیاده‌سازی مشترک و هم‌شکل با نسخه‌ی وب جایگزین می‌کند.
import { Icons } from '@/components/ui/Icons';
import { Colors, Fonts } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { ReportTargetType } from '@/lib/reports/reportTargets';
import { useRouter } from 'expo-router';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

export function ReportButton({
  targetType,
  targetId,
  style,
}: {
  targetType: ReportTargetType;
  targetId: string;
  style?: StyleProp<ViewStyle>;
}) {
  const dict = useDictionary();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/report/new', params: { targetType, targetId } })
      }
      style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}>
      <Icons.Flag size={14} color={Colors.textMuted} />
      <Text style={styles.label}>{dict.reports.reportButtonLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
});