// مسیر فایل: components/DisclaimerModal.tsx
// تسک ۷ فاز M00B — معادل موبایلیِ DisclaimerModal.tsx وب.
//
// رفتار مطابق دقیق متن تسک: «نمایش یک‌باره، تایید ذخیره‌شده در expo-secure-store/AsyncStorage».
// از expo-secure-store استفاده شد (نه AsyncStorage)، چون این پکیج از تسک ۶ فاز M00 از قبل نصب
// است و context/LanguageContext.tsx هم دقیقاً همین روش را برای همین منظور (ذخیره‌ی یک انتخاب
// ساده و بادوام کاربر) به کار برده — یکدست نگه‌داشتن الگوی Storage در کل اپ.
//
// متن از dict.disclaimer خوانده می‌شود (طبق الزام قطعی ۲) — همان کلیدهایی که در دیکشنری فارسی/
// پشتو از قبل موجودند: title / message / acknowledgeButton.
//
// این کامپوننت باید فقط یک‌بار، در ریشه‌ی اپ (app/_layout.tsx) و داخل LanguageProvider/
// ToastProvider رندر شود — دقیقاً هم‌الگو با نحوه‌ی قرارگیری ToastProvider (تسک ۱ همین فاز).
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from './ui/Button';

const DISCLAIMER_ACK_KEY = 'yakja_disclaimer_ack';

export function DisclaimerModal() {
  const dict = useDictionary();
  // isChecked: هنوز معلوم نیست تایید قبلی ثبت شده یا نه (در حال خواندن از SecureStore).
  // تا این مرحله هیچ‌چیز رندر نمی‌شود، تا یک لحظه فلاش نادرست مودال روی صفحه دیده نشود.
  const [isChecked, setIsChecked] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(DISCLAIMER_ACK_KEY).then((ack) => {
      if (cancelled) return;
      setVisible(ack !== 'true');
      setIsChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const acknowledge = () => {
    setVisible(false);
    SecureStore.setItemAsync(DISCLAIMER_ACK_KEY, 'true');
  };

  if (!isChecked || !visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // عمداً بدون راه بستن دیگر (نه دکمه‌ی بستن، نه بک‌گراند قابل‌لمس) — تایید صریح کاربر
      // با دکمه‌ی «متوجه شدم» تنها راه بستن این مودال است، طبق متن دقیق تسک.
      onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{dict.disclaimer.title}</Text>
          <Text style={styles.message}>{dict.disclaimer.message}</Text>
          <Button title={dict.disclaimer.acknowledgeButton} onPress={acknowledge} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
});
