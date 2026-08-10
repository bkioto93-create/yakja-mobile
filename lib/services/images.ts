// مسیر فایل: lib/services/images.ts
// فایل تازه — فاز M04، تسک ۱.
//
// معادل موبایل src/lib/services/images.ts در ریپازیتوری وب. دقیقاً هم‌الگو با
// lib/transport/images.ts (فاز M03، تسک ۱) و lib/marketplace/images.ts (فاز M02): مسیر خامِ
// ذخیره‌شده در ستون service_providers.images (مثل "owner-uuid/167000_0.jpg") را به یک URL کامل
// و قابل‌بارگذاری در <Image source={{ uri }}> تبدیل می‌کند. باکت service-providers-images از فاز
// ۰۰ «عمومی» (public) تعریف شده — دقیقاً هم‌الگو با باکت‌های listings-images/drivers-images.
//
// یادداشت مهم (طبق همان درسِ باگ فاز M02): تابع Postgres get_active_service_providers مسیر خام را
// برمی‌گرداند، نه URL کامل را؛ این تبدیل باید همیشه در همین یک نقطه (lib/services/api.ts) انجام
// شود، نه در خودِ کامپوننت رابط کاربری — تا اگر روزی نام باکت یا الگوی URL عوض شد، فقط همین فایل
// تغییر کند.
const SERVICE_PROVIDERS_BUCKET = 'service-providers-images';

export function getServiceProviderImageUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${baseUrl}/storage/v1/object/public/${SERVICE_PROVIDERS_BUCKET}/${path}`;
}

export function getServiceProviderImageUrls(paths: string[]): string[] {
  return paths.map(getServiceProviderImageUrl);
}
