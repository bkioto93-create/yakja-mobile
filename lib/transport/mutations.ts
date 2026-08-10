// مسیر فایل: lib/transport/mutations.ts — فاز M03، تسک ۳ + تسک ۴ + تسک ۵
//
// 🆕 به‌روزرسانی (فاز ۱۰ موبایل — قابلیت «ولایت»): MyDriverProfile فیلد تازه‌ی province گرفت
// (برای پیش‌پر شدن فرم در حالت ویرایش) و SaveDriverProfilePayload یک فیلد الزامی تازه‌ی province
// گرفت — رجوع کنید به یادداشت کنار همان فیلدها پایین‌تر.
//
// ⚠️ توجه: این فایل یک باگ جداگانه‌ی شناخته‌شده هم دارد (ربطی به ولایت ندارد) — SaveDriverProfilePayload
// هنوز imagePaths: string[] دارد، اما Route واقعیِ وب دیگر آن را نمی‌شناسد و به‌جایش
// personalPhotoPath/vehiclePhotoPath می‌خواهد. جزئیات کامل در کامنت بالای app/transport/driver.tsx؛
// عمداً در همین تحویل رفع نشده (خارج از دامنه‌ی «تعریف ولایت»).
//
// دقیقاً هم‌الگو با lib/marketplace/mutations.ts (فاز M02، تسک ۵/۶/۷): برخلاف lib/transport/api.ts
// (خواندن عمومی فهرست رانندگان فعال، مستقیم با Anon Key — تسک ۱ همین فاز)، هر پنج تابع این فایل از
// پل موبایل (/api/mobile/v1/transport/driver/*) رد می‌شوند — چون یا نیاز به احراز هویت (owner_id
// از توکن، نه از ورودی کاربر) دارند، یا نیاز به Service Role برای صدور Signed Upload URL دارند.
//
// پنج Route وبی که این فایل صدا می‌زند:
//   - GET          /api/mobile/v1/transport/driver               → از قبل در وب موجود بود (تسک ۲)
//   - POST/PATCH   /api/mobile/v1/transport/driver               → از قبل در وب موجود بود (تسک ۲)
//   - POST         /api/mobile/v1/transport/driver/upload-slots  → از قبل در وب موجود بود (تسک ۳)
//   - PATCH        /api/mobile/v1/transport/driver/active        → از قبل در وب موجود بود (تسک ۴)
//   - PATCH        /api/mobile/v1/transport/driver/location       → تازه، همین تسک (۵) — دقیقاً
//     هم‌الگو با updateDriverLocationAction وب (src/app/[lang]/transport/driver/actions.ts، از قبل
//     برای فرم وب نوشته و تست شده بود، فقط تا امروز هیچ Route ای آن را به موبایل متصل نمی‌کرد).
//     Route وب تازه‌اش زیر پوشه‌ی جدا web-repo-routes/ تحویل داده شده (این فایل بخشی از پروژه‌ی
//     Expo نیست).
import { compressImage } from '@/lib/imageCompression';
import { apiFetch } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { VehicleTypeId } from './vehicleTypes';

const DRIVERS_BUCKET = 'drivers-images';

/** خطای برگشتی از هر پنج Route؛ code دقیقاً یکی از کلیدهای dict.transport.driverProfile.errors است. */
export class TransportApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

// شکل پروفایل — دقیقاً هم‌الگو با MyDriverProfile وب (src/lib/transport/driverQueries.ts).
// images همان مسیرهای خامِ Storage است (نه URL کامل)؛ تبدیل به URL کامل فقط لحظه‌ی *نمایش* در
// خودِ صفحه‌ی فرم انجام می‌شود (با getDriverImageUrl از lib/transport/images.ts) — چون این
// مسیرهای خام باید عیناً دوباره به saveDriverProfile فرستاده شوند (imagePaths)، دقیقاً همان
// دلیلی که lib/marketplace/mutations.ts هم مسیر خام برمی‌گرداند، نه URL.
export type MyDriverProfile = {
  vehicleType: VehicleTypeId;
  // فاز ۱۰ موبایل — قابلیت «ولایت»: تا امروز این نوع اصلاً چنین فیلدی نداشت؛ بدون آن، فرم
  // ویرایش نمی‌توانست ولایتِ قبلاً ثبت‌شده را پیش‌پر کند. عیناً هم‌شکل با MyDriverProfile وب
  // (src/lib/transport/driverQueries.ts).
  province: string | null;
  vehicleDetails: string | null;
  contactPhone: string;
  isActive: boolean;
  images: string[];
};

type GetDriverProfileResponse = { success: true; profile: MyDriverProfile | null };

/** GET همیشه success:true برمی‌گرداند (کاربر مهمان → profile: null) — دقیقاً هم‌رفتار با Route وب. */
export async function getMyDriverProfile(): Promise<MyDriverProfile | null> {
  const res = await apiFetch('/api/mobile/v1/transport/driver');
  const data: GetDriverProfileResponse = await res.json();
  return data.profile;
}

type UploadSlotsResponse =
  | { success: true; slots: { path: string; token: string }[] }
  | { success: false; error: string };

/**
 * هر عکس محلی را فشرده می‌کند (lib/imageCompression.ts)، از پل موبایل به تعداد لازم Signed URL
 * می‌گیرد (Service Role، فقط سرور می‌تواند این را صادر کند)، سپس هر Blob فشرده‌شده را مستقیماً
 * (بدون عبور از سرور Next.js) با supabase-js به همان Signed URL آپلود می‌کند — دقیقاً همان
 * جریان uploadListingImages (فاز M02). برخلاف آن تابع، اینجا آرایه‌ی ورودی خالی کاملاً مجاز است
 * (عکس پروفایل راننده اختیاری است)، پس در آن حالت هیچ تماس شبکه‌ای هم انجام نمی‌شود.
 */
export async function uploadDriverImages(localUris: string[]): Promise<string[]> {
  if (localUris.length === 0) return [];

  const compressed = await Promise.all(localUris.map(compressImage));

  const slotsRes = await apiFetch('/api/mobile/v1/transport/driver/upload-slots', {
    method: 'POST',
    body: JSON.stringify({ count: compressed.length }),
  });
  const slotsData: UploadSlotsResponse = await slotsRes.json();
  if (!slotsData.success) throw new TransportApiError(slotsData.error);
  if (slotsData.slots.length !== compressed.length) {
    throw new TransportApiError('uploadFailed');
  }

  const imagePaths: string[] = [];
  for (let i = 0; i < compressed.length; i++) {
    const slot = slotsData.slots[i];
    const img = compressed[i];
    const { error } = await supabase.storage
      .from(DRIVERS_BUCKET)
      .uploadToSignedUrl(slot.path, slot.token, img.blob, { contentType: 'image/jpeg' });
    if (error) throw new TransportApiError('uploadFailed');

    imagePaths.push(slot.path);
  }
  return imagePaths;
}

export type SaveDriverProfilePayload = {
  vehicleType: VehicleTypeId;
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فیلد الزامی تازه — saveDriverProfileAction وب از فاز ۱۰ به
  // بعد بدون این فیلد با خطای invalidProvince رد می‌کند.
  province: string;
  vehicleDetails: string;
  contactPhone: string;
  /** مسیرهای خامِ Storage (عکس‌های قبلاً موجود + خروجی uploadDriverImages) — نه URL کامل. */
  imagePaths: string[];
};

type SaveDriverProfileResponse = { success: true } | { success: false; error: string };

/** POST/PATCH یک Route واحد (upsert سمت سرور) — دقیقاً طبق قرارداد Route وب؛ چه ثبت اول باشد
 *  چه ویرایش، همین یک تابع کافی است. */
export async function saveDriverProfile(payload: SaveDriverProfilePayload): Promise<void> {
  const res = await apiFetch('/api/mobile/v1/transport/driver', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data: SaveDriverProfileResponse = await res.json();
  if (!data.success) throw new TransportApiError(data.error);
}

type SetDriverActiveStatusResponse = { success: true } | { success: false; error: string };

/**
 * سوییچ فعال/غیرفعال راننده — فاز M03، تسک ۴. عمداً یک Route کاملاً مجزا
 * (PATCH /api/mobile/v1/transport/driver/active) صدا می‌زند، نه بخشی از saveDriverProfile —
 * دقیقاً همان دلیلی که خودِ وب هم setDriverActiveStatusAction را از saveDriverProfileAction جدا
 * نگه داشته (src/app/[lang]/transport/driver/actions.ts، تسک ۵ فاز ۰۳ وب): این دو، رویدادهای
 * کاربری کاملاً متفاوتی هستند — یکی «ذخیره‌ی کل فرم پروفایل» و دیگری «صرفاً یک کلیک روی سوییچ»؛
 * جدا نگه‌داشتن‌شان باعث می‌شود با هر بار زدن سوییچ، کل فرم (نوع وسیله/مشخصات/شماره تماس/عکس‌ها)
 * دوباره به سرور ارسال نشود — مهم روی اینترنت ضعیف (بند ۵.۳ سند راهبردی).
 */
export async function setDriverActiveStatus(isActive: boolean): Promise<void> {
  const res = await apiFetch('/api/mobile/v1/transport/driver/active', {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  const data: SetDriverActiveStatusResponse = await res.json();
  if (!data.success) throw new TransportApiError(data.error);
}

type UpdateDriverLocationResponse = { success: true } | { success: false; error: string };

/**
 * ارسال مختصات لحظه‌ای راننده به سرور — فاز M03، تسک ۵ (تازه). دقیقاً هم‌الگوی setDriverActiveStatus
 * بالا: یک Route کاملاً مجزا (PATCH /api/mobile/v1/transport/driver/location) صدا می‌زند، نه بخشی
 * از saveDriverProfile — این Route مستقیماً updateDriverLocationAction موجود وب
 * (src/app/[lang]/transport/driver/actions.ts) را صدا می‌زند؛ صفر منطق تجاری تازه سمت وب.
 *
 * عمداً "fire-and-forget" از app/transport/driver.tsx صدا زده می‌شود (خطا فقط بی‌صدا catch و
 * نادیده گرفته می‌شود، دقیقاً هم‌رفتار تابع sendLocation در DriverProfileClient.tsx وب): یک شکست
 * تکی در ارسال موقعیت (مثلاً یک بسته‌ی گم‌شده روی اینترنت ضعیف) نباید با یک Toast خطا تجربه‌ی
 * کاربر را مختل کند — چرخه‌ی بعدی (۳۰ تا ۶۰ ثانیه‌ی دیگر) خودش دوباره تلاش می‌کند.
 */
export async function updateDriverLocation(latitude: number, longitude: number): Promise<void> {
  const res = await apiFetch('/api/mobile/v1/transport/driver/location', {
    method: 'PATCH',
    body: JSON.stringify({ latitude, longitude }),
  });
  const data: UpdateDriverLocationResponse = await res.json();
  if (!data.success) throw new TransportApiError(data.error);
}