// مسیر فایل: lib/exchangeRates/api.ts
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، بخش «اسعار») — لایه‌ی خواندنِ نرخ ارز برای صفحه‌ی
// اصلیِ موبایل.
//
// **مسیرِ داده:** برخلاف بیشترِ «مسیرِ اول»های این پروژه (که مستقیماً با Anon Key یک تابعِ RPC
// عمومی صدا می‌زنند)، اینجا یک تفاوتِ خوش‌شانس وجود دارد: خودِ وب از قبل یک Route عمومیِ
// آماده‌ی مصرف دارد — `GET /api/exchange-rates` (src/app/api/exchange-rates/route.ts؛ رجوع کنید
// به کامنتِ بالای آن فایل: «بدون نیاز به احراز هویت، چون این داده‌ی کاملاً عمومی است»). یعنی
// هیچ Route تازه‌ای در ریپازیتوری وب لازم نیست — این تابع فقط همان مسیرِ موجود را با apiFetch
// (که به هر حال هدرِ Authorization را فقط *اگر* توکنی موجود باشد اضافه می‌کند؛ نبودش برای این
// Route عمومی هیچ مشکلی ایجاد نمی‌کند) صدا می‌زند.
//
// **کش:** خودِ Route وب از unstable_cache سه‌دقیقه‌ای استفاده می‌کند (getExchangeRatesForHome)،
// پس این تابع نیازی به کشِ جداگانه‌ی سمتِ کلاینت ندارد — هر بار صفحه‌ی اصلی mount شود، یک
// درخواستِ سبک به همان نتیجه‌ی از-قبل-کش‌شده‌ی سرور می‌رود.
import { apiFetch } from '@/lib/session';

export type ExchangeRateRow = {
  code: string;
  nameFa: string;
  namePs: string;
  flag: string;
  buy: number;
  sell: number;
  changePercent: number;
  perUnit: 1 | 1000;
};

export type ExchangeRatesResult = {
  rates: ExchangeRateRow[];
  updatedAt: string | null;
};

const EMPTY_RESULT: ExchangeRatesResult = { rates: [], updatedAt: null };

/**
 * نرخ‌های ارز را از پل موبایل می‌خواند. هرگز throw نمی‌کند — هر خطای شبکه/سرور به یک نتیجه‌ی
 * خالی تبدیل می‌شود (دقیقاً هم‌رفتار با getExchangeRatesForHome وب برای جدولِ خالی: کل بخش باید
 * بی‌صدا مخفی شود، نه یک خطای خام روی صفحه‌ی اصلی نشان بدهد).
 */
export async function getExchangeRates(): Promise<ExchangeRatesResult> {
  try {
    const res = await apiFetch('/api/exchange-rates');
    if (!res.ok) return EMPTY_RESULT;
    const data = await res.json();
    if (!Array.isArray(data?.rates)) return EMPTY_RESULT;
    return { rates: data.rates, updatedAt: data.updatedAt ?? null };
  } catch {
    return EMPTY_RESULT;
  }
}