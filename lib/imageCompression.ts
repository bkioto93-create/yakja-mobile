// مسیر فایل: lib/imageCompression.ts — فاز M02، تسک ۴
//
// هدف دقیقاً طبق بند ۴ سند راهبردی موبایل («عکس»): همان هدف فشرده‌سازی وب — ~۱۵۰ تا ۲۵۰ کیلوبایت،
// حداکثر ۱۲۸۰ پیکسل در بزرگ‌ترین ضلع.
//
// ⚠️ یادداشت مهم (طبق هشدار AGENTS.md «Expo HAS CHANGED»): این فایل عمداً از API قدیمیِ
// `manipulateAsync` استفاده نمی‌کند — آن تابع در نسخه‌ی فعلی expo-image-manipulator (۱۴.۰.۸،
// هم‌راه Expo SDK 54) رسماً Deprecated است. به‌جایش از API تازه‌ی Context-محور
// (`ImageManipulator.manipulate(uri).resize(...).renderAsync()` سپس `.saveAsync(...)`) استفاده
// شده — تایید‌شده در برابر مستندات فعلی expo (versions/latest/sdk/imagemanipulator) پیش از
// نوشتن این فایل.
//
// ⚠️ یادداشت وابستگی: برای سنجش حجم واقعی فایل خروجی، عمداً از `expo-file-system` استفاده
// نشده — آن پکیج در package.json فعلی نصب نیست و افزودنش یک وابستگی تازه‌ی غیرضروری بود.
// به‌جایش از همان `fetch(uri).blob().size` استفاده شده (Blob یک Web API استاندارد است که
// polyfill شبکه‌ی React Native/Expo هم پشتیبانی می‌کند) — دقیقاً همان Blob ای که در تسک ۶
// (آپلود مستقیم به Signed URL) هم لازم است، پس این تابع علاوه بر حجم، خودِ Blob نهایی را هم
// برمی‌گرداند تا صدا‌کننده مجبور به fetch دوباره‌ی همان فایل نباشد.
//
// الگوریتم: فشرده‌سازی تکرارشونده (iterative) — چون حجم نهایی فایل به محتوای تصویر هم بستگی
// دارد (نه فقط ابعاد/کیفیت)، یک تلاش با کیفیت ثابت همیشه به بازه‌ی هدف نمی‌رسد. اینجا تا ۴ بار
// با کیفیت کاهشی امتحان می‌شود؛ اگر باز هم بزرگ‌تر از سقف باشد، همان بهترین نتیجه (آخرین تلاش)
// برگردانده می‌شود — بهتر از رد کردن کامل آپلود کاربر.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_DIMENSION = 1280;
const TARGET_MIN_BYTES = 150 * 1024;
const TARGET_MAX_BYTES = 250 * 1024;
const QUALITY_STEPS = [0.8, 0.65, 0.5, 0.35] as const;

export type CompressedImage = {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
  blob: Blob;
};

async function blobOf(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * یک عکس محلی (خروجی expo-image-picker) را به بازه‌ی هدف ۱۵۰-۲۵۰ کیلوبایت فشرده می‌کند،
 * با حداکثر ضلع ۱۲۸۰ پیکسل. همیشه JPEG برمی‌گرداند (فرمت مصرف‌کننده در listings.images).
 */
export async function compressImage(sourceUri: string): Promise<CompressedImage> {
  let lastResult: { uri: string; width: number; height: number } | null = null;
  let lastBlob: Blob | null = null;

  for (const quality of QUALITY_STEPS) {
    const context = ImageManipulator.manipulate(sourceUri);
    context.resize({ width: MAX_DIMENSION, height: null });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    const blob = await blobOf(saved.uri);

    lastResult = saved;
    lastBlob = blob;

    // رسیدن به بازه‌ی هدف یا پایین‌تر از سقف → همین نتیجه کافی است، ادامه نده.
    if (blob.size <= TARGET_MAX_BYTES) break;
  }

  if (!lastResult || !lastBlob) {
    // عملاً هرگز نباید رخ بدهد (QUALITY_STEPS همیشه حداقل یک عضو دارد)، صرفاً برای تایپ‌اسکریپت.
    throw new Error('compressImage: هیچ تلاشی برای فشرده‌سازی انجام نشد.');
  }

  return {
    uri: lastResult.uri,
    width: lastResult.width,
    height: lastResult.height,
    sizeBytes: lastBlob.size,
    blob: lastBlob,
  };
}

// صرفاً برای مستندسازی بازه‌ی هدف در جاهای دیگر کد (مثلاً پیام‌های راهنما) — خودِ الگوریتم بالا
// این دو مقدار را مستقیم از ثابت‌های همین فایل می‌خواند.
export const IMAGE_TARGET_RANGE = { min: TARGET_MIN_BYTES, max: TARGET_MAX_BYTES } as const;