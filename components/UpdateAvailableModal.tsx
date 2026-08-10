// مسیر فایل: components/UpdateAvailableModal.tsx
// 🆕 سیستم تازه‌ی «کنترلِ نسخه‌ی اپ از دیتابیس» — سناریوی «آپدیتِ اختیاری» طبق درخواستِ صریحِ
// کارفرما: «فقط عدد تغییر کرده، اجباری نیست — کاربر پیام رو یک بار می‌بینه، اگه رد کرد باید توی
// تنظیمات هم بتونه ببینه». این مودال دقیقاً همان یک‌بار را نشان می‌دهد (وضعیتِ نمایش/عدمِ نمایش
// از AppVersionContext می‌آید، نه یک state محلی — چون آن Context قبلاً منطقِ «آیا کاربر قبلاً
// همین latestVersion را رد کرده» را با SecureStore حل کرده). دکمه‌ی «بعداً» را که بزند،
// dismissSoftPrompt() صدا زده می‌شود و این مودال دیگر برای همین latestVersion دوباره باز
// نمی‌شود؛ ولی وضعیتِ واقعی هم‌چنان در بخشِ «نسخه‌ی برنامه»ی تبِ پروفایل باقی می‌ماند.
//
// از نظرِ ظاهری عمداً هم‌الگو با components/ui/ConfirmModal.tsx (کارتِ سفید، عنوان/توضیح، دو
// دکمه) — تا سراسرِ اپ یک زبانِ بصریِ یکدست برای «مودال‌های تصمیم‌گیری» داشته باشد؛ فقط یک
// آیکونِ برندشده‌ی بالای عنوان اضافه شد چون این یک خبرِ مثبت است («نسخه‌ی تازه‌ای هست!»)، نه یک
// هشدار، پس حس‌وحالِ کمی متفاوت (نه قرمز/مخرب) دارد.
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAppVersion } from '@/context/AppVersionContext';
import { useLanguage } from '@/context/LanguageContext';
import { useDictionary } from '@/hooks/useDictionary';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export function UpdateAvailableModal() {
  const dict = useDictionary();
  const { language } = useLanguage();
  const { showSoftPrompt, latestVersion, messageFa, messagePs, downloadUrl, dismissSoftPrompt } =
    useAppVersion();

  if (!showSoftPrompt) return null;

  const customMessage = language === 'ps' ? messagePs : messageFa;
  const message = customMessage || dict.appUpdate.availableDefaultMessage;

  function handleUpdate() {
    Linking.openURL(downloadUrl);
    dismissSoftPrompt();
  }

  return (
    <Modal
      visible={showSoftPrompt}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissSoftPrompt}>
      <Pressable style={styles.overlay} onPress={dismissSoftPrompt}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.iconWrap}>
            <Icons.Download size={26} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{dict.appUpdate.availableTitle}</Text>
          <Text style={styles.message}>{message}</Text>
          {latestVersion && (
            <Text style={styles.versionText}>
              {dict.appUpdate.latestVersionLabel}: {latestVersion}
            </Text>
          )}
          <View style={styles.actions}>
            <Pressable
              onPress={dismissSoftPrompt}
              style={({ pressed }) => [styles.button, styles.laterButton, pressed && styles.pressed]}>
              <Text style={styles.laterText}>{dict.appUpdate.laterButton}</Text>
            </Pressable>
            <Button
              title={dict.appUpdate.updateButton}
              onPress={handleUpdate}
              style={styles.updateButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11,17,33,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textMain,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  versionText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  laterButton: {
    backgroundColor: Colors.bgBase,
  },
  laterText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textMain,
  },
  updateButton: {
    flex: 1,
  },
});