// مسیر فایل: lib/users/publicProfile.ts — فاز M06، تسک ۳
//
// چون جدول users هیچ Policy عمومی/anon ندارد (دقیقاً مثل reports)، خواندن پروفایل عمومی کاربر
// نمی‌تواند مسیر اول (Anon Key مستقیم) سند راهبردی موبایل را دنبال کند — دقیقاً همان استدلال
// getPublicUserProfile سمت وب (src/lib/users/publicProfileQueries.ts) که از supabaseAdminClient
// استفاده می‌کند، نه کلاینت مرورگر. پس این تابع از پل موبایل رد می‌شود
// (`GET /api/mobile/v1/users/[id]`، زیر پوشه‌ی جدا web-repo-routes/ تحویل داده شده) که خودش عیناً
// getPublicUserProfile موجود را صدا می‌زند — صفر منطق تجاری تازه.
//
// بدون نیاز به توکن/ورود (apiFetch اگر توکن نداشته باشد، بدون هدر Authorization درخواست می‌زند —
// دقیقاً هم‌رفتار با صفحه‌ی وب که برای بازدیدکننده‌ی مهمان هم پروفایل را نشان می‌دهد).
//
// 🛠️ فاز M09 — همگام‌سازی با وب: سه فیلدِ تازه (isVip/hasActiveStory/photoUrl) به تایپ اضافه
// شدند. هر سه از قبل، بدون هیچ تغییری در Route وب، در پاسخِ JSON موجود بودند (وب این‌ها را در
// فازهای VIP/استوری/عکسِ پروفایل به getPublicUserProfile اضافه کرده بود)؛ این فایلِ موبایل فقط
// تا امروز آن‌ها را در تایپ نمی‌شناخت، یعنی همیشه در پاسخ می‌آمدند ولی هیچ‌جای موبایل ازشان
// استفاده نمی‌کرد.
import { apiFetch } from '@/lib/session';

export type PublicUserProfile = {
  id: string;
  name: string | null;
  memberSinceYear: number;
  listingsCount: number;
  realEstateCount: number;
  isVip: boolean;
  hasActiveStory: boolean;
  photoUrl: string | null;
};

type PublicProfileResponse = { profile: PublicUserProfile | null };

/** null یعنی کاربر وجود ندارد یا مسدود شده — دقیقاً هم‌قاعده‌ی getPublicUserProfile وب. */
export async function getPublicUserProfile(id: string): Promise<PublicUserProfile | null> {
  const res = await apiFetch(`/api/mobile/v1/users/${id}`);
  const data: PublicProfileResponse = await res.json();
  return data.profile;
}