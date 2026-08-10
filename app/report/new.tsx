// مسیر فایل: app/report/new.tsx — معادل /report/new وب — فاز M06، تسک ۲
//
// فرم واقعیِ ثبت گزارش تخلف، جایگزینِ کاملِ PlaceholderScreen موقتِ M02/M03/M04/M05. دقیقاً
// هم‌الگو با src/app/[lang]/report/new/page.tsx + NewReportForm.tsx وب: یک فرم تک‌صفحه‌ای ساده
// (نه Wizard/Stepper، چون تعداد فیلدها کم است و هیچ آپلود عکسی در کار نیست) — دقیقاً هم‌رویکرد با
// app/services/provider.tsx (فاز M04).
//
// targetType/targetId از پارامترهای مسیر خوانده می‌شوند (که تمام ۴ محل «گزارش تخلف» — کارت کالا،
// راننده، متخصص، ملک — از قبل، در فازهای M02 تا M05، با router.push({pathname:'/report/new',
// params:{targetType, targetId}}) می‌فرستند؛ همین تسک آن سیم‌کشیِ از-قبل-آماده را به یک فرم واقعی
// وصل می‌کند). اگر نامعتبر/ناقص بودند، دقیقاً هم‌الگو با صفحه‌ی وب، یک کارت «درخواست نامعتبر»
// به‌جای فرم نشان داده می‌شود.
//
// ترتیب حالت‌ها (دقیقاً هم‌الگو با ReportGate وب): هدف نامعتبر → مهمان (LoginRequiredCard) →
// فرم → موفقیت. برخلاف فرم‌های پروفایل (که موفقیت را با بازگشت به فهرست نشان می‌دهند)، اینجا پس
// از ثبت موفق به‌جای فرم یک کارت «تشکر/ثبت شد» جایگزین می‌شود — چون ثبت گزارش یک اقدام
// یک‌بارمصرف است؛ نمایش دوباره‌ی فرم خالی می‌توانست باعث ارسال تصادفی گزارش تکراری شود.
//
// انتخابگر دلیل از همان کامپوننت مشترک CategoryPicker استفاده کرد (نه گرید سفارشی) — چون
// REPORT_REASONS دقیقاً شکل {id, dictKey, icon} را دارد (lib/reports/reasons.ts، از قبل کپی‌شده
// در فاز M00)، عیناً هم‌الگو با انتخابگر نوع ملک (فاز M05) و برخلاف انتخابگر تخصص پویا (فاز M04).
//
// هیچ کلید دیکشنری تازه‌ای لازم نبود — dict.reports.newPage از قبل، از فاز M00، کامل بود.
import { LoginRequiredCard } from '@/components/LoginRequiredCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { Icons } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { createReport, ReportApiError } from '@/lib/reports/mutations';
import { REPORT_REASONS, ReportReason } from '@/lib/reports/reasons';
import { isValidReportTargetType, ReportTargetType } from '@/lib/reports/reportTargets';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewReportScreen() {
  const dict = useDictionary();
  const pageDict = dict.reports.newPage;
  const reasonsDict = pageDict.reasons as Record<string, string>;
  const errorsDict = pageDict.errors as Record<string, string>;
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { targetType, targetId } = useLocalSearchParams<{ targetType?: string; targetId?: string }>();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ آخرین آیتمِ صفحه زیرِ نوار ناوبریِ سیستمیِ اندروید.
  const insets = useSafeAreaInsets();

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isValidTarget = !!targetType && !!targetId && isValidReportTargetType(targetType);

  if (!isValidTarget) {
    return (
      <>
        <Stack.Screen options={{ title: pageDict.title }} />
        <View style={styles.centered}>
          <Card style={styles.stateCard}>
            <View style={styles.stateIconWrap}>
              <Icons.Flag size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.stateTitle}>{pageDict.title}</Text>
            <Text style={styles.stateDesc}>{pageDict.invalidTargetDesc}</Text>
            <Button
              title={pageDict.backButton}
              variant="secondary"
              onPress={() => router.replace('/')}
              style={styles.stateButton}
            />
          </Card>
        </View>
      </>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: pageDict.title }} />
        <LoginRequiredCard
          title={pageDict.loginRequiredTitle}
          description={pageDict.loginRequiredDesc}
          buttonLabel={pageDict.loginRequiredButton}
        />
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Stack.Screen options={{ title: pageDict.title }} />
        <View style={styles.centered}>
          <Card style={styles.stateCard}>
            <View style={[styles.stateIconWrap, styles.successIconWrap]}>
              <Icons.CheckCircle size={32} color={Colors.primary} />
            </View>
            <Text style={styles.stateTitle}>{pageDict.successTitle}</Text>
            <Text style={styles.stateDesc}>{pageDict.successDesc}</Text>
            <Button
              title={pageDict.successButton}
              onPress={() => router.replace('/')}
              style={styles.stateButton}
            />
          </Card>
        </View>
      </>
    );
  }

  const handleSubmit = async () => {
    if (!reason) {
      setSubmitError(errorsDict.invalidReason);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await createReport({
        targetType: targetType as ReportTargetType,
        targetId: targetId as string,
        reason,
        description: description.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      const code = err instanceof ReportApiError ? err.code : 'generic';
      setSubmitError(errorsDict[code] ?? errorsDict.generic);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: pageDict.title }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Text style={styles.subtitle}>{pageDict.subtitle}</Text>

        <Text style={styles.sectionTitle}>{pageDict.reasonSectionTitle}</Text>
        <CategoryPicker items={REPORT_REASONS} labels={reasonsDict} value={reason} onChange={setReason} />

        <Card style={styles.card}>
          <Input
            label={pageDict.descriptionLabel}
            placeholder={pageDict.descriptionPlaceholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.multilineInput}
          />
        </Card>

        <Card style={styles.noticeCard}>
          <Icons.InfoCircle size={18} color={Colors.textMuted} />
          <Text style={styles.noticeText}>{pageDict.noPunitiveNotice}</Text>
        </Card>

        {submitError && <Text style={styles.submitError}>{submitError}</Text>}

        <Button
          title={submitting ? dict.common.loading : pageDict.submitButton}
          onPress={handleSubmit}
          disabled={submitting || !reason}
          style={styles.submitButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
  },
  stateCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: 360,
    width: '100%',
  },
  stateIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconWrap: {
    backgroundColor: '#ecfeff',
  },
  stateTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  card: {
    gap: Spacing.md,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.bgBase,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  submitError: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.danger,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
});