// مسیر فایل: components/chat/ChatRetentionNotice.tsx
// معادل موبایلِ src/components/chat/ChatRetentionNotice.tsx وب — نوارِ هشدارِ کوچکِ «پیام‌ها
// فقط ۲۴ ساعت نگهداری می‌شوند»، بالای هر صفحه‌ی گفتگو.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
import { Icons } from '../ui/Icons';

export function ChatRetentionNotice({ message }: { message: string }) {
  return (
    <View style={styles.wrap}>
      <Icons.CheckCircle size={15} color={Colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(6,182,212,0.06)',
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.primary,
    lineHeight: 16,
  },
});