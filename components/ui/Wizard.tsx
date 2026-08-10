// مسیر فایل: components/ui/Wizard.tsx
// تسک ۳ فاز M00B — کامپوننت مشترک «فرم گام‌به‌گام» (Wizard).
//
// چرا الان و نه در فاز M02: چون این کامپوننت — درست مثل CategoryPicker (تسک ۲) — کاملاً
// محتوا-نا-آگاه (content-agnostic) طراحی شده: فقط مدیریت گام فعلی، نوار پیشرفت، و دکمه‌های
// بازگشت/ادامه/ثبت نهایی را انجام می‌دهد؛ محتوای هر گام (فرم دسته، فرم عکس، فرم قیمت و ...)
// را والد به‌صورت `content` می‌دهد. پس نیازی به دیدن فرم واقعی ویزارد کالا/ملک نبود — دقیقاً
// همان استدلالی که برای تسک ۲ هم صادق بود.
//
// طبق الزام قطعی ۲، متن دکمه‌ها و شمارنده‌ی گام‌ها همیشه از دیکشنری خوانده می‌شود:
// dict.common.back / dict.common.next / dict.common.submit / dict.common.stepOf
// (این ۴ کلید از قبل، از فاز M00، در fa.ts/ps.ts موجودند — نیازی به افزودن کلید تازه نبود).
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';

export type WizardStep = {
  /** شناسه‌ی یکتای گام — فقط برای key لیست، در UI دیده نمی‌شود */
  key: string;
  /** محتوای همان گام (فرم دسته، فرم عکس، فرم قیمت، صفحه‌ی مرور نهایی و ...) */
  content: ReactNode;
  /**
   * آیا کاربر مجاز است از این گام به گام بعد برود؟ پیش‌فرض true.
   * والد باید این مقدار را بر اساس اعتبارسنجی فیلدهای همان گام محاسبه کند
   * (مثلاً: «دسته انتخاب شده؟»، «حداقل ۱ عکس اضافه شده؟»).
   */
  isValid?: boolean;
};

type WizardProps = {
  steps: WizardStep[];
  /** فقط در آخرین گام، با لمس دکمه‌ی نهایی صدا زده می‌شود */
  onSubmit: () => void | Promise<void>;
  /** حالت «در حال ارسال» — روی دکمه‌ی نهایی Spinner نشان می‌دهد و آن را غیرفعال می‌کند */
  submitting?: boolean;
  /** برچسب دکمه‌ی گام آخر؛ اگر ندهید از dict.common.submit استفاده می‌شود */
  submitLabel?: string;
};

export function Wizard({ steps, onSubmit, submitting = false, submitLabel }: WizardProps) {
  const dict = useDictionary();
  const [stepIndex, setStepIndex] = useState(0);
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): چون این نوارِ
  // دکمه‌های بعدی/قبلی همیشه پایینِ صفحه می‌نشیند (نه داخل یک ScrollView)، بدون این padding روی
  // اندروید دقیقاً زیرِ نوار ناوبریِ سیستم قرار می‌گرفت — یعنی مهم‌ترین دکمه‌ی هر گام (ادامه/ثبت
  // نهایی) هم به‌سختی قابل‌لمس بود هم بصری قاطی نوار سیستم به‌نظر می‌رسید. چون این کامپوننت در هر
  // دو ویزارد (ثبت آگهی کالا و ثبت ملک) استفاده می‌شود، همین یک اصلاح هر دو صفحه را حل می‌کند.
  const insets = useSafeAreaInsets();

  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const canGoNext = currentStep.isValid ?? true;

  const goBack = () => {
    if (!isFirstStep) setStepIndex((i) => i - 1);
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (isLastStep) {
      onSubmit();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const progressLabel = dict.common.stepOf
    .replace('{current}', String(stepIndex + 1))
    .replace('{total}', String(steps.length));

  return (
    <View style={styles.container}>
      <View style={styles.progressWrap}>
        <Text style={styles.progressText}>{progressLabel}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((stepIndex + 1) / steps.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.content}>{currentStep.content}</View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing.sm }]}>
        {!isFirstStep && (
          <Button
            title={dict.common.back}
            variant="secondary"
            onPress={goBack}
            disabled={submitting}
            style={styles.backButton}
          />
        )}
        <Button
          title={
            submitting && isLastStep
              ? dict.common.loading
              : isLastStep
                ? submitLabel ?? dict.common.submit
                : dict.common.next
          }
          onPress={goNext}
          disabled={!canGoNext || submitting}
          style={[styles.nextButton, (!canGoNext || submitting) && styles.disabledButton]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressWrap: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  progressText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
});