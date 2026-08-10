// مسیر فایل: lib/webAssets.ts
// درخواست کارفرما: «آیکون‌های دسترسی سریع و آیکون بنر رو در پروژه‌ی وب تغییر دادیم؛ موبایل هم از
// همان‌جا بخواندشان» — پنج فایل PNG که کارفرما مستقیماً در پوشه‌ی public/ پروژه‌ی وب گذاشته:
//   public/icons/quick-listings.png    public/icons/quick-transport.png
//   public/icons/quick-services.png    public/icons/quick-realestate.png
//   public/images/hero-icon.png
//
// 🛠️ اصلاح (بنرهای CategoryBanner گم‌شده): وب برای بخش «دسترسی عاجل» (QuickAccess grid) و بخش
// بنرهای تبلیغاتی (CategoryBanner) دو مجموعه‌ی تصویر کاملاً جدا دارد — نه یکی. رجوع کنید به
// src/app/[lang]/page.tsx وب: چهار CategoryBanner با imageSrc="/banners/*-banner.webp" (تصاویر
// عریض)، جدا از چهار آیتم QuickAccess با imageSrc="/icons/quick-*.png" (آیکون‌های کوچک مربعی).
// این فایل قبلاً فقط همان پنج آیکون کوچک را تعریف کرده بود؛ چهار بنر عریض هرگز اضافه نشده بودند —
// نتیجه‌اش این بود که app/(tabs)/index.tsx مجبور شد همان آیکون‌های کوچکِ WebAssetIcons.quick* را
// هم داخل CategoryBanner (که برای یک تصویر عریض طراحی شده) استفاده کند، دقیقاً همان چیزی که در
// موبایل «تصاویر ناهماهنگ» به‌نظر می‌رسد. چهار مقدار زیر مستقیماً از همان فایل‌های واقعی‌ای که در
// public/banners/ پروژه‌ی وب هستند خوانده می‌شوند.
//
// چرا این فایل‌ها را به پروژه‌ی موبایل کپی نکردیم: خودِ Next.js هرچه در public/ باشد را مستقیم
// روی همان دامنه سرو می‌کند (public/icons/quick-listings.png → https://<دامنه>/icons/quick-listings.png
// — پیشوند «public» در URL نهایی حذف می‌شود، قرارداد خودِ Next.js). پس ساده‌ترین و درست‌ترین راه
// این بود که موبایل هم مستقیم همان آدرس اینترنتی را با <Image> بارگذاری کند — دقیقاً هم‌الگو با
// تمام تصویرهای دیگر همین اپ (آگهی‌ها، عکس متخصص/راننده و…) که همیشه از یک URL راه دور خوانده
// می‌شوند، نه از assets/ محلی. این‌طوری هم یک منبع حقیقتِ واحد می‌ماند: هر بار کارفرما این
// آیکون‌ها را در پنل ادمین/پروژه‌ی وب عوض کند، موبایل هم بدون نیاز به هیچ Build یا تحویل فایل
// تازه‌ای، خودکار همان تصویر تازه را نشان می‌دهد.
//
// دامنه از همان EXPO_PUBLIC_API_BASE_URL خوانده می‌شود که از قبل (فاز M01، lib/session.ts) برای
// تمام تماس‌های پل موبایل استفاده می‌شود — چون این فایل‌های PNG هم روی همان دامنه‌ی پروژه‌ی وب سرو
// می‌شوند؛ یک متغیر محیطی تازه لازم نبود.
//
// ⚠️ **نکته‌ی مهم که حین همین بررسی پیدا شد (خارج از دامنه‌ی مستقیم این درخواست، ولی حیاتی):**
// در فایل .env فعلی پروژه‌ی موبایل، EXPO_PUBLIC_API_BASE_URL خالی است. این یعنی نه‌فقط این پنج
// آیکون، بلکه هر تماس دیگری که از فاز M02 تا M07 با پل موبایل ساخته شده (ثبت آگهی، پروفایل
// راننده/متخصص، گزارش تخلف، پروفایل عمومی، بنرهای «تازه‌ها» و…) در حال حاضر کار نمی‌کند — چون
// apiFetch (lib/session.ts) با یک دامنه‌ی خالی درخواست می‌فرستد. این مقدار باید با آدرس واقعیِ
// دیپلوی‌شده‌ی پروژه‌ی وب (مثلاً https://yakja.app یا هر دامنه‌ای که برایش تنظیم کرده‌اید) پر شود؛
// این مسئله ربطی به همین تسک ندارد، ولی چون همان متغیر اینجا هم استفاده شد، لازم بود گفته شود.
const WEB_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/** آدرس‌های اینترنتیِ کامل پنج تصویر سفارشی که کارفرما در پروژه‌ی وب قرار داده. */
export const WebAssetIcons = {
  quickListings: `${WEB_BASE_URL}/icons/quick-listings.png`,
  quickTransport: `${WEB_BASE_URL}/icons/quick-transport.png`,
  quickServices: `${WEB_BASE_URL}/icons/quick-services.png`,
  quickRealEstate: `${WEB_BASE_URL}/icons/quick-realestate.png`,
  heroIcon: `${WEB_BASE_URL}/images/hero-icon.png`,
  // بنرهای تبلیغاتیِ عریضِ CategoryBanner — معادل دقیقِ imageSrc چهار CategoryBanner در
  // src/app/[lang]/page.tsx وب. با آیکون‌های کوچکِ بالا اشتباه گرفته نشوند.
  bannerListings: `${WEB_BASE_URL}/banners/marketplace-banner.webp`,
  bannerTransport: `${WEB_BASE_URL}/banners/transport-banner.webp`,
  bannerServices: `${WEB_BASE_URL}/banners/services-banner.webp`,
  bannerRealEstate: `${WEB_BASE_URL}/banners/real-estate-banner.webp`,
  // تصویرِ بخشِ «یکجا چیست؟» — همان فایلی که پرامپتِ تولیدش در پیام تحویل همین تسک آمده و باید
  // در public/images/about-yakja.webp پروژه‌ی وب ذخیره شود (دقیقاً هم‌الگو با بقیه‌ی تصاویر
  // بالا). معادل مستقیمِ src/images/about-yakja.webp استفاده‌شده در src/app/[lang]/HomeAbout.tsx
  // وب.
  aboutIllustration: `${WEB_BASE_URL}/images/about-yakja.webp`,
};