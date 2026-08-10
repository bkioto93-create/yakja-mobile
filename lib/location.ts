// مسیر فایل: lib/location.ts — فاز M03، تسک ۶: مدیریت مجوز GPS اندروید (درخواست صریح + پیام راهنما در صورت رد)
//
// تا پیش از این تسک، هر سه محل مصرف موقعیت مکانی (app/(tabs)/listings.tsx فاز M02، و
// app/(tabs)/transport.tsx + app/transport/driver.tsx فاز M03) مستقیماً و جداگانه
// Location.requestForegroundPermissionsAsync() را صدا می‌زدند و فقط یک حالت «رد شد» را تشخیص
// می‌دادند — بدون هیچ تفاوتی بین «کاربر فقط همین یک‌بار رد کرد (هنوز می‌توان دوباره از او
// پرسید)» و «کاربر با انتخاب "دیگر نشان نده" رد کرد (اندروید دیگر هرگز پنجره‌ی سیستمی را دوباره
// نشان نمی‌دهد؛ تنها راه، هدایت دستی کاربر به تنظیمات گوشی است)». طبق چک‌لیست فاز M03
// («۱. فهرست رانندگان فعال... این نسخه عمداً بدون... مدیریت دقیق مجوز GPS با پیام راهنمای رد
// (تسک ۶)»)، همین تفاوت دقیقاً موضوع همین تسک است.
//
// این فایل فقط دامنه‌ی تسک ۶ (ماژول حمل‌ونقل، فاز M03) را پوشش می‌دهد — یعنی توسط
// app/(tabs)/transport.tsx و app/transport/driver.tsx مصرف می‌شود. app/listings/(tabs).tsx
// (فاز M02، از قبل تیک‌خورده) عمداً دست‌نخورده ماند تا از تغییر یک فاز از‌پیش‌تحویل‌شده
// جلوگیری شود؛ همان محدودیت قدیمی (پیام عمومی «دسترسی ممکن نشد»، بدون دکمه‌ی تنظیمات) آنجا
// باقی می‌ماند — در صورت نیاز، یکسان‌سازی آن یک تسک جداگانه‌ی آینده خواهد بود.
import * as Location from 'expo-location';

// چهار وضعیت ممکن، دقیقاً به همان ترتیبی که باید در رابط کاربری مدیریت شوند:
//   'granted'          → مجوز داده شد؛ می‌توان بلافاصله getCurrentPositionAsync را صدا زد.
//   'deniedRetry'      → کاربر رد کرد، ولی اندروید هنوز اجازه‌ی نمایش دوباره‌ی پنجره‌ی سیستمی را
//                        می‌دهد (canAskAgain=true) — دفعه‌ی بعد که کاربر همان دکمه را بزند،
//                        دوباره خودِ پنجره‌ی سیستمی سؤال می‌کند؛ نیازی به هدایت به تنظیمات نیست.
//   'deniedBlocked'    → کاربر با گزینه‌ی «دیگر نشان نده»/«Don't ask again» رد کرده
//                        (canAskAgain=false) — از این پس requestForegroundPermissionsAsync
//                        همیشه بی‌صدا 'denied' برمی‌گرداند، بدون نمایش هیچ پنجره‌ای؛ تنها راه
//                        واقعی، دکمه‌ی راهنما به سمت تنظیمات گوشی (openLocationSettings) است.
//   'servicesDisabled' → سرویس موقعیت مکانی (GPS) کلِ گوشی خاموش است — جدا از مجوز خودِ اپ؛ اینجا
//                        هم تنها راه، هدایت کاربر به تنظیمات (این‌بار تنظیمات سیستمی GPS) است.
export type LocationAccessStatus = 'granted' | 'deniedRetry' | 'deniedBlocked' | 'servicesDisabled';

// درخواست صریح مجوز GPS + تشخیص دقیق نوع رد شدن. هیچ‌جای این تابع خودش getCurrentPositionAsync
// را صدا نمی‌زند — گرفتن مختصات واقعی (و محافظ withTimeout ۸ ثانیه‌ای در برابر باگ شناخته‌شده‌ی
// expo-location روی برخی گوشی‌های اندرویدی) هم‌چنان مسئولیت خودِ فراخواننده می‌ماند، دقیقاً مثل
// قبل — این تابع فقط بخش «مجوز» را یکدست و دقیق می‌کند.
export async function requestLocationAccess(): Promise<LocationAccessStatus> {
  // ابتدا بررسی می‌شود که سرویس موقعیت مکانی گوشی اصلاً روشن است یا نه — جدا از مجوز خودِ اپ؛
  // دقیقاً همان بررسی‌ای که پیش از این فقط داخل app/transport/driver.tsx (تسک ۵) وجود داشت.
  let servicesEnabled = true;
  try {
    servicesEnabled = await Location.hasServicesEnabledAsync();
  } catch {
    // در صورت خطای خودِ بررسی، ادامه بده و بگذار خودِ درخواست مجوز مشخص کند — سخت‌گیرانه‌تر
    // رفتار کردن اینجا (مثلاً فرض «خاموش است») فقط باعث پیام گمراه‌کننده به کاربری می‌شود که
    // شاید GPS‌اش کاملاً روشن است.
    servicesEnabled = true;
  }
  if (!servicesEnabled) {
    return 'servicesDisabled';
  }

  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    return 'granted';
  }
  return canAskAgain ? 'deniedRetry' : 'deniedBlocked';
}
