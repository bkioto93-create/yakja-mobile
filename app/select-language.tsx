// مسیر فایل: app/select-language.tsx — معادل /select-language وب — فاز M00B، تسک ۸ (نسخه‌ی واقعی)
//
// یادداشت طراحی مهم: برخلاف تمام صفحات دیگر، این صفحه عمداً از دیکشنری (dict.*) استفاده
// نمی‌کند. چون خودِ همین صفحه محل انتخاب زبان است، برچسب هر گزینه باید همیشه به زبان خودش
// خوانا باشد (نه به زبانی که فعلاً در LanguageContext انتخاب شده) — دقیقاً همان استثنای مستند‌شده
// در جدول بند ۳ سند راهبردی موبایل: «/select-language → — (فقط Storage محلی)».
//
// اصلاح ممیزی تسک ۹ فاز M00B: subtitle قبلاً فقط فارسی بود («یکی از دو زبان را انتخاب کنید») —
// یعنی همان مشکلی که کل این صفحه قرار بود حلش کند (خوانا نبودن به زبان خودِ کاربر) درباره‌ی خودِ
// این خط هنوز برقرار بود. حالا مثل title، به هر دو خط (دری/پشتو) نوشته شده.
//
// 🛠️ اصلاح جانبی (بین فاز M00B و فاز M01) — بازنویسی منطق «برگشت بعد از انتخاب»:
// از این پس app/_layout.tsx این صفحه را واقعاً به‌عنوان مقصد اولین‌اجرا استفاده می‌کند (با
// Stack.Protected روی گروه (tabs))، دقیقاً همان‌طور که کامنت قبلی همین‌جا از قبل پیش‌بینی کرده
// بود. تفاوت مهم نسبت به نسخه‌ی قبلی: حالتِ «اولین اجرا» (router.canGoBack() === false) دیگر
// بلافاصله و در همان تابع choose() به router.replace('/(tabs)') نمی‌رود — چون در همان لحظه،
// مسیر '(tabs)' ممکن است هنوز در ناوبر ثبت نشده باشد (Stack.Protected فقط *بعد* از رندر
// دوباره‌ی app/_layout.tsx با hasChosenLanguage=true آن را در دسترس قرار می‌دهد، نه هم‌زمان و
// در همان event handler که خودِ setLanguage را صدا می‌زند). به‌جایش، یک useEffect جدا که به
// hasChosenLanguage گوش می‌دهد این کار را بعد از قطعی‌شدن آن رندر انجام می‌دهد — تضمین می‌کند
// '(tabs)' همیشه از قبل در دسترس است، نه هم‌زمان با درخواست ورود به آن.
// حالتِ «از تب پروفایل باز شده» (canGoBack === true) بدون تغییر رفتاری مانده — چون در آن حالت
// کاربر از قبل قطعاً یک زبان انتخاب‌شده داشته (وگرنه اصلاً به تب‌ها دسترسی نداشت که از آن‌جا به
// این صفحه push کند)، پس هیچ‌وقت race زمان‌بندی‌ای با Stack.Protected در کار نیست و
// router.back() همان لحظه‌ای که صدا زده می‌شود امن است.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { Language, useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const LANGUAGE_OPTIONS: { id: Language; nativeLabel: string; subLabel: string }[] = [
  { id: 'fa', nativeLabel: 'دری', subLabel: 'فارسی' },
  { id: 'ps', nativeLabel: 'پښتو', subLabel: 'پشتو' },
];

export default function SelectLanguageScreen() {
  const { language, setLanguage, hasChosenLanguage } = useLanguage();
  const router = useRouter();

  // فقط در اولین رندر خونده می‌شه و برای کل عمر این صفحه ثابت می‌مونه — تشخیص می‌ده این صفحه
  // از یک صفحه‌ی دیگه‌ی اپ (push شده، مثلاً تب پروفایل) باز شده یا مستقیم مقصد اولین‌اجرا بوده
  // (بدون هیچ صفحه‌ی قبلی در پشته).
  const openedFromInsideApp = useRef(router.canGoBack()).current;

  const choose = (lang: Language) => {
    setLanguage(lang);
    // اگر این صفحه از یک صفحه‌ی دیگر (مثلاً تب پروفایل، فاز M01 تسک ۱۰) باز شده، همون‌جا
    // برمی‌گردیم. حالتِ «اولین اجرا» را افکت پایین مدیریت می‌کنه (دلیل کامل در کامنت بالای فایل).
    if (openedFromInsideApp) {
      router.back();
    }
  };

  useEffect(() => {
    if (hasChosenLanguage && !openedFromInsideApp) {
      router.replace('/(tabs)');
    }
    // openedFromInsideApp عمداً بیرون از dependency array — مقدارش با useRef ثابت نگه داشته
    // شده (فقط یک‌بار در اولین رندر خونده می‌شه)، نه یک state که تغییرش باید رصد بشه.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChosenLanguage]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>زبان / ژبه</Text>
      <Text style={styles.subtitle}>یکی از دو زبان را انتخاب کنید / یوه ژبه غوره کړئ</Text>

      <View style={styles.options}>
        {LANGUAGE_OPTIONS.map((opt) => {
          const selected = opt.id === language;
          return (
            <Pressable
              key={opt.id}
              onPress={() => choose(opt.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.nativeLabel, selected && styles.selectedText]}>
                {opt.nativeLabel}
              </Text>
              <Text style={[styles.subLabel, selected && styles.selectedText]}>
                {opt.subLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: -Spacing.md,
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  option: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ecfeff',
  },
  pressed: {
    opacity: 0.85,
  },
  nativeLabel: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  subLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  selectedText: {
    color: Colors.primaryDark,
  },
});