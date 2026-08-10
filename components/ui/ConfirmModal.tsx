// مسیر فایل: components/ui/ConfirmModal.tsx
// 🆕 سیستم تازه‌ی «مودال تاییدِ سراسری» — طبق درخواست صریح کارفرما: «هرجا لازمه از کاربر سوالی
// بشه، به هیچ عنوان از پنجره‌ی پیش‌فرض اندروید استفاده نشه؛ خودمون اختصاصی طراحی کنیم، داینامیک
// باشه، برای تمام بخش‌های مورد نیاز استفاده بشه».
//
// **چرا قبلاً چنین چیزی نبود:** تنها جای این پروژه که به تاییدِ کاربر نیاز داشت
// (components/stories/StoryViewer.tsx :: حذفِ استوری) خودش یک UI تاییدِ کامل و زیبا (کارتِ
// سفید، عنوان/توضیح، دو دکمه) از قبل داشت — پس هیچ‌جای این اپ هرگز از Alert.alert بومیِ
// اندروید/iOS استفاده نکرده بود. مشکلِ واقعی این بود که آن UI فقط همان‌جا، به‌صورت محلی و
// یک‌بارمصرف، پیاده‌سازی شده بود — نه یک سیستمِ سراسریِ قابل‌استفاده‌ی مجدد برای هر صفحه‌ی
// دیگری که بعداً به تاییدِ کاربر نیاز پیدا کند (حذف عکس پروفایل، خروج از حساب، لغو یک درخواست،
// و مواردِ مشابهِ آینده).
//
// **طراحی:** یک Provider سراسری (فقط یک‌بار، در ریشه‌ی اپ — app/_layout.tsx) + یک هوکِ
// وعده‌محور (`useConfirm()`) که هر کامپوننتی، از هر عمقی در درخت، می‌تواند صدا بزند:
//
//   const confirm = useConfirm();
//   const ok = await confirm({
//     title: dict.someFeature.deleteConfirmTitle,
//     description: dict.someFeature.deleteConfirmDesc,
//     confirmLabel: dict.someFeature.deleteConfirmYes,
//     cancelLabel: dict.someFeature.deleteConfirmCancel,
//     destructive: true, // دکمه‌ی تایید قرمز؛ برای تاییدهای غیرمخرب (مثلاً «خروج از حساب»)
//                         // false/حذف‌شده بگذارید تا دکمه‌ی تایید رنگِ primary بگیرد.
//   });
//   if (!ok) return;
//   // ادامه‌ی عملیات...
//
// خودِ کامپوننت هیچ متنِ ثابتی ندارد و هیچ dict مخصوصِ خودش لازم ندارد — تمام متن‌ها (عنوان،
// توضیح، برچسبِ دو دکمه) از دیکشنریِ همان صفحه‌ای می‌آید که confirm() را صدا زده؛ یعنی خودکار هم
// برای فارسی هم برای پشتو کار می‌کند، بدون نیاز به هیچ افزودنِ جداگانه‌ای به این فایل.
//
// **چرا React Native Modal (برخلاف پیاده‌سازیِ قبلیِ StoryViewer):** یادداشتِ قبلیِ
// StoryViewer.tsx توضیح داده بود چرا آنجا از Modal بومی استفاده نشد — چون آن کامپوننت خودش از
// قبل یک View تمام‌صفحه‌ی مطلق‌موقعیت‌یافته با zIndex بالا بود، و لایه‌ی رندرِ جداگانه‌ی Modal
// هماهنگ‌کردنِ zIndex را با همان صفحه پیچیده می‌کرد. اینجا فرق دارد: این Provider فقط یک‌بار،
// در ریشه‌ی مطلقِ اپ (بیرون از هر صفحه‌ای) mount می‌شود — پس Modal بومی نه‌تنها مشکلی ایجاد
// نمی‌کند، بلکه دقیقاً همان چیزی است که لازم داریم: تضمینِ رندرشدن همیشه در بالاترین لایه‌ی
// ممکن (پنجره‌ی بومیِ جداگانه‌ی خودِ سیستم‌عامل)، فارغ از این‌که فراخواننده از چه عمقی از درخت
// (حتی از داخلِ خودِ StoryViewer، رجوع کنید به تغییرِ همان فایل) آن را صدا زده — بدون نیاز به
// هیچ محاسبه‌ی دستیِ zIndex.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Spinner } from './Spinner';

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  // true => دکمه‌ی تایید قرمز (برای اقدام‌های مخرب/غیرقابل‌بازگشت مثل حذف). پیش‌فرض false =>
  // دکمه‌ی تایید رنگِ primary (برای تاییدهای خنثی‌تر مثل خروج از حساب).
  destructive?: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

// هوکِ اصلی — هر کامپوننتی که به تاییدِ کاربر نیاز دارد همین یک تابع را صدا می‌زند و منتظرِ
// Promise<boolean> می‌ماند (true = کاربر تایید کرد، false = لغو کرد یا بیرون از کارت لمس کرد).
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm() باید داخل <ConfirmModalProvider> استفاده شود.');
  }
  return ctx.confirm;
}

// باید فقط یک‌بار، در ریشه‌ی اپ (app/_layout.tsx) قرار بگیرد — دقیقاً هم‌الگو با ToastProvider.
export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // برای اقدام‌های async (مثلاً درخواستِ حذفی که چند صد میلی‌ثانیه طول می‌کشد)، فراخواننده پس از
  // resolve=true خودش مسئولِ نمایشِ لودینگِ عملیاتِ واقعی است (این مودال فقط پرسش را نشان
  // می‌دهد، نه پیشرفتِ کاری که بعدش اجرا می‌شود) — پس نیازی به isBusy داخلیِ این کامپوننت نیست؛
  // به‌محضِ لمسِ هرکدام از دو دکمه، مودال بلافاصله بسته می‌شود.
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function handleClose(result: boolean) {
    setOptions(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        visible={options !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => handleClose(false)}>
        {options && (
          <Pressable style={styles.overlay} onPress={() => handleClose(false)}>
            {/* stopPropagation دستی نیست (React Native رویدادها را متفاوت از وب حباب می‌کند)؛
                به‌جایش خودِ کارت یک Pressable جداست که رویدادِ لمس را از رسیدن به overlay بیرونی
                متوقف می‌کند، چون خودش هم یک هدفِ لمسِ معتبر است — دقیقاً هم‌رفتار با
                onPress={(e) => e.stopPropagation()} در نسخه‌ی قبلیِ StoryViewer. */}
            <Pressable style={styles.card} onPress={() => {}}>
              <Text style={styles.title}>{options.title}</Text>
              {options.description && <Text style={styles.desc}>{options.description}</Text>}
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleClose(false)}
                  style={({ pressed }) => [
                    styles.button,
                    styles.cancelButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.cancelText}>{options.cancelLabel}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleClose(true)}
                  style={({ pressed }) => [
                    styles.button,
                    options.destructive ? styles.destructiveButton : styles.primaryButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={options.destructive ? styles.destructiveText : styles.primaryText}>
                    {options.confirmLabel}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

// ابزارِ کوچکِ کمکی برای اقدام‌های async: بعد از دریافتِ تاییدِ کاربر، دکمه‌ی خودِ صفحه‌ی
// فراخواننده (نه این مودال) باید اسپینر نشان بدهد — این کامپوننت فقط برای مستندسازیِ همین الگو
// اینجا export شده، خودِ Spinner از قبل در ./Spinner.tsx تعریف شده و این فایل فقط دوباره
// export اش می‌کند تا فراخواننده‌ها مجبور نباشند دو مسیر جدا import کنند.
export { Spinner as ConfirmModalSpinner };

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
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textMain,
    textAlign: 'center',
  },
  desc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
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
  cancelButton: {
    backgroundColor: Colors.bgBase,
  },
  cancelText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textMain,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.white,
  },
  destructiveButton: {
    backgroundColor: Colors.danger,
  },
  destructiveText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.white,
  },
});