// مسیر فایل: components/ui/Card.tsx
// 🛠️ رفعِ باگِ سراسری (بازخوردِ کارفرما — «عکسِ محصول/ملک/خدمات از کارت بیرون می‌زنه»): این
// کامپوننتِ مشترک، که در سراسرِ اپ برای «کارت‌های گردگوشه» استفاده می‌شود (کارتِ آگهی‌های مشابه،
// کارتِ اطلاعاتِ فروشنده، و ده‌ها جای دیگر)، تا پیش از این هیچ `overflow: 'hidden'`ی نداشت —
// یعنی هر محتوایی که به هر دلیلی (تصویرِ شبکه‌ای با ابعادِ واقعیِ کمی متفاوت از حالتِ
// Placeholder، یک لحظه‌ی گذرا در طیِ لود، یا هر انحرافِ کوچکِ دیگر) کمی بزرگ‌تر از کادرِ خودش
// رندر می‌شد، به‌جایِ بریده‌شدن، از گوشه‌های گردِ کارت بیرون می‌زد. چون Card در بیش از ده‌ها جای
// اپ استفاده می‌شود، همین یک اصلاح در همین یک فایلِ مشترک، مشکل را همه‌جا یک‌جا حل می‌کند —
// دقیقاً همان رفعِ باگِ سراسری‌ای که خواسته شد.
import { Colors, Radii, Spacing } from '@/constants/theme';
import { StyleSheet, View, ViewProps } from 'react-native';

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style as object]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});