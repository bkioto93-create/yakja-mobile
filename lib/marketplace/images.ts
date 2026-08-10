// مسیر فایل: lib/marketplace/images.ts
// فایل تازه — رفع باگ کشف‌شده در ممیزی i18n/RTL فاز M02 (تسک ۹).
//
// معادل موبایل src/lib/marketplace/images.ts در ریپازیتوری وب. قبلاً در کامنت‌های
// lib/marketplace/mutations.ts و lib/marketplace/api.ts آمده بود که ساخت URL عمومی تصویر
// «با تابع همتای mobile/lib/marketplace/images.ts انجام می‌شود» — اما این فایل هرگز واقعاً
// ساخته نشده بود. نتیجه‌ی این نبود: مسیر خام ذخیره‌شده در ستون listings.images (مثل
// "owner-uuid/167000_0.jpg") بدون هیچ تبدیلی مستقیم به <Image source={{ uri }}> داده می‌شد که
// یک URI معتبر نیست — یعنی هیچ عکس آگهی‌ای در اپ موبایل نمایش داده نمی‌شد.
//
// این فایل دقیقاً هم‌الگوی وب است، فقط با EXPO_PUBLIC_SUPABASE_URL به‌جای NEXT_PUBLIC_SUPABASE_URL
// (چون باکت listings-images از فاز ۰۰ «عمومی» تعریف شده، نیازی به Sign کردن نیست).
const LISTINGS_BUCKET = 'listings-images';

export function getListingImageUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${baseUrl}/storage/v1/object/public/${LISTINGS_BUCKET}/${path}`;
}

export function getListingImageUrls(paths: string[]): string[] {
  return paths.map(getListingImageUrl);
}