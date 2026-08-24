// مسیر فایل: components/transport/TransportDisabledNotice.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب) — معادلِ موبایلیِ TransportDisabledNotice وب
// (src/app/[lang]/transport/page.tsx): وقتی ادمین بخشِ «راننده و بار» را از پنلِ مدیریت خاموش
// کرده، این کارتِ تمام‌صفحه به‌جای فهرستِ رانندگان/فرمِ پروفایل نشان داده می‌شود.
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

export function TransportDisabledNotice({ dict }: { dict: { title: string; message: string } }) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Icons.AlertCircle size={32} color={Colors.textMuted} />
        </View>
        <Text style={styles.title}>{dict.title}</Text>
        <Text style={styles.message}>{dict.message}</Text>
      </Card>
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
  card: {
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: 360,
    width: '100%',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});