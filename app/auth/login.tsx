// مسیر فایل: app/auth/login.tsx — معادل /auth/login وب — فاز M01، تسک ۷ (نسخه‌ی واقعی)
//
// جریان: کاربر شماره موبایل را وارد می‌کند → POST /api/mobile/v1/auth/request-otp (بخش الف،
// تسک ۲، از قبل تکمیل و تست‌شده در ریپازیتوری وب) → در صورت موفقیت، به app/auth/verify.tsx با
// همان شماره‌ی نرمال‌شده هدایت می‌شود. اعتبارسنجی اولیه‌ی فرمت شماره با lib/phone.ts (فاز M00،
// تک‌نقطه‌ی حقیقت مشترک با وب) پیش از هر تماس شبکه انجام می‌شود — دقیقاً هم‌رفتار با وب: شماره‌ی
// بدفرمت اصلاً به سرور فرستاده نمی‌شود.
//
// پیام‌های خطا از dict.auth.errors خوانده می‌شوند (از فاز M00 در دیکشنری موجودند)؛ کدهای خطای
// این Route طبق یادداشت تسک ۲ فاز M01 (بخش الف): invalidPhone / cooldown / rateLimited / dbError.
// دو موردِ cooldown/rateLimited یک placeholder «{seconds}» در متن دارند که اینجا با
// retryAfterSeconds واقعی پاسخ سرور جایگزین می‌شود — دقیقاً همان الگوی جایگزینی متن که
// components/ui/Wizard.tsx برای dict.common.stepOf استفاده می‌کند.
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { normalizeAfghanPhone } from '@/lib/phone';
import { apiFetch } from '@/lib/session';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RequestOtpResponse =
  | { success: true; phoneNumber: string }
  | { success: false; error: string; retryAfterSeconds?: number };

export default function LoginScreen() {
  const dict = useDictionary();
  const router = useRouter();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ دکمه‌ی «ادامه» زیرِ نوار ناوبریِ سیستمیِ اندروید وقتی کیبورد بسته است.
  const insets = useSafeAreaInsets();

  const [rawPhone, setRawPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const errorText = (errCode: string, retryAfterSeconds?: number) => {
    const base = (dict.auth.errors as Record<string, string>)[errCode] ?? dict.auth.errors.generic;
    return typeof retryAfterSeconds === 'number'
      ? base.replace('{seconds}', String(retryAfterSeconds))
      : base;
  };

  const submit = async () => {
    const normalized = normalizeAfghanPhone(rawPhone);
    if (!normalized) {
      setError(dict.auth.errors.invalidPhone);
      return;
    }

    setError(null);
    setSending(true);
    try {
      const res = await apiFetch('/api/mobile/v1/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: normalized }),
      });
      const data: RequestOtpResponse = await res.json();

      if (data.success) {
        router.push({ pathname: '/auth/verify', params: { phoneNumber: data.phoneNumber } });
      } else {
        setError(errorText(data.error, data.retryAfterSeconds));
      }
    } catch {
      setError(dict.auth.errors.dbError);
    } finally {
      setSending(false);
    }
  };

  const canSubmit = rawPhone.trim().length > 0 && !sending;

  return (
    <>
      <Stack.Screen options={{ title: dict.auth.login.title }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{dict.auth.login.title}</Text>
          <Text style={styles.subtitle}>{dict.auth.login.subtitle}</Text>

          <Input
            label={dict.auth.login.phoneLabel}
            placeholder={dict.auth.login.phonePlaceholder}
            value={rawPhone}
            onChangeText={(t) => {
              setRawPhone(t);
              if (error) setError(null);
            }}
            keyboardType="phone-pad"
            autoFocus
            error={error ?? undefined}
          />

          <Button
            title={sending ? dict.auth.login.sending : dict.auth.login.submit}
            onPress={submit}
            disabled={!canSubmit}
            style={[!canSubmit && styles.disabled]}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
});