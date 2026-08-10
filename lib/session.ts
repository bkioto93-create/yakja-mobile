// مسیر فایل: lib/session.ts
// مدیریت توکن نشست موبایل — معادل native کوکی httpOnly وب (بند ۵ سند راهبردی موبایل).
//
// 🛠️ به‌روزرسانی فاز M01 (بخش ب): این فایل و تابع apiFetch از قبل، پیش‌تر از تسک‌های ۷/۸/۱۰
// همین فاز، کامل ساخته شده بودند (دقیقاً تسک ۹ — «fetch wrapper مشترک که هدر Authorization را
// خودکار اضافه می‌کند»). منطق apiFetch/getSessionToken/setSessionToken/clearSessionToken حتی
// یک خط هم تغییر نکرده. تنها افزوده‌ی این به‌روزرسانی یک هشدار توسعه (console.warn) پایین‌تر
// است، دقیقاً هم‌الگو با هشدار مشابه در lib/supabase.ts: چون EXPO_PUBLIC_API_BASE_URL در
// .env فعلی پروژه خالی است، بدون این هشدار، هر تماس apiFetch (ورود OTP، پروفایل، خروج) بی‌صدا
// با یک خطای فنی مبهم شکست می‌خورد — این هشدار فقط تجربه‌ی توسعه را روشن‌تر می‌کند، هیچ رفتار
// زمان اجرا برای کاربر نهایی تغییر نکرده.
import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'yakja_session_token';

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

if (!API_BASE_URL) {
  console.warn(
    '⚠️ EXPO_PUBLIC_API_BASE_URL تنظیم نشده — تماس‌های apiFetch (ورود با OTP، پروفایل، خروج از ' +
      'حساب و هر Route دیگر زیر /api/mobile/v1/*) کار نخواهند کرد. آدرس دامنه‌ی همان پروژه‌ی وب ' +
      'یکجا (مثلاً https://yakja.example.com) را در .env تنظیم کنید.'
  );
}

/**
 * fetch wrapper مشترک برای هر تماس با لایه‌ی API موبایل (/api/mobile/v1/*) —
 * هدر Authorization را خودکار اضافه می‌کند. جزئیات کامل: فاز M01 سند نقشه‌راه.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getSessionToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}