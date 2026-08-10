// مسیر فایل: lib/appVersion/compareVersions.ts
// 🆕 سیستم تازه‌ی «کنترلِ نسخه‌ی اپ از دیتابیس» — طبق درخواست صریح کارفرما: دو حالت، «آپدیت
// اجباری» و «آپدیت اختیاری»، هردو کنترل‌شده از یک ردیفِ ساده در Supabase.
//
// چرا یک تابعِ مقایسه‌ی جداگانه لازم بود (نه فقط `a === b` یا `a > b`): نسخه‌ها به‌صورتِ رشته‌ی
// «X.Y.Z» ذخیره می‌شوند (همان چیزی که در app.json (فیلدِ expo.version) و در استورها/صفحه‌ی
// دانلود به کاربر نشان داده می‌شود). مقایسه‌ی رشته‌ای ساده (`"1.9.0" > "1.10.0"`) اشتباه است —
// چون به‌صورتِ الفبایی مقایسه می‌کند و نتیجه‌ی غلط می‌دهد (رشته‌ی "1.9.0" الفبایی از "1.10.0"
// بزرگ‌تر است، چون کاراکترِ '9' از '1' بزرگ‌تر است — دقیقاً یک باگِ رایج و پنهان در پیاده‌سازیِ
// ساده‌لوحانه‌ی این قابلیت). این تابع هر بخش را جدا، به‌صورتِ عددی، مقایسه می‌کند.
//
// همین تابع هم برای نسخه‌های ساده‌ی «فقط یک عدد» (مثلاً کارفرما فقط بنویسد "1"، بعداً "2") هم
// برای نسخه‌های کامل‌ترِ سه‌بخشی ("1.2.0") درست کار می‌کند — چون بخش‌های ناموجود پیش‌فرضِ صفر
// می‌گیرند (پس "2" با "2.0.0" کاملاً برابر شمرده می‌شود).
export function compareVersions(a: string, b: string): number {
  const partsA = a.trim().split('.').map((n) => parseInt(n, 10) || 0);
  const partsB = b.trim().split('.').map((n) => parseInt(n, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA !== numB) return numA - numB;
  }
  return 0;
}

// true یعنی نسخه‌ی نصب‌شده (installed) قدیمی‌تر از آخرین نسخه‌ی منتشرشده (latest) است.
export function isVersionOutdated(installed: string, latest: string): boolean {
  return compareVersions(installed, latest) < 0;
}