// مسیر فایل: components/ui/Switch.tsx
// فایل تازه — فاز M03، تسک ۴ (سوییچ فعال/غیرفعال راننده).
//
// معادل موبایلِ src/components/ui/Switch.tsx در ریپازیتوری وب. وب یک دکمه‌ی سفارشی با
// Flexbox (justify-start/justify-end) ساخته بود تا از موقعیت‌دهی مطلق left/right (که با جهت
// RTL خودش را آینه نمی‌کند) دوری کند — دقیقاً همان کلاس باگی که در ممیزی i18n فاز M02 (تسک ۹)
// روی دکمه‌ی حذف عکس هم مستند شده بود (`left: 2` مطلق که با I18nManager.forceRTL آینه نمی‌شود).
//
// برای موبایل، به‌جای پیاده‌سازی مجدد همان جابه‌جایی با انیمیشن دستی (که دوباره در معرض همان
// دسته‌باگ left/right مطلق قرار می‌گیرد)، از کامپوننت بومی `Switch` خودِ react-native استفاده شد:
// این کامپوننت روی iOS/Android جهت RTL را خودش به‌درستی مدیریت می‌کند (بدون نیاز به هیچ منطق
// دستی)، دسترس‌پذیری (accessibilityRole="switch") را رایگان می‌دهد، و هیچ وابستگی بیرونی تازه‌ای
// اضافه نمی‌کند (react-native از قبل در پروژه هست). فقط رنگ‌های برند «یکجا» (constants/theme.ts)
// روی آن اعمال شده‌اند تا با بقیه‌ی کامپوننت‌های ui/ (Button.tsx و...) هم‌سو بماند.
import { Colors } from '@/constants/theme';
import { Switch as NativeSwitch } from 'react-native';

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Switch({ checked, onChange, disabled, accessibilityLabel }: SwitchProps) {
  return (
    <NativeSwitch
      value={checked}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: Colors.border, true: Colors.primary }}
      thumbColor={Colors.white}
      ios_backgroundColor={Colors.border}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      style={disabled ? styles.disabled : undefined}
    />
  );
}

const styles = {
  disabled: {
    opacity: 0.6,
  },
} as const;