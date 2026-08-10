// مسیر فایل: lib/realEstate/images.ts — فاز M05، تسک ۱
// دقیقاً هم‌الگو با lib/marketplace/images.ts (فاز M02) و lib/services/images.ts (فاز M04):
// ساخت آدرس عمومی (Public URL) تصویر آگهی ملک از روی مسیر خامِ ذخیره‌شده در ستون
// real_estate.images (مثلاً "owner-uuid/167000_0.jpg"). چون باکت real-estate-images از فاز M00
// «عمومی» (public) تعریف شده (docs/YAKJA_DATABASE_LOG.md)، این آدرس بدون نیاز به هیچ Sign
// کردنی مستقیماً در <Image source={{ uri }}> قابل استفاده است.
const REAL_ESTATE_BUCKET = 'real-estate-images';

export function getRealEstateImageUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${baseUrl}/storage/v1/object/public/${REAL_ESTATE_BUCKET}/${path}`;
}

export function getRealEstateImageUrls(paths: string[]): string[] {
  return paths.map(getRealEstateImageUrl);
}