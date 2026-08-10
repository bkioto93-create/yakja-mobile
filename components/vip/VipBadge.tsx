// مسیر فایل: components/vip/VipBadge.tsx
// معادل موبایلِ src/components/vip/VipBadge.tsx وب — «تیکِ VIP»ی مشترک که باید کنار نام/تماسِ
// فروشنده در همه‌جا ظاهر شود: پروفایل خودِ کاربر (همین فاز)، کارت آگهی کالا، کارت راننده، کارت
// متخصص، کارت/جزئیات آگهی ملک (این‌ها فازهای هم‌سازیِ بعدی‌اند — این کامپوننتِ مشترک همین الان
// و یک‌بار برای همیشه ساخته می‌شود تا هرکدام از آن فازها فقط importش کنند).
//
// معادل‌سازی: وب از @heroicons/react (CheckBadgeIcon، حالتِ solid) استفاده کرده؛ اینجا از
// Icons.CheckCircle (Ionicons، از قبل در پروژه موجود) — همان حسِ بصریِ «تیکِ رسمی». گرادیانِ
// طلایی/کهربایی هم با expo-linear-gradient (از قبل نصب‌شده) بازسازی شد.
import { Fonts, Radii } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';
import { Icons } from '../ui/Icons';

type VipBadgeSize = 'sm' | 'md';

export function VipBadge({ label, size = 'sm' }: { label: string; size?: VipBadgeSize }) {
  const isSmall = size === 'sm';

  return (
    <LinearGradient
      colors={['#fbbf24', '#f59e0b']} // amber-400 → amber-500، دقیقاً هم‌رنگ وب
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 0 }}
      style={[styles.pill, isSmall ? styles.pillSmall : styles.pillMedium]}>
      <Icons.CheckCircle size={isSmall ? 12 : 14} color="#fff" />
      <Text style={[styles.label, isSmall ? styles.labelSmall : styles.labelMedium]}>{label}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radii.full,
    gap: 3,
  },
  pillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillMedium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    color: '#fff',
    fontFamily: Fonts.bold,
  },
  labelSmall: {
    fontSize: 11,
  },
  labelMedium: {
    fontSize: 12,
  },
});