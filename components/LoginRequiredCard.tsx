// مسیر فایل: components/LoginRequiredCard.tsx
// فاز M02 — کامپوننت مشترک «ابتدا وارد شوید»، از app/listings/new.tsx و app/listings/my-listings.tsx
// استخراج شد (هر دو، عیناً همان سه‌تایی dict.*.loginRequiredTitle/Desc/Button را دارند).
//
// طبق تسک ۱۱ فاز M01 («کاربر مهمان — گشت‌وگذار آزاد، دقیقاً مثل وب»)، خودِ صفحه هرگز از
// دسترسی کاربر مهمان جلوگیری نمی‌کند؛ فقط وقتی صفحه به user واقعی نیاز دارد (نه صرفاً «دیدن»
// بلکه «انجام یک اقدام محدود»)، این کارت به‌جای محتوای واقعی نشان داده می‌شود. متن هر سه فیلد
// را همیشه صدا‌کننده از دیکشنریِ همان ماژول می‌دهد (طبق الزام قطعی ۲) — این کامپوننت هیچ متنی
// را خودش نمی‌داند، دقیقاً هم‌الگو با CategoryPicker/Wizard/Input.
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

type LoginRequiredCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
};

export function LoginRequiredCard({ title, description, buttonLabel }: LoginRequiredCardProps) {
  const router = useRouter();
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      <Button title={buttonLabel} onPress={() => router.push('/auth/login')} style={styles.button} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
    margin: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  desc: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 21,
  },
  button: {
    marginTop: Spacing.xs,
  },
});