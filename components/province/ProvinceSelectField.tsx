// مسیر فایل: components/province/ProvinceSelectField.tsx
// 🆕 فایل تازه — معادل موبایلیِ src/components/province/ProvinceSelectField.tsx وب. همان
// ProvincePickerModal مشترک را با allowAll=false باز می‌کند (چون یک آگهی/پروفایل باید دقیقاً به
// یک ولایت مشخص تعلق داشته باشد، نه «همه‌ی افغانستان») — انتخاب در state همان فرم والد نگه
// داشته می‌شود (نه SecureStore)، دقیقاً مثل بقیه‌ی فیلدهای هر فرم (title/price/...).
//
// این کامپوننت دقیقاً همان جایی باید در هر ۴ فرم قرار بگیرد که وب آن را می‌گذارد: بین «آدرس» و
// «شماره تماس» (ثبت آگهی کالا/پروفایل راننده/پروفایل متخصص)، یا بلافاصله بعد از «آدرس» (ثبت آگهی
// ملک، که فیلد شماره‌ی تماس ندارد) — رجوع کنید به کامنت بالای هر فایل ویرایش‌شده.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../ui/Icons';
import { ProvinceDict, ProvincePickerModal } from './ProvincePickerModal';

export function ProvinceSelectField({
  value,
  onChange,
  dict,
  label,
  error,
}: {
  value: string | null;
  onChange: (id: string) => void;
  dict: ProvinceDict;
  label: string;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const displayLabel = value ? dict.names[value] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={[styles.field, error && styles.fieldError]}>
        <Text style={[styles.fieldText, !displayLabel && styles.fieldPlaceholder]} numberOfLines={1}>
          {displayLabel ?? dict.title}
        </Text>
        <Icons.ChevronDown size={16} color={Colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {isOpen && (
        <ProvincePickerModal
          value={value}
          allowAll={false}
          dict={dict}
          onSelect={(id) => {
            onChange(id);
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  field: {
    minHeight: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: {
    borderColor: Colors.danger,
  },
  fieldText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textMain,
    flexShrink: 1,
  },
  fieldPlaceholder: {
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.danger,
  },
});