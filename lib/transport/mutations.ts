// مسیر فایل: lib/transport/mutations.ts — فاز M03، تسک ۳ + تسک ۴ + تسک ۵
//
// 🛠️ رفعِ باگِ شناخته‌شده (فاز M09 — همگام‌سازی با وب، بازطراحیِ «دو عکسِ اختصاصی» + ویدئوی VIP):
// این فایل دقیقاً همان باگی بود که کامنتِ بالای app/transport/driver.tsx از مدت‌ها پیش مستند
// کرده بود — Route واقعیِ وب (src/app/api/mobile/v1/transport/driver/route.ts) دیگر
// imagePaths: string[] را نمی‌شناسد؛ به‌جایش personalPhotoPath (الزامی) + vehiclePhotoPath
// (اختیاری) + videoPath (اختیاری، فقط VIP) می‌خواهد — دقیقاً هم‌قراردادِ
// DriverProfileClient.tsx وب. این فایل اکنون کاملاً با آن قرارداد هم‌تراز شد:
//   ۱) MyDriverProfile: images:string[] با personalPhotoPath/vehiclePhotoPath/videoPath
//      جایگزین شد (دقیقاً هم‌شکل با MyDriverProfile وب در src/lib/transport/driverQueries.ts).
//   ۲) uploadDriverImages (آرایه‌ی عمومی) با uploadDriverPhoto (یک عکسِ تکی، بر اساسِ نوع)
//      جایگزین شد — چون Route وب (upload-slots) از قبل بر اساسِ photoType کار می‌کند، نه count.
//   ۳) uploadDriverVideo تازه اضافه شد — Route وب تازه‌اش
//      (.../transport/driver/video-upload-slot) در پوشه‌ی جداگانه‌ی web-repo-routes/ تحویل
//      داده شده.
//   ۴) SaveDriverProfilePayload با فیلدهای تازه‌ی هم‌نام به‌روزرسانی شد.
//
// دقیقاً هم‌الگو با lib/marketplace/mutations.ts (فاز M02، تسک ۵/۶/۷): برخلاف lib/transport/api.ts
// (خواندن عمومی فهرست رانندگان فعال، مستقیم با Anon Key — تسک ۱ همین فاز)، هر توابع این فایل از
// پل موبایل (/api/mobile/v1/transport/driver/*) رد می‌شوند — چون یا نیاز به احراز هویت (owner_id
// از توکن، نه از ورودی کاربر) دارند، یا نیاز به Service Role برای صدور Signed Upload URL دارند.
import { compressImage } from '@/lib/imageCompression';
import { apiFetch } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { VehicleTypeId } from './vehicleTypes';

const DRIVERS_BUCKET = 'drivers-images';
const DRIVERS_VIDEOS_BUCKET = 'drivers-videos';

/** خطای برگشتی از هر Route؛ code دقیقاً یکی از کلیدهای dict.transport.driverProfile.errors است. */
export class TransportApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

// شکل پروفایل — دقیقاً هم‌الگو با MyDriverProfile وب (src/lib/transport/driverQueries.ts).
// هر سه مسیر (personalPhotoPath/vehiclePhotoPath/videoPath) مسیرِ خامِ Storage است (نه URL
// کامل) — تبدیل به URL کامل فقط لحظه‌ی *نمایش* در خودِ صفحه‌ی فرم انجام می‌شود (با
// getDriverImageUrl/getDriverVideoUrl از lib/transport/images.ts).
export type MyDriverProfile = {
  vehicleType: VehicleTypeId;
  province: string | null;
  vehicleDetails: string | null;
  contactPhone: string;
  isActive: boolean;
  personalPhotoPath: string | null;
  vehiclePhotoPath: string | null;
  videoPath: string | null;
};

type GetDriverProfileResponse = { success: true; profile: MyDriverProfile | null };

/** GET همیشه success:true برمی‌گرداند (کاربر مهمان → profile: null) — دقیقاً هم‌رفتار با Route وب. */
export async function getMyDriverProfile(): Promise<MyDriverProfile | null> {
  const res = await apiFetch('/api/mobile/v1/transport/driver');
  const data: GetDriverProfileResponse = await res.json();
  return data.profile;
}

type PhotoUploadSlotResponse =
  | { success: true; slot: { path: string; token: string } }
  | { success: false; error: string };

export type DriverPhotoType = 'personal' | 'vehicle';

/**
 * یک عکسِ تکی (شخصی یا وسیله) را فشرده می‌کند، از پل موبایل یک Signed URL بر اساسِ نوعِ عکس
 * می‌گیرد، و مستقیماً آپلود می‌کند — دقیقاً هم‌قراردادِ createDriverPhotoUploadSlotAction وب.
 * مسیرِ خامِ نهایی را برمی‌گرداند (نه URL)، برای فرستادن به saveDriverProfile.
 */
export async function uploadDriverPhoto(localUri: string, photoType: DriverPhotoType): Promise<string> {
  const compressed = await compressImage(localUri);

  const slotRes = await apiFetch('/api/mobile/v1/transport/driver/upload-slots', {
    method: 'POST',
    body: JSON.stringify({ photoType }),
  });
  const slotData: PhotoUploadSlotResponse = await slotRes.json();
  if (!slotData.success) throw new TransportApiError(slotData.error);

  const { error } = await supabase.storage
    .from(DRIVERS_BUCKET)
    .uploadToSignedUrl(slotData.slot.path, slotData.slot.token, compressed.blob, {
      contentType: 'image/jpeg',
    });
  if (error) throw new TransportApiError('uploadFailed');

  return slotData.slot.path;
}

/**
 * 🆕 فاز M09 — آپلودِ ویدئوی کوتاهِ VIP. دقیقاً هم‌الگو با uploadDriverPhoto بالا، با دو تفاوت:
 * (۱) بدون فشرده‌سازی (رجوع کنید به یادداشتِ کاملِ lib/media/videoUpload.ts)، (۲) Route تازه‌ی
 * video-upload-slot به‌جای upload-slots.
 */
export async function uploadDriverVideo(localUri: string): Promise<string> {
  const slotRes = await apiFetch('/api/mobile/v1/transport/driver/video-upload-slot', {
    method: 'POST',
  });
  const slotData: PhotoUploadSlotResponse = await slotRes.json();
  if (!slotData.success) throw new TransportApiError(slotData.error);

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(DRIVERS_VIDEOS_BUCKET)
    .uploadToSignedUrl(slotData.slot.path, slotData.slot.token, blob, { contentType: 'video/mp4' });
  if (error) throw new TransportApiError('uploadFailed');

  return slotData.slot.path;
}

export type SaveDriverProfilePayload = {
  vehicleType: VehicleTypeId;
  province: string;
  vehicleDetails: string;
  contactPhone: string;
  /** مسیرِ خامِ Storage — الزامی، دقیقاً هم‌قاعده‌ی personalPhotoRequired سمتِ سرور. */
  personalPhotoPath: string;
  /** مسیرِ خامِ Storage یا null — اختیاری. */
  vehiclePhotoPath: string | null;
  /** 🆕 فاز M09 — مسیرِ خامِ Storage یا null — اختیاری، فقط برای کاربرِ VIP. */
  videoPath: string | null;
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
 * نگه داشته: این دو، رویدادهای کاربری کاملاً متفاوتی هستند.
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
 * ارسال مختصات لحظه‌ای راننده به سرور — فاز M03، تسک ۵. عمداً "fire-and-forget" از
 * app/transport/driver.tsx صدا زده می‌شود (خطا فقط بی‌صدا catch و نادیده گرفته می‌شود).
 */
export async function updateDriverLocation(latitude: number, longitude: number): Promise<void> {
  const res = await apiFetch('/api/mobile/v1/transport/driver/location', {
    method: 'PATCH',
    body: JSON.stringify({ latitude, longitude }),
  });
  const data: UpdateDriverLocationResponse = await res.json();
  if (!data.success) throw new TransportApiError(data.error);
}