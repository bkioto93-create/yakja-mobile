// مسیر فایل: lib/services/providerProfile.ts
// 🆕 به‌روزرسانی (فاز ۱۰ موبایل — قابلیت «ولایت»): MyServiceProviderProfile فیلد تازه‌ی province
// گرفت (برای پیش‌پر شدن فرم در حالت ویرایش) و SaveServiceProviderProfilePayload یک فیلد الزامی
// تازه‌ی province گرفت — رجوع کنید به یادداشت کنار همان فیلدها پایین‌تر.
//
// فاز M04، تسک ۳ — فرم پروفایل متخصص، لایه‌ی پل موبایل.
//
// دقیقاً هم‌الگو با lib/transport/mutations.ts (فاز M03، تسک ۳ + ۴ + ۵): طبق بند ۲ و جدول بند ۳
// سند راهبردی موبایل («مسیر دوم: نوشتن/احراز هویت — پشت لایه‌ی نازک Route Handler
// /api/mobile/v1/* در همان پروژه‌ی وب»)، هر سه تابع این فایل به‌جای Server Action مستقیم، یک
// Route HTTP در پل موبایل صدا می‌زنند که خودش دقیقاً همان اکشن‌های از-قبل-نوشته‌شده و تست‌شده‌ی وب
// (src/app/[lang]/services/provider/actions.ts، تسک ۶ فاز ۰۴ وب) را صدا می‌زند — صفر منطق تجاری
// تازه سمت سرور.
//
// تفاوت با ماژول راننده (که چهار Route جدا دارد: پروفایل/آپلود/فعال‌سازی/موقعیت): طبق متن دقیق
// تسک ۳ همین فاز («تخصص، آدرس، توضیح، عکس اختیاری» — بدون سوییچ فعال/غیرفعال، بدون ردیابی خودکار
// موقعیت)، و طبق نقشه‌راه که برای M04 هیچ تسک جداگانه‌ای معادل تسک ۴/۵ فاز M03 ندارد، این فایل
// عمداً فقط دو Route لازم دارد: خودِ پروفایل (GET/POST/PATCH) و آپلود عکس. سوییچ فعال/غیرفعال
// (service_providers.is_active) طبق بند ۷.۵ سند راهبردی وب و طبق متن دقیق تسک ۵ همین فاز
// («بدون سوییچ برای خودِ متخصص») فقط دست ادمین است؛ این فایل هرگز آن را نمی‌نویسد — فقط از طریق
// getMyServiceProviderProfile می‌خواند تا فرم بتواند اعلان «پروفایل پنهان‌شده» را نشان دهد (تسک ۵).
//
// سه Route وبی که این فایل صدا می‌زند:
//   - GET          /api/mobile/v1/services/provider                → همین تسک (۳)، تازه
//   - POST/PATCH   /api/mobile/v1/services/provider                → همین تسک (۳)، تازه
//   - POST         /api/mobile/v1/services/provider/upload-slots   → همین تسک (۳)، تازه
// هر سه Route وب تازه زیر پوشه‌ی جدا web-repo-routes/ تحویل داده شده‌اند (این فایل بخشی از
// پروژه‌ی Expo نیست؛ باید دستی در ریپازیتوری وب Next.js قرار بگیرند — نگاه کنید به یادداشت بالای
// docs/YAKJA_MOBILE_PHASES_ROADMAP.md).
import { compressImage } from '@/lib/imageCompression';
import { apiFetch } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const SERVICE_PROVIDERS_BUCKET = 'service-providers-images';

/** خطای برگشتی از هر سه Route؛ code دقیقاً یکی از کلیدهای dict.services.providerProfile.errors است. */
export class ServicesApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

// شکل پروفایل — دقیقاً هم‌الگو با MyServiceProviderProfile وب
// (src/lib/services/serviceProviderQueries.ts). images همان مسیرهای خامِ Storage است (نه URL
// کامل)؛ تبدیل به URL کامل فقط لحظه‌ی *نمایش* در خودِ صفحه‌ی فرم انجام می‌شود (با
// getServiceProviderImageUrl از lib/services/images.ts) — همان دلیلی که lib/transport/mutations.ts
// هم مسیر خام برمی‌گرداند، نه URL. isActive — تسک ۵: فقط برای نمایشِ اعلانِ صرفاً اطلاع‌رسانی
// «پروفایل پنهان‌شده» خوانده می‌شود؛ این فرم هرگز آن را نمی‌نویسد (بدون سوییچ، طبق متن دقیق تسک ۵).
export type MyServiceProviderProfile = {
  serviceCategoryId: string;
  // فاز ۱۰ موبایل — قابلیت «ولایت»: تا امروز این نوع اصلاً چنین فیلدی نداشت؛ عیناً هم‌شکل با
  // MyServiceProviderProfile وب (src/lib/services/serviceProviderQueries.ts).
  province: string | null;
  contactPhone: string;
  address: string;
  description: string | null;
  isActive: boolean;
  images: string[];
};

type GetProviderProfileResponse = { success: true; profile: MyServiceProviderProfile | null };

/** GET همیشه success:true برمی‌گرداند (کاربر مهمان → profile: null) — دقیقاً هم‌رفتار با GET
 *  .../transport/driver. */
export async function getMyServiceProviderProfile(): Promise<MyServiceProviderProfile | null> {
  const res = await apiFetch('/api/mobile/v1/services/provider');
  const data: GetProviderProfileResponse = await res.json();
  return data.profile;
}

type UploadSlotsResponse =
  | { success: true; slots: { path: string; token: string }[] }
  | { success: false; error: string };

/**
 * هر عکس محلی را فشرده می‌کند (lib/imageCompression.ts)، از پل موبایل به تعداد لازم Signed URL
 * می‌گیرد (Service Role، فقط سرور می‌تواند این را صادر کند)، سپس هر Blob فشرده‌شده را مستقیماً
 * (بدون عبور از سرور Next.js) با supabase-js به همان Signed URL آپلود می‌کند — دقیقاً همان جریان
 * uploadDriverImages (فاز M03). آرایه‌ی ورودی خالی کاملاً مجاز است (گالری نمونه‌کار اختیاری
 * است)، پس در آن حالت هیچ تماس شبکه‌ای هم انجام نمی‌شود.
 */
export async function uploadProviderImages(localUris: string[]): Promise<string[]> {
  if (localUris.length === 0) return [];

  const compressed = await Promise.all(localUris.map(compressImage));

  const slotsRes = await apiFetch('/api/mobile/v1/services/provider/upload-slots', {
    method: 'POST',
    body: JSON.stringify({ count: compressed.length }),
  });
  const slotsData: UploadSlotsResponse = await slotsRes.json();
  if (!slotsData.success) throw new ServicesApiError(slotsData.error);
  if (slotsData.slots.length !== compressed.length) {
    throw new ServicesApiError('uploadFailed');
  }

  const imagePaths: string[] = [];
  for (let i = 0; i < compressed.length; i++) {
    const slot = slotsData.slots[i];
    const img = compressed[i];
    const { error } = await supabase.storage
      .from(SERVICE_PROVIDERS_BUCKET)
      .uploadToSignedUrl(slot.path, slot.token, img.blob, { contentType: 'image/jpeg' });
    if (error) throw new ServicesApiError('uploadFailed');

    imagePaths.push(slot.path);
  }
  return imagePaths;
}

export type SaveServiceProviderProfilePayload = {
  serviceCategoryId: string;
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فیلد الزامی تازه — saveServiceProviderProfileAction وب از
  // فاز ۱۰ به بعد بدون این فیلد با خطای invalidProvince رد می‌کند.
  province: string;
  address: string;
  contactPhone: string;
  description: string;
  /** مسیرهای خامِ Storage (عکس‌های قبلاً موجود + خروجی uploadProviderImages) — نه URL کامل. */
  imagePaths: string[];
};

type SaveProviderProfileResponse = { success: true } | { success: false; error: string };

/** POST/PATCH یک Route واحد (upsert سمت سرور) — دقیقاً طبق قرارداد Route وب؛ چه ثبت اول باشد چه
 *  ویرایش، همین یک تابع کافی است. برخلاف saveDriverProfileAction وب، اکشن معادلِ متخصص
 *  (saveServiceProviderProfileAction) پارامترهای اختیاری latitude/longitude هم می‌پذیرد؛ این فرم
 *  موبایل عمداً آن‌ها را ارسال نمی‌کند (طبق متن دقیق تسک ۳ همین فاز، بدون گرفتن موقعیت مکانی) —
 *  دقیقاً مثل حالتی که مرورگر کاربر در نسخه‌ی وب دسترسی GPS را رد کرده: چون این یک upsert است،
 *  کلید location روی سرور اصلاً بازنویسی نمی‌شود و موقعیت مکانیِ ثبت‌شده (اگر قبلاً از راه دیگری
 *  در دیتابیس وجود داشته باشد) دست‌نخورده می‌ماند. */
export async function saveServiceProviderProfile(
  payload: SaveServiceProviderProfilePayload
): Promise<void> {
  const res = await apiFetch('/api/mobile/v1/services/provider', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data: SaveProviderProfileResponse = await res.json();
  if (!data.success) throw new ServicesApiError(data.error);
}