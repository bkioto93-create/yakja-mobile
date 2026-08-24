// مسیر فایل: components/follows/FollowStats.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — معادلِ موبایلیِ
// src/components/follows/FollowStats.tsx وب: ردیفِ «X دنبال‌کننده · Y دنبال‌شونده»، هرکدام
// لمس‌پذیر و رونده به فهرستِ مربوطه. کاملاً نمایشی و بدون هیچ منطقِ تعاملیِ فالو — برای همین هم
// در تبِ پروفایلِ خودِ کاربر و هم در app/users/[id].tsx (پروفایلِ عمومی) امن است.
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function FollowStats({
  userId,
  followersCount,
  followingCount,
  followersLabel,
  followingLabel,
}: {
  userId: string;
  followersCount: number;
  followingCount: number;
  followersLabel: string;
  followingLabel: string;
}) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push(`/users/${userId}/followers`)}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
        <Text style={styles.count}>{followersCount}</Text>
        <Text style={styles.label}>{followersLabel}</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push(`/users/${userId}/following`)}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
        <Text style={styles.count}>{followingCount}</Text>
        <Text style={styles.label}>{followingLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  itemPressed: {
    opacity: 0.6,
  },
  count: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
});