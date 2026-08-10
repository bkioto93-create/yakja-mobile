// مسیر فایل: lib/cache.ts — فاز M07، تسک ۱
//
// ابزار عمومیِ ذخیره‌سازی محلی (کش) — پایه‌ی «کش محلی نتایج آخرین جستجو/فهرست هر ماژول» (متن
// دقیق تسک). با AsyncStorage نوشته شده (نه SecureStore، که فقط برای داده‌ی حساس مثل توکن نشست،
// در lib/session.ts، به‌کار رفته — نتایج فهرست‌ها هیچ داده‌ی حساسی ندارند و AsyncStorage سریع‌تر
// و بدون محدودیت اندازه‌ی SecureStore است).
//
// عمداً خیلی ساده و عمومی نگه داشته شد (فقط get/set رشته‌ای JSON) — نه یک لایه‌ی کش پیچیده با
// TTL/invalidation خودکار: طبق متن دقیق تسک، هدف فقط «نمایش فوری در باز شدن مجدد اپ» است؛ خودِ
// صفحه (مصرف‌کننده) مسئول است که نتیجه‌ی کش را همیشه با یک درخواست شبکه‌ی تازه جایگزین کند (نه
// این فایل) — دقیقاً همان الگویی که در هر ۴ صفحه‌ی فهرست پیاده شد (نگاه کنید به کامنت‌های
// «تسک ۱ فاز M07» در app/(tabs)/listings.tsx و مشابه‌هایش).
//
// شکست خواندن/نوشتن (فضای ذخیره‌سازی پر، داده‌ی خراب و…) هرگز نباید هیچ صفحه‌ای را مختل کند — چون
// کش فقط یک بهینه‌سازی تجربه‌ی کاربری است، نه منبع حقیقتِ داده؛ به همین دلیل هر دو تابع پایین
// خطا را می‌بلعند (نه throw می‌کنند) و ساده fallback به «چیزی کش نشده بود» می‌کنند.
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'yakja:cache:';

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // ذخیره‌سازی محلی صرفاً یک بهینه‌سازی است؛ شکست آن نباید تجربه‌ی کاربر را مختل کند.
  }
}