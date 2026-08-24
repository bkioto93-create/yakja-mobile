// مسیر فایل: lib/users/profilePhotoUrl.ts
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، قابلیت «آپلود عکس پروفایل») — ساخت آدرس عمومی
// (Public URL) عکس پروفایل از روی مسیر ذخیره‌شده — دقیقاً هم‌الگو با
// src/lib/users/profilePhotoUrl.ts وب، فقط با EXPO_PUBLIC_SUPABASE_URL به‌جای
// NEXT_PUBLIC_SUPABASE_URL (همان تفاوتِ استانداردِ نام‌گذاریِ متغیرهای محیطیِ این دو پلتفرم؛
// مقدارِ خودش عیناً همان پروژه‌ی Supabase است — رجوع کنید به lib/supabase.ts).
const PROFILE_PHOTOS_BUCKET = 'profile-photos';

export function getProfilePhotoUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${PROFILE_PHOTOS_BUCKET}/${path}`;
}