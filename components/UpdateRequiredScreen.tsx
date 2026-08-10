// مسیر فایل: components/UpdateRequiredScreen.tsx
// 🆕 سیستم تازه‌ی «کنترلِ نسخه‌ی اپ از دیتابیس» — سناریوی «آپدیتِ اجباری» طبق درخواستِ صریحِ
// کارفرما: «یه مشکلِ امنیتی پیش اومده یا یه جایی رو در وب بروز کردیم، باید حتماً موبایل هم
// باهاش همسان بشه — یه آپدیتِ اجباری می‌دیم بیرون». app/_layout.tsx به‌جایِ Stackِ عادیِ اپ،
// فقط همین کامپوننت را رندر می‌کند — یعنی کاربر به هیچ صفحه‌ی دیگری (حتی تب خانه) دسترسی ندارد
// تا آپدیت نکند.
//
// **غیرقابل‌ردکردن، عمداً و کامل:**
//   - هیچ دکمه‌ی بستن/×ای نیست.
//   - دکمه‌ی بازگشتِ سخت‌افزاریِ اندروید (BackHandler) عمداً بی‌اثر شده — نه برای رفتن به صفحه‌ی
//     قبل، نه برای خروج از اپ؛ تنها راهِ خروج از این صفحه، واقعاً بروزرسانی کردن (و باز کردنِ
//     نسخه‌ی تازه) است.
//   - onRequestClose هم مثل الگویِ DisclaimerModal.tsx عمداً کاری نمی‌کند.
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAppVersion } from '@/context/AppVersionContext';
import { useLanguage } from '@/context/LanguageContext';
import { useDictionary } from '@/hooks/useDictionary';
import { useEffect } from 'react';
import { BackHandler, Linking, StyleSheet, Text, View } from 'react-native';

export function UpdateRequiredScreen() {
  const dict = useDictionary();
  const { language } = useLanguage();
  const { currentVersion, latestVersion, messageFa, messagePs, downloadUrl } = useAppVersion();

  // بی‌اثرکردنِ دکمه‌ی بازگشتِ سخت‌افزاریِ اندروید — بدونِ این، کاربر می‌توانست با زدنِ دکمه‌ی
  // Back گوشی (نه دکمه‌ای داخلِ خودِ اپ) از این صفحه فرار کند و مستقیم به تبِ خانه برسد.
  // بازگرداندنِ true یعنی «من خودم این رویداد را مدیریت کردم، رفتارِ پیش‌فرض اجرا نشود».
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const customMessage = language === 'ps' ? messagePs : messageFa;
  const message = customMessage || dict.appUpdate.requiredDefaultMessage;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icons.Download size={40} color={Colors.primary} />
      </View>

      <Text style={styles.title}>{dict.appUpdate.requiredTitle}</Text>
      <Text style={styles.message}>{message}</Text>

      {latestVersion && (
        <View style={styles.versionBox}>
          <View style={styles.versionLine}>
            <Text style={styles.versionLabel}>{dict.appUpdate.currentVersionLabel}</Text>
            <Text style={styles.versionValue}>{currentVersion}</Text>
          </View>
          <View style={styles.versionLine}>
            <Text style={styles.versionLabel}>{dict.appUpdate.latestVersionLabel}</Text>
            <Text style={styles.versionValueHighlight}>{latestVersion}</Text>
          </View>
        </View>
      )}

      <Button
        title={dict.appUpdate.updateButton}
        onPress={() => Linking.openURL(downloadUrl)}
        style={styles.updateButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  versionBox: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    width: '100%',
    maxWidth: 280,
  },
  versionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  versionLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  versionValue: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  versionValueHighlight: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  updateButton: {
    marginTop: Spacing.xl,
    width: '100%',
    maxWidth: 320,
  },
});