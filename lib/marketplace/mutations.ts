// مسیر فایل: lib/marketplace/mutations.ts — فاز M02، تسک ۵/۶/۷
//
// 🆕 به‌روزرسانی (فاز ۱۰ موبایل — قابلیت «ولایت»): CreateListingPayload یک فیلد الزامی تازه
// (province) گرفت — رجوع کنید به یادداشت کنار همان فیلد پایین‌تر.
//
// برخلاف lib/marketplace/api.ts (خواندن‌های عمومی، مستقیم با Anon Key)، هر سه تابع این فایل از
// پل موبایل (`/api/mobile/v1/marketplace/*`) رد می‌شوند — چون یا نیاز به احراز هویت (owner_id از
// توکن، نه از ورودی کاربر) دارند، یا نیاز به Service Role برای Storage دارند. دقیقاً همان تمایز
// «مسیر اول / مسیر دوم» که در بند ۲ سند راهبردی موبایل توضیح داده شده.
//
// 🔴 اصلاح مهم (ممیزی i18n/RTL فاز M02، تسک ۹): بعد از دیدن کد واقعی
// src/app/api/mobile/v1/marketplace/listings/route.ts در ریپازیتوری وب، مشخص شد قرارداد واقعی
// آن Route با نسخه‌ی قبلی این فایل یکی نبود:
//   ۱. Route انتظار فیلد `imagePaths` (مسیر خامِ Storage، مثل "owner-uuid/167000_0.jpg") را
//      دارد، نه `images`. نسخه‌ی قبلی این فایل فیلدی به‌نام `images` می‌فرستاد؛ چون سرور
//      `b.imagePaths` را می‌خواند (که همیشه undefined بود)، آرایه‌ی خالی در نظر گرفته می‌شد و
//      createListingAction همیشه با خطای invalidImageCount رد می‌کرد — یعنی ثبت آگهی از موبایل
//      همیشه شکست می‌خورد، مستقل از تعداد عکس واقعی.
//   ۲. آن فیلد باید حاوی مسیر خام (خروجی Signed Upload، یعنی همان slot.path) باشد، نه URL کامل؛
//      نسخه‌ی قبلی uploadListingImages به‌اشتباه URL عمومی (getPublicUrl) برمی‌گرداند. حتی اگر
//      اسم فیلد درست می‌بود، این URL کامل هرگز از چک امنیتی سرور
//      (imagePaths.every(p => p.startsWith(`${user.id}/`))) رد نمی‌شد.
// هر دو مورد پایین رفع شده‌اند: uploadListingImages اکنون مسیر خام برمی‌گرداند، و
// CreateListingPayload/createListing اکنون دقیقاً فیلد imagePaths را می‌فرستند.
//
// ⚠️ فرض مستندشده: شکل دقیق JSON این سه Route (upload-slots / listings / my-listings) در این
// ریپازیتوری (فقط پروژه‌ی موبایل) از قبل مستند نبود — برخلاف تسک‌های فاز M01 که نقشه‌راه دقیقاً
// همان قرارداد را نوشته بود. من همین سه Route را هم در پوشه‌ی جدا web-repo-routes/ ساختم؛
// قرارداد JSON زیر دقیقاً همانی است که آن سه فایل هم پیاده می‌کنند. اگر بعداً پیاده‌سازی واقعی
// آن‌ها در ریپازیتوری وب فرق کرد، فقط همین یک فایل نیاز به هماهنگی دارد.
import { compressImage } from '@/lib/imageCompression';
import { apiFetch } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { ListingCategoryId } from './categories';
import { getListingImageUrls } from './images';

const LISTINGS_BUCKET = 'listings-images';

/** خطای برگشتی از هر سه Route؛ code دقیقاً یکی از کلیدهای dict.marketplace.wizard.errors است. */
export class MarketplaceApiError extends Error {
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
 * تسک ۴+۵+۶ با هم: هر عکس محلی را فشرده می‌کند (lib/imageCompression.ts)، از پل موبایل به
 * تعداد لازم Signed URL می‌گیرد (Service Role، فقط سرور می‌تواند این را صادر کند)، سپس هر Blob
 * فشرده‌شده را مستقیماً (بدون عبور از سرور Next.js — دقیقاً متن تسک ۶) با supabase-js به همان
 * Signed URL آپلود می‌کند.
 *
 * 🔴 اصلاح: خروجی این تابع اکنون آرایه‌ی مسیرهای خامِ Storage است (همان slot.path که سرور صادر
 * کرده)، نه URL عمومی — دقیقاً همان چیزی که createListingAction (وب) به‌عنوان imagePaths انتظار
 * دارد و روی آن چک امنیتی «مالکیت پوشه‌ی کاربر» را اجرا می‌کند. ساخت URL عمومی برای *نمایش*
 * (نه برای ارسال به سرور) در جای دیگری (lib/marketplace/api.ts، و getMyListings پایین همین
 * فایل) با getListingImageUrls انجام می‌شود.
 */
export async function uploadListingImages(localUris: string[]): Promise<string[]> {
  const compressed = await Promise.all(localUris.map(compressImage));

  const slotsRes = await apiFetch('/api/mobile/v1/marketplace/upload-slots', {
    method: 'POST',
    body: JSON.stringify({ count: compressed.length }),
  });
  const slotsData: UploadSlotsResponse = await slotsRes.json();
  if (!slotsData.success) throw new MarketplaceApiError(slotsData.error);
  if (slotsData.slots.length !== compressed.length) {
    throw new MarketplaceApiError('uploadFailed');
  }

  const imagePaths: string[] = [];
  for (let i = 0; i < compressed.length; i++) {
    const slot = slotsData.slots[i];
    const img = compressed[i];
    const { error } = await supabase.storage
      .from(LISTINGS_BUCKET)
      .uploadToSignedUrl(slot.path, slot.token, img.blob, { contentType: 'image/jpeg' });
    if (error) throw new MarketplaceApiError('uploadFailed');

    imagePaths.push(slot.path);
  }
  return imagePaths;
}

export type CreateListingPayload = {
  category: ListingCategoryId;
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فیلد الزامی تازه — createListingAction وب (که این Route پل
  // مستقیماً صدا می‌زند) از فاز ۱۰ به بعد بدون این فیلد با خطای invalidProvince رد می‌کند. تا
  // امروز این فایل اصلاً چنین فیلدی نمی‌شناخت — همین نبود باعث می‌شد ثبت آگهی از موبایل همیشه با
  // همین خطا شکست بخورد، مستقل از درستی بقیه‌ی فیلدها.
  province: string;
  title: string;
  price: number;
  address: string;
  contactPhone: string;
  description: string | null;
  /** مسیرهای خامِ Storage (خروجی uploadListingImages) — نه URL کامل. نام فیلد باید دقیقاً
   *  imagePaths باشد تا با قرارداد واقعی Route وب (src/app/[lang]/listings/new/actions.ts ::
   *  createListingAction) یکی باشد. */
  imagePaths: string[];
  latitude?: number | null;
  longitude?: number | null;
};

type CreateListingResponse = { success: true; id: string } | { success: false; error: string };

/** تسک ۵ (نیمه‌ی دوم): ثبت نهایی ردیف آگهی — owner_id را سرور از روی توکن تعیین می‌کند، نه اینجا. */
export async function createListing(payload: CreateListingPayload): Promise<{ id: string }> {
  const res = await apiFetch('/api/mobile/v1/marketplace/listings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data: CreateListingResponse = await res.json();
  if (!data.success) throw new MarketplaceApiError(data.error);
  return { id: data.id };
}

export type MyListing = {
  id: string;
  category: ListingCategoryId;
  title: string;
  price: number;
  address: string;
  images: string[];
  status: 'pending' | 'approved' | 'deleted';
  createdAt: string;
};

// شکل خامی که Route وب برمی‌گرداند — images همان مسیرهای خامِ Storage است (بدون تبدیل URL،
// دقیقاً هم‌الگو با سه تابع lib/marketplace/api.ts)؛ تبدیل به URL همین‌جا، در سمت موبایل انجام
// می‌شود (getMyListings پایین).
type RawMyListing = Omit<MyListing, 'images'> & { images: string[] };
type MyListingsResponse = { listings: RawMyListing[] };

/**
 * تسک ۷: چون RLS جدول listings فقط با auth.uid() (نشست Supabase Auth) خواندن وضعیت‌های
 * غیر-approved را مجاز می‌کند — نه با توکن سفارشی OTP این پروژه — این Route حتماً باید با
 * Service Role در سرور بخواند (دقیقاً چرا نقشه‌راه صراحتاً نوشته «از طریق پل موبایل»، برخلاف
 * فهرست/جزئیات عمومی).
 *
 * 🟠 اصلاح (ممیزی i18n/RTL فاز M02، تسک ۹): مثل api.ts، تصویر هر آگهی هم اینجا مسیر خام بود؛
 * اکنون با getListingImageUrls به URL عمومی کامل تبدیل می‌شود پیش از رسیدن به UI.
 */
export async function getMyListings(): Promise<MyListing[]> {
  const res = await apiFetch('/api/mobile/v1/marketplace/my-listings');
  const data: MyListingsResponse = await res.json();
  const rows = data.listings ?? [];
  return rows.map((row) => ({
    ...row,
    images: getListingImageUrls(row.images ?? []),
  }));
}