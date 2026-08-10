// مسیر فایل: lib/transport/images.ts
// فایل تازه — فاز M03، تسک ۱.
//
// معادل موبایل src/lib/transport/images.ts در ریپازیتوری وب. دقیقاً هم‌الگو با
// lib/marketplace/images.ts (فاز M02، رفع باگ ممیزی تسک ۹ همان فاز): مسیر خامِ ذخیره‌شده در
// ستون drivers.images (مثل "owner-uuid/167000_0.jpg") را به یک URL کامل و قابل‌بارگذاری در
// <Image source={{ uri }}> تبدیل می‌کند. باکت drivers-images از فاز ۰۰ «عمومی» (public) تعریف
// شده، پس نیازی به Sign کردن نیست — دقیقاً هم‌الگو با باکت listings-images.
//
// یادداشت مهم (طبق همان درسِ باگ فاز M02): تابع Postgres get_active_drivers مسیر خام را برمی‌گرداند،
// نه URL کامل را؛ این تبدیل باید همیشه در همین یک نقطه (lib/transport/api.ts) انجام شود، نه در
// خودِ کامپوننت رابط کاربری — تا اگر روزی نام باکت یا الگوی URL عوض شد، فقط همین فایل تغییر کند.
const DRIVERS_BUCKET = 'drivers-images';

export function getDriverImageUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${baseUrl}/storage/v1/object/public/${DRIVERS_BUCKET}/${path}`;
}

export function getDriverImageUrls(paths: string[]): string[] {
  return paths.map(getDriverImageUrl);
}