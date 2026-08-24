// مسیر فایل: lib/users/profilePhotoMutations.ts
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، قابلیت «آپلود عکس پروفایل») — دقیقاً هم‌الگو با
// lib/marketplace/mutations.ts::uploadListingImages (فاز M02، تسک ۴+۵+۶ با هم): عکسِ محلی را
// فشرده می‌کند (lib/imageCompression.ts، همان تابعِ مشترکِ استفاده‌شده در کالا/راننده/متخصص/ملک —
// نیازی به یک نسخه‌ی جداگانه‌ی «عکسِ پروفایل» نبود)، از پل موبایل یک Signed URL می‌گیرد، و
// مستقیماً (بدون عبور از سرورِ Next.js) با supabase-js به همان Signed URL آپلود می‌کند.
//
// سه تابع، هرکدام معادلِ دقیقِ یکی از سه اکشنِ وب (src/app/[lang]/profile/photoActions.ts):
//   uploadAndSubmitProfilePhoto  → createSignedProfilePhotoUploadSlotAction + submitProfilePhotoAction
//   deleteProfilePhoto           → deleteMyProfilePhotoAction
// (برخلافِ کالا/ملک که «آپلود» و «ثبتِ نهایی» دو مرحله‌ی جداگانه‌اند — چون یک ویزارد چندمرحله‌ای
// را طی می‌کنند — عکسِ پروفایل یک اقدامِ تک‌مرحله‌ای است: کاربر عکس را انتخاب می‌کند و بلافاصله
// هم آپلود هم ثبت می‌شود، پس این فایل این دو مرحله را در یک تابعِ واحد ترکیب کرد.)
import { compressImage } from '@/lib/imageCompression';
import { apiFetch } from '@/lib/session';
import { supabase } from '@/lib/supabase';

const PROFILE_PHOTOS_BUCKET = 'profile-photos';

/** خطای برگشتی از هر سه Route؛ code دقیقاً یکی از کلیدهای dict.profile.photo.errors است. */
export class ProfilePhotoApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

type UploadSlotResponse =
  | { success: true; slot: { path: string; token: string } }
  | { success: false; error: string };

type SubmitResponse = { success: true } | { success: false; error: string };

/**
 * یک عکسِ محلی (خروجی expo-image-picker) را فشرده، آپلود، و بلافاصله به‌عنوان عکسِ پروفایلِ
 * فعلی ثبت می‌کند. مسیرِ خامِ نهایی (photoPath) را برمی‌گرداند — صدا‌کننده (UI) باید بعد از این،
 * refreshUser از AuthContext را صدا بزند تا وضعیتِ تازه (photoPath/photoStatus) در کل اپ به‌روز
 * شود.
 */
export async function uploadAndSubmitProfilePhoto(localUri: string): Promise<string> {
  const compressed = await compressImage(localUri);

  const slotRes = await apiFetch('/api/mobile/v1/profile/photo/upload-slots', { method: 'POST' });
  const slotData: UploadSlotResponse = await slotRes.json();
  if (!slotData.success) throw new ProfilePhotoApiError(slotData.error);

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_PHOTOS_BUCKET)
    .uploadToSignedUrl(slotData.slot.path, slotData.slot.token, compressed.blob, {
      contentType: 'image/jpeg',
    });
  if (uploadError) throw new ProfilePhotoApiError('uploadFailed');

  const submitRes = await apiFetch('/api/mobile/v1/profile/photo', {
    method: 'POST',
    body: JSON.stringify({ photoPath: slotData.slot.path }),
  });
  const submitData: SubmitResponse = await submitRes.json();
  if (!submitData.success) throw new ProfilePhotoApiError(submitData.error);

  return slotData.slot.path;
}

/** عکسِ پروفایلِ فعلی را کاملاً پاک می‌کند (هم ردیفِ دیتابیس، هم فایلِ Storage — سمتِ سرور). */
export async function deleteProfilePhoto(): Promise<void> {
  const res = await apiFetch('/api/mobile/v1/profile/photo', { method: 'DELETE' });
  const data: SubmitResponse = await res.json();
  if (!data.success) throw new ProfilePhotoApiError(data.error);
}