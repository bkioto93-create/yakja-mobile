// مسیر فایل: app/auth/verify.tsx — معادل /auth/verify وب — فاز M01، تسک ۸ (نسخه‌ی واقعی)
//
// دریافت کد ۶ رقمی OTP و تایید آن → POST /api/mobile/v1/auth/verify-otp (بخش الف، تسک ۳، از قبل
// تکمیل‌شده). در صورت موفقیت، AuthContext.login(token) هم توکن را در expo-secure-store ذخیره
// می‌کند و هم بلافاصله پروفایل کامل کاربر را (از همان GET /api/mobile/v1/profile) می‌خواند؛
// سپس کاربر به تب پروفایل هدایت می‌شود.
//
// «ارسال دوباره‌ی کد»: تایمر معکوس ۶۰ ثانیه‌ای، دقیقاً هم‌رفتار با پیام‌های
// dict.auth.verify.resend / resendIn (که از فاز M00 در دیکشنری موجودند). بعد از پایان تایمر،
// همان Route درخواست کد (request-otp) دوباره صدا زده می‌شود؛ اگر سرور با retryAfterSeconds
// (کد rateLimited/cooldown) پاسخ بدهد، تایمر با همان مقدار واقعی از سرور دوباره تنظیم می‌شود.
//
// تصمیم مستندشده‌ی مسیر بازگشت بعد از ورود موفق: این تسک، بخشی از فاز M01 است — یعنی هنوز هیچ
// صفحه‌ای در M02 تا M06 «ورود لازم است» را با هدایت به اینجا فعال نکرده (آن سیم‌کشی، تسک هر فاز
// خودش است، طبق کلیدهای loginRequiredTitle/Desc/Button که از قبل در دیکشنری هر ماژول موجودند).
// پس مقصد پیش‌فرض بعد از ورود موفق، همیشه تب پروفایل است (router.replace('/(tabs)/profile'))
// — ساده‌ترین و امن‌ترین گزینه‌ی همین فاز. وقتی فازهای بعدی این صفحه را از یک اقدام محدودشده
// (مثلاً «ثبت آگهی») باز کنند، آن‌ها می‌توانند به‌جای این خط، از router.back() چندباره یا یک
// پارامتر «returnTo» استفاده کنند — بدون نیاز به تغییر منطق اصلی همین فایل.
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useDictionary } from '@/hooks/useDictionary';
import { apiFetch } from '@/lib/session';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESEND_COOLDOWN_SECONDS = 60;

type VerifyOtpResponse =
  | { success: true; token: string; role: 'user' | 'admin' }
  | { success: false; error: string };

type RequestOtpResponse =
  | { success: true; phoneNumber: string }
  | { success: false; error: string; retryAfterSeconds?: number };

export default function VerifyScreen() {
  const dict = useDictionary();
  const { language } = useLanguage();
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ دکمه‌ی «تایید» زیرِ نوار ناوبریِ سیستمیِ اندروید وقتی کیبورد بسته است.
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // اگر این صفحه بدون شماره‌ی موبایل باز شود (مثلاً لینک عمیق دستی)، معادل معتبری برای تایید
  // وجود ندارد — کاربر را به همان صفحه‌ی ورود برمی‌گردانیم که ابتدا شماره‌اش را بدهد.
  useEffect(() => {
    if (!phoneNumber) {
      router.replace('/auth/login');
    }
  }, [phoneNumber, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const errorText = (errCode: string) =>
    (dict.auth.errors as Record<string, string>)[errCode] ?? dict.auth.errors.generic;

  const submit = async () => {
    if (!phoneNumber || code.trim().length === 0) return;

    setError(null);
    setVerifying(true);
    try {
      const res = await apiFetch('/api/mobile/v1/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, code: code.trim(), language }),
      });
      const data: VerifyOtpResponse = await res.json();

      if (data.success) {
        await login(data.token);
        showToast(dict.auth.verify.loginSuccess, 'success');
        router.replace('/(tabs)/profile');
      } else {
        setError(errorText(data.error));
      }
    } catch {
      setError(dict.auth.errors.dbError);
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (!phoneNumber || cooldown > 0 || resending) return;

    setResending(true);
    setError(null);
    try {
      const res = await apiFetch('/api/mobile/v1/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
      const data: RequestOtpResponse = await res.json();

      if (data.success) {
        showToast(dict.auth.verify.codeSent, 'success');
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        const seconds = data.retryAfterSeconds;
        setError(
          typeof seconds === 'number'
            ? errorText(data.error).replace('{seconds}', String(seconds))
            : errorText(data.error)
        );
        // فقط وقتی سرور صریحاً یک زمان انتظار برگردانده (rateLimited/cooldown) تایمر را با آن
        // مقدار واقعی تنظیم می‌کنیم؛ برای بقیه‌ی خطاها (مثلاً dbError) کاربر باید فوراً بتواند
        // دوباره تلاش کند، نه اینکه بی‌دلیل ۶۰ ثانیه دیگر منتظر بماند.
        if (typeof seconds === 'number') setCooldown(seconds);
      }
    } catch {
      setError(dict.auth.errors.dbError);
    } finally {
      setResending(false);
    }
  };

  if (!phoneNumber) return null;

  return (
    <>
      <Stack.Screen options={{ title: dict.auth.verify.title }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{dict.auth.verify.title}</Text>
          <Text style={styles.subtitle}>{dict.auth.verify.subtitle}</Text>

          <Input
            label={dict.auth.verify.codeLabel}
            placeholder={dict.auth.verify.codePlaceholder}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/[^\d]/g, '').slice(0, 6));
              if (error) setError(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            error={error ?? undefined}
          />

          <Button
            title={verifying ? dict.auth.verify.verifying : dict.auth.verify.submit}
            onPress={submit}
            disabled={verifying || code.trim().length === 0}
            style={[(verifying || code.trim().length === 0) && styles.disabled]}
          />

          <View style={styles.footer}>
            <Button
              title={
                cooldown > 0
                  ? dict.auth.verify.resendIn.replace('{seconds}', String(cooldown))
                  : dict.auth.verify.resend
              }
              variant="secondary"
              onPress={resend}
              disabled={cooldown > 0 || resending}
              style={[(cooldown > 0 || resending) && styles.disabled]}
            />
            <Button title={dict.auth.verify.changeNumber} variant="secondary" onPress={() => router.back()} />
          </View>
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
  footer: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
});