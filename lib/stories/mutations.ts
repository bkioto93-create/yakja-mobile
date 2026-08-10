// مسیر فایل: lib/stories/mutations.ts
// قابلیت استوری — عملیات نوشتنی (نیازمند احراز هویت)، از پل موبایل. دقیقاً هم‌الگو با
// lib/transport/mutations.ts: از پل موبایل رد می‌شود چون نیاز به احراز هویت (owner_id از توکن
// نشست، نه از ورودی کاربر)، بررسیِ سهمیه‌ی روزانه، و Service Role برای صدور Signed Upload URL
// دارد — چیزهایی که RLS عمومیِ جدول stories (فقط SELECT) پوشش نمی‌دهد.
//
// **افزوده‌شده (فاز نوشتن — «افزودن استوری»):** پیش از این فقط حذف اینجا بود. حالا دو تابع
// دیگر هم اضافه شدند، دقیقاً هم‌الگو با createSignedStoryUploadSlotAction/createStoryAction وب
// (src/app/[lang]/profile/storyActions.ts).
//
// **تصمیمِ آگاهانه درباره‌ی ویدئو (بدون فشرده‌سازی سمت کلاینت):** برخلاف عکس (که از همان
// compressImage موجود — lib/imageCompression.ts، فاز M02 — عبور می‌کند)، ویدئوی استوری هیچ
// فشرده‌سازی سمت کلاینتی نمی‌گیرد؛ مستقیم همان فایلِ انتخاب‌شده/ضبط‌شده آپلود می‌شود. دلیل: هیچ
// کتابخانه‌ی فشرده‌سازیِ ویدئوی بومی در پروژه نصب نیست (نه در package.json، نه در این تحویل —
// افزودنِ یکی مثل ffmpeg-kit یک وابستگیِ سنگین و پرریسک برای Build است) و چون استوری‌ها سقفِ
// سخت‌گیرانه‌ی ۱۵ ثانیه دارند (چه از دوربین ضبط شوند، چه از گالری انتخاب — با
// videoMaxDuration اعمال‌شده در خودِ ImagePicker)، حجمِ خامِ یک کلیپِ ۱۵ثانیه‌ای معمولاً از قبل
// در بازه‌ی معقولی است. اعتبارسنجیِ نهاییِ مدت‌زمان هم‌چنان سمت سرور (createStoryAction) انجام
// می‌شود — دقیقاً همان تضمینِ «دفاع در عمق»ی که وب هم دارد.
import { compressImage } from '@/lib/imageCompression';
import { apiFetch } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { StoryMediaType } from './api';

const STORIES_BUCKET = 'stories';

/** خطای برگشتی؛ code دقیقاً یکی از کلیدهای dict.stories.addSection.errors است. */
export class StoryApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

type SignedUploadSlot = { path: string; token: string };
type UploadSlotResponse =
  | { success: true; slot: SignedUploadSlot }
  | { success: false; error: string };

/**
 * گامِ اول: از پل موبایل یک آدرسِ آپلودِ امضاشده‌ی موقت می‌گیرد — قبل از این، سهمیه‌ی روزانه
 * را هم بررسی می‌کند (لایه‌ی اول از دو لایه‌ی گیت‌کردن؛ لایه‌ی دوم درست قبل از ثبتِ نهایی است).
 */
async function createSignedStoryUploadSlot(
  mediaType: StoryMediaType,
  mimeType: string
): Promise<SignedUploadSlot> {
  const res = await apiFetch('/api/mobile/v1/stories/upload-slots', {
    method: 'POST',
    body: JSON.stringify({ mediaType, mimeType }),
  });
  const data: UploadSlotResponse = await res.json();
  if (!data.success) throw new StoryApiError(data.error);
  return data.slot;
}

export type PreparedStoryMedia = {
  mediaPath: string;
  mediaType: StoryMediaType;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
};

/**
 * فشرده‌سازی (فقط عکس) + گرفتنِ Signed URL + آپلودِ مستقیم به Storage (بدون عبور از سرور
 * Next.js) — دقیقاً همان جریانِ uploadDriverImages (فاز M03)، فقط برای یک فایلِ تکی به‌جای آرایه.
 */
export async function uploadStoryMedia(asset: {
  uri: string;
  mediaType: StoryMediaType;
  durationMs: number | null;
  width: number | null;
  height: number | null;
}): Promise<PreparedStoryMedia> {
  let uploadUri = asset.uri;
  let mimeType = 'video/mp4';
  let width = asset.width;
  let height = asset.height;

  if (asset.mediaType === 'image') {
    try {
      const compressed = await compressImage(asset.uri);
      uploadUri = compressed.uri;
      width = compressed.width;
      height = compressed.height;
      mimeType = 'image/jpeg';
    } catch {
      throw new StoryApiError('compressionFailed');
    }
  }

  const slot = await createSignedStoryUploadSlot(asset.mediaType, mimeType);

  const response = await fetch(uploadUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(STORIES_BUCKET)
    .uploadToSignedUrl(slot.path, slot.token, blob, { contentType: mimeType });
  if (error) throw new StoryApiError('uploadFailed');

  return {
    mediaPath: slot.path,
    mediaType: asset.mediaType,
    durationSeconds: asset.mediaType === 'video' ? (asset.durationMs ?? 0) / 1000 : null,
    width,
    height,
  };
}

type CreateStoryResponse = { success: true } | { success: false; error: string };

/**
 * گامِ نهایی: ثبتِ ردیفِ استوری در دیتابیس — دقیقاً هم‌الگو با createStoryAction وب. سرور
 * دوباره (و غیرقابل‌دورزدن) سهمیه‌ی روزانه و مدت‌زمانِ ویدئو را بررسی می‌کند؛ اگر رد شد، خودِ
 * سرور فایلِ تازه‌آپلودشده را هم پاک می‌کند (بدون نیاز به کاری از سمتِ موبایل).
 */
export async function createStoryAction(
  media: PreparedStoryMedia
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await apiFetch('/api/mobile/v1/stories', {
    method: 'POST',
    body: JSON.stringify({
      mediaPath: media.mediaPath,
      mediaType: media.mediaType,
      durationSeconds: media.durationSeconds,
      width: media.width,
      height: media.height,
    }),
  });
  const data: CreateStoryResponse = await res.json();
  return data;
}

type DeleteStoryResponse = { success: true } | { success: false; error: string };

/**
 * حذف زودهنگامِ استوریِ خودِ کاربر، پیش از انقضای طبیعی ۲۴ساعته — دقیقاً هم‌الگو با
 * deleteMyStoryAction وب. سرور هم مالکیت را دوباره بررسی می‌کند (نه فقط UI)، پس این تابع هرگز
 * نمی‌تواند استوریِ کاربر دیگری را حذف کند، حتی اگر کلاینت دستکاری شده باشد.
 */
export async function deleteMyStoryAction(
  storyId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await apiFetch(`/api/mobile/v1/stories/${storyId}`, { method: 'DELETE' });
  const data: DeleteStoryResponse = await res.json();
  return data;
}