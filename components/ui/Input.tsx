// مسیر فایل: components/ui/Input.tsx
//
// یافته‌ی ممیزی تسک ۹ فاز M00B: در نقشه‌راه، تسک ۱ («کامپوننت‌های پایه: Button، Card، Input،
// Spinner، Toast») به‌عنوان تکمیل‌شده علامت خورده بود و توضیحش صراحتاً می‌گفت
// «components/ui/Input.tsx ... هم اضافه شدند» — اما این فایل در عمل هرگز ساخته نشده بود. تا وقتی
// فرم‌های فازهای بعدی (پروفایل راننده M03، پروفایل متخصص M04، ویزارد ملک M05 و ...) به آن نیاز
// پیدا نمی‌کردند این نبودن مخفی می‌ماند؛ همین ممیزی آن را آشکار کرد. اکنون طبق همان الگوی
// مستندشده ساخته شد: دقیقاً هم‌الگو با Button.tsx (فقط توکن‌های constants/theme.ts، بدون
// کتابخانه‌ی تازه)، با پشتیبانی از حالت خطا — همان دلیلی که توکن‌های success/danger در همین تسک ۱
// به theme.ts اضافه شدند.
//
// طبق الزام قطعی ۲، خودِ این کامپوننت هیچ متنی نمی‌داند: «label» و «error» را همیشه صدا‌کننده از
// دیکشنری فعلی (dict.*) می‌دهد.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

export type InputProps = TextInputProps & {
  /** برچسب بالای فیلد (اختیاری) — همیشه از dict.* بیاید، نه هاردکد */
  label?: string;
  /** پیام خطای اعتبارسنجی؛ اگر مقدار داشته باشد، حاشیه‌ی فیلد قرمز می‌شود و پیام زیرش نمایش داده می‌شود */
  error?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, style, ...rest },
  ref
) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        style={[styles.input, error && styles.inputError, style as object]}
        placeholderTextColor={Colors.textMuted}
        // فارسی و پشتو هر دو همیشه راست‌به‌چپ‌اند (app/_layout.tsx، I18nManager.forceRTL) —
        // دقیقاً همان استدلالی که در آن فایل هم مستند شده؛ سوییچ LTR/RTL هرگز لازم نمی‌شود.
        textAlign="right"
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  input: {
    minHeight: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textMain,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.danger,
  },
});