// مسیر فایل: lib/realEstate/mutations.ts — فاز M05، تسک ۳ + تسک ۴
//
// 🆕 به‌روزرسانی (فاز ۱۰ موبایل — قابلیت «ولایت»): CreateRealEstateListingPayload یک فیلد
// الزامی تازه (province) گرفت — رجوع کنید به یادداشت کنار همان فیلد پایین‌تر.
//
// برخلاف lib/realEstate/api.ts (خواندن‌های عمومی، مستقیم با Anon Key)، هر دو تابع این فایل از پل
// موبایل (`/api/mobile/v1/real-estate/*`) رد می‌شوند — چون یا نیاز به احراز هویت (owner_id از
// توکن، نه از ورودی کاربر) دارند یا نیاز به Service Role برای Storage دارند. دقیقاً همان تمایز
// «مسیر اول/مسیر دوم» بند ۲ سند راهبردی موبایل، و دقیقاً هم‌الگو با lib/marketplace/mutations.ts
// (فاز M02، تسک ۵/۶) و lib/services/providerProfile.ts (فاز M04، تسک ۳).
//
// دو Route وب تازه‌ای که این فایل صدا می‌زند (زیر پوشه‌ی جدا web-repo-routes/ تحویل داده شدند):
//   POST /api/mobile/v1/real-estate/upload-slots  → createSignedUploadSlotsAction (تازه، تسک ۴)
//   POST /api/mobile/v1/real-estate/listings       → createRealEstateListingAction (تازه، تسک ۳)
// هر دو Route صفر منطق تجاری تازه دارند — فقط دو اکشن از-قبل-موجود و تست‌شده‌ی وب
// (src/app/[lang]/real-estate/new/actions.ts) را عیناً صدا می‌زنند.
import { compressImage } from '@/lib/imageCompression';
import { apiFetch } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { DealTypeId } from './dealTypes';
import type { PropertyTypeId } from './propertyTypes';

const REAL_ESTATE_BUCKET = 'real-estate-images';
// 🆕 فاز M09
const REAL_ESTATE_VIDEOS_BUCKET = 'real-estate-videos';

/** خطای برگشتی از هر دو Route؛ code دقیقاً یکی از کلیدهای dict.realEstate.wizard.errors است. */
export class RealEstateApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

type UploadSlotsResponse =
  | { success: true; slots: { path: string; token: string }[] }
  | { success: false; error: string };

/**
 * هر عکس محلی را فشرده می‌کند (lib/imageCompression.ts)، از پل موبایل به تعداد لازم Signed URL
 * می‌گیرد (Service Role، فقط سرور می‌تواند این را صادر کند)، سپس هر Blob فشرده‌شده را مستقیماً
 * (بدون عبور از سرور Next.js) با supabase-js به همان Signed URL آپلود می‌کند — دقیقاً همان جریان
 * uploadListingImages (فاز M02). خروجی، آرایه‌ی مسیرهای خامِ Storage است (نه URL کامل) — دقیقاً
 * همان چیزی که createRealEstateListingAction (وب) به‌عنوان imagePaths انتظار دارد و روی آن چک
 * امنیتی «مالکیت پوشه‌ی کاربر» را اجرا می‌کند.
 */
export async function uploadRealEstateImages(localUris: string[]): Promise<string[]> {
  const compressed = await Promise.all(localUris.map(compressImage));

  const slotsRes = await apiFetch('/api/mobile/v1/real-estate/upload-slots', {
    method: 'POST',
    body: JSON.stringify({ count: compressed.length }),
  });
  const slotsData: UploadSlotsResponse = await slotsRes.json();
  if (!slotsData.success) throw new RealEstateApiError(slotsData.error);
  if (slotsData.slots.length !== compressed.length) {
    throw new RealEstateApiError('uploadFailed');
  }

  const imagePaths: string[] = [];
  for (let i = 0; i < compressed.length; i++) {
    const slot = slotsData.slots[i];
    const img = compressed[i];
    const { error } = await supabase.storage
      .from(REAL_ESTATE_BUCKET)
      .uploadToSignedUrl(slot.path, slot.token, img.blob, { contentType: 'image/jpeg' });
    if (error) throw new RealEstateApiError('uploadFailed');

    imagePaths.push(slot.path);
  }
  return imagePaths;
}

/** 🆕 فاز M09 — پاسخِ Route ویدئو، یک اسلاتِ تکی (نه آرایه‌ی upload-slots عکس‌ها). */
type VideoUploadSlotResponse =
  | { success: true; slot: { path: string; token: string } }
  | { success: false; error: string };

/**
 * 🆕 فاز M09 — همگام‌سازی با وب، آپلودِ ویدئوی کوتاهِ VIP. دقیقاً هم‌الگو با
 * uploadProviderVideo (lib/services/providerProfile.ts) — بدونِ فشرده‌سازی (رجوع کنید به
 * یادداشتِ کاملِ lib/media/videoUpload.ts)، Route تکی و بدونِ بدنه.
 */
export async function uploadRealEstateVideo(localUri: string): Promise<string> {
  const slotRes = await apiFetch('/api/mobile/v1/real-estate/video-upload-slot', {
    method: 'POST',
  });
  const slotData: VideoUploadSlotResponse = await slotRes.json();
  if (!slotData.success) throw new RealEstateApiError(slotData.error);

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(REAL_ESTATE_VIDEOS_BUCKET)
    .uploadToSignedUrl(slotData.slot.path, slotData.slot.token, blob, { contentType: 'video/mp4' });
  if (error) throw new RealEstateApiError('uploadFailed');

  return slotData.slot.path;
}

export type CreateRealEstateListingPayload = {
  propertyType: PropertyTypeId;
  dealType: DealTypeId;
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فیلد الزامی تازه — createRealEstateListingAction وب از فاز
  // ۱۰ به بعد بدون این فیلد با خطای invalidProvince رد می‌کند. تا امروز این فایل اصلاً چنین
  // فیلدی نمی‌شناخت.
  province: string;
  /** رشته‌ای، نه عدد — دقیقاً طبق قرارداد createRealEstateListingAction (که خودش با
   *  toAsciiDigits ارقام فارسی/عربی احتمالی را قبل از Number() تبدیل می‌کند). */
  price: string;
  address: string;
  description: string;
  /** مسیرهای خامِ Storage (خروجی uploadRealEstateImages) — نه URL کامل. */
  imagePaths: string[];
  /** 🆕 فاز M09 — مسیرِ خامِ Storage یا null؛ اختیاری، فقط برای کاربرِ VIP. */
  videoPath?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// createRealEstateListingAction (وب) فقط { success: true } برمی‌گرداند (بدون id) — برخلاف چیزی
// که ممکن است از الگوی createListing (marketplace) انتظار رود؛ اینجا عمداً با همان قرارداد واقعیِ
// دیده‌شده در actions.ts نوشته شد.
type CreateRealEstateListingResponse = { success: true } | { success: false; error: string };

/** تسک ۳ (نیمه‌ی دوم): ثبت نهایی ردیف آگهی ملک — owner_id را سرور از روی توکن تعیین می‌کند، نه
 *  اینجا؛ status همیشه 'pending' شروع می‌شود (تا تایید مدیر) — دقیقاً طبق ستون real_estate.status. */
export async function createRealEstateListing(payload: CreateRealEstateListingPayload): Promise<void> {
  const res = await apiFetch('/api/mobile/v1/real-estate/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data: CreateRealEstateListingResponse = await res.json();
  if (!data.success) throw new RealEstateApiError(data.error);
}