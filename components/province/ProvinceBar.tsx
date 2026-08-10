// مسیر فایل: components/province/ProvinceBar.tsx
// 🆕 فایل تازه (هم‌ترازی با فاز ۱۰ وب — قابلیت «ولایت») — معادل موبایلیِ نوار سراسری
// src/components/layout/ProvinceBar.tsx وب. این دقیقاً همان جزئی است که تا امروز در اپ موبایل
// وجود نداشت و باعث می‌شد هدر صفحه‌ی اصلی موبایل شبیه وب نباشد.
//
// روی وب، این نوار در نمای موبایلیِ خودِ سایت (Tailwind، breakpoint md به‌پایین) یک نوار تیره‌ی
// چسبان با پس‌زمینه‌ی #0B1121 است — همان توکن heroDark که از قبل در constants/theme.ts این پروژه
// هم تعریف شده (برای بنر اصلی صفحه‌ی خانه). اینجا هم از همان توکن استفاده شده تا تجربه‌ی بصری
// دقیقاً هم‌راستا باشد.
//
// این کامپوننت باید یک‌بار، بالای Tabs Navigator (app/(tabs)/_layout.tsx)، رندر شود — دقیقاً
// همان جایگاهی که وب هم آن را در src/app/[lang]/layout.tsx (بالای <main>) رندر می‌کند.
//
// 🛠️ اصلاح باگ (بعد از تست واقعی در Expo Go): چون این نوار بیرون از هر Screen اصلی
// Tabs/Stack قرار می‌گیرد (رجوع کنید به app/(tabs)/_layout.tsx)، خودش هیچ فاصله‌ی خودکاری از
// بالای صفحه نمی‌گیرد و درست زیر لبه‌ی فیزیکی صفحه (پشت ساعت/باتری/بریدگی دوربین) می‌رفت — نه
// زیرش. رفعش دقیقاً هم‌الگو با راه‌حل از‌قبل‌موجود در components/OfflineBanner.tsx همین پروژه:
// useSafeAreaInsets از react-native-safe-area-context (که از قبل هم در package.json نصب است، هم
// در OfflineBanner.tsx استفاده شده) و افزودن ارتفاع Status Bar به paddingTop نوار.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useProvince } from '@/context/ProvinceContext';
import { useDictionary } from '@/hooks/useDictionary';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '../NotificationBell';
import { Icons } from '../ui/Icons';
import { ProvincePickerModal } from './ProvincePickerModal';

export function ProvinceBar() {
  const dict = useDictionary();
  const { province, setProvince, isReady, hasChosenProvince } = useProvince();
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  // تا SecureStore خوانده نشده هیچ‌چیز نشون نده — از یک فلاش لحظه‌ای «همه‌ی افغانستان» و
  // بلافاصله جایگزینی با مقدار واقعی جلوگیری می‌کند؛ دقیقاً هم‌الگو با شرط‌های مشابه در
  // LanguageContext/AppNavigator.
  if (!isReady) return null;

  const currentLabel = province ? dict.province.names[province] : dict.province.allProvincesOption;

  const handleSelect = (id: string) => {
    setIsOpen(false);
    setProvince(id);
  };

  return (
    <>
      {/* paddingTop پویا = ارتفاع واقعی Status Bar/Notch این گوشی + کمی فاصله‌ی خودِ نوار؛
          دقیقاً هم‌الگو با insets.top در OfflineBanner.tsx.
          🛠️ اصلاح (بعد از تست واقعی در Expo Go): این نوار حالا زنگوله‌ی اعلان را هم در خودش
          جا داده — قبلاً NotificationBell در هدرِ بومیِ جداگانه‌ی هر تب (app/(tabs)/_layout.tsx)
          نمایش داده می‌شد؛ بعد از اضافه‌شدنِ همین نوار، آن هدر سفید یک نوار زائد و بی‌ربط زیرِ
          این نوار تیره شده بود (نوارِ تیره، سفید، دوباره تیره روی هم). راه‌حل: آن هدرِ بومی کاملاً
          حذف شد (رجوع کنید به کامنتِ بالای app/(tabs)/_layout.tsx) و NotificationBell به همین‌جا
          منتقل شد — یک نوار تیره‌ی یکپارچه، بدون هیچ تکه‌ی سفیدِ اضافه. */}
      <View style={[styles.bar, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.row}>
          <Pressable onPress={() => setIsOpen(true)} style={styles.chip}>
            <Icons.MapPin size={16} color={Colors.primary} />
            <Text style={styles.chipText} numberOfLines={1}>
              {currentLabel}
            </Text>
            <Icons.ChevronDown size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
          {/* رنگ صریح چون پس‌زمینه‌ی این نوار تیره است — پیش‌فرضِ خودِ NotificationBell
              (Colors.textMain، برای پس‌زمینه‌ی سفیدِ هدرِ قبلی) روی این پس‌زمینه اصلاً دیده
              نمی‌شد. برای کاربر مهمان خودِ NotificationBell چیزی رندر نمی‌کند، پس اینجا هم
              شرط اضافه‌ای لازم نیست. */}
          <NotificationBell color="rgba(255,255,255,0.92)" />
        </View>
      </View>

      {(isOpen || !hasChosenProvince) && (
        <ProvincePickerModal
          value={province}
          allowAll
          dict={dict.province}
          onSelect={handleSelect}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.heroDark,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    flexShrink: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radii.full,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
  },
  chipText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    flexShrink: 1,
  },
});