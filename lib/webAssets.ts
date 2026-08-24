// مسیر فایل: lib/webAssets.ts
// درخواست کارفرما: «آیکون‌های دسترسی سریع و آیکون بنر رو در پروژه‌ی وب تغییر دادیم؛ موبایل هم از
// همان‌جا بخواندشان» — تصاویری که کارفرما مستقیماً در پوشه‌ی public/ پروژه‌ی وب گذاشته.
//
// 🛠️ رفع باگ (فاز M09 — همگام‌سازی با وب): چهار مسیرِ «دسترسی عاجل» (quickListings/
// quickTransport/quickServices/quickRealEstate) قبلاً به public/icons/quick-*.png اشاره
// می‌کردند. بررسی مستقیم پروژه‌ی وب نشان داد این پنج فایل PNG دیگر اصلاً در public/icons/ وجود
// ندارند — کارفرما در بازطراحیِ چهارمِ «دسترسی عاجل» (رجوع کنید به کامنت بالای
// src/app/[lang]/page.tsx وب) آن‌ها را کاملاً با پنج فایل تازه‌ی 400x400 در public/banners/
// جایگزین کرده: quick-access-listings.webp, quick-access-transport.webp,
// quick-access-services.webp, quick-access-real-estate.webp (این چهار مورد را با bannerListings
// و همکارانش پایین همین فایل اشتباه نگیرید — آن‌ها بنرهای عریضِ CategoryBanner هستند، این‌ها
// عکس‌های تقریباً مربعِ خودِ کارت‌های دسترسی عاجل). یعنی از زمانِ آن بازطراحی تا همین لحظه، هر
// چهار آیکونِ دسترسی عاجلِ موبایل عملاً ۴۰۴ می‌گرفتند و بی‌صدا (طبق طراحیِ عمدیِ ModuleCard.tsx)
// به آیکونِ Ionicons جایگزین برمی‌گشتند — نه یک کرش، ولی قطعاً نه همان تصویرِ سفارشیِ مدنظرِ
// کارفرما. مسیرها اینجا با مقادیرِ درستِ فعلی جایگزین شدند.
//
// چرا این فایل‌ها را به پروژه‌ی موبایل کپی نکردیم: خودِ Next.js هرچه در public/ باشد را مستقیم
// روی همان دامنه سرو می‌کند (public/banners/quick-access-listings.webp → https://<دامنه>/banners/
// quick-access-listings.webp — پیشوند «public» در URL نهایی حذف می‌شود، قرارداد خودِ Next.js).
// پس ساده‌ترین و درست‌ترین راه این بود که موبایل هم مستقیم همان آدرس اینترنتی را با <Image>
// بارگذاری کند — دقیقاً هم‌الگو با تمام تصویرهای دیگر همین اپ (آگهی‌ها، عکس متخصص/راننده و…) که
// همیشه از یک URL راه دور خوانده می‌شوند، نه از assets/ محلی. این‌طوری هم یک منبع حقیقتِ واحد
// می‌ماند: هر بار کارفرما این تصاویر را در پروژه‌ی وب عوض کند، موبایل هم بدون نیاز به هیچ Build
// یا تحویل فایل تازه‌ای، خودکار همان تصویر تازه را نشان می‌دهد.
//
// دامنه از همان EXPO_PUBLIC_API_BASE_URL خوانده می‌شود که از قبل (فاز M01، lib/session.ts) برای
// تمام تماس‌های پل موبایل استفاده می‌شود — چون این فایل‌ها هم روی همان دامنه‌ی پروژه‌ی وب سرو
// می‌شوند؛ یک متغیر محیطی تازه لازم نبود.
const WEB_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/** آدرس‌های اینترنتیِ کامل تصاویر سفارشی‌ای که کارفرما در پروژه‌ی وب قرار داده. */
export const WebAssetIcons = {
  // 🛠️ اصلاح‌شده (فاز M09) — رجوع کنید به یادداشت بالای فایل: مسیرِ درستِ فعلی، نه مسیرِ
  // حذف‌شده‌ی قبلی. این چهار عکس دقیقاً همان‌هایی هستند که در بازطراحیِ تازه‌ی گریدِ «دسترسی
  // عاجل» (چهارستونه، هر کارت با دایره‌ی رنگیِ فلش زیرش) در ModuleCard.tsx مصرف می‌شوند.
  quickListings: `${WEB_BASE_URL}/banners/quick-access-listings.webp`,
  quickTransport: `${WEB_BASE_URL}/banners/quick-access-transport.webp`,
  quickServices: `${WEB_BASE_URL}/banners/quick-access-services.webp`,
  quickRealEstate: `${WEB_BASE_URL}/banners/quick-access-real-estate.webp`,
  heroIcon: `${WEB_BASE_URL}/images/hero-icon.png`,
  // بنرهای تبلیغاتیِ عریضِ CategoryBanner — این‌ها فعلاً در هیچ صفحه‌ای مصرف نمی‌شوند (طبق تصمیم
  // صریحِ کارفرما، CategoryBanner از صفحه‌ی اصلیِ موبایل حذف شد؛ رجوع کنید به کامنتِ بالای
  // app/(tabs)/index.tsx). عمداً حذف نشدند — بدون‌ضرر، و اگر بعداً همین بنرها جای دیگری لازم شد
  // (مثلاً بالای خودِ صفحه‌ی هر ماژول)، همین‌جا آماده‌اند.
  bannerListings: `${WEB_BASE_URL}/banners/marketplace-banner.webp`,
  bannerTransport: `${WEB_BASE_URL}/banners/transport-banner.webp`,
  bannerServices: `${WEB_BASE_URL}/banners/services-banner.webp`,
  bannerRealEstate: `${WEB_BASE_URL}/banners/real-estate-banner.webp`,
  // تصویرِ بخشِ «یکجا چیست؟» — معادل مستقیمِ src/images/about-yakja.webp استفاده‌شده در
  // src/app/[lang]/HomeAbout.tsx وب.
  aboutIllustration: `${WEB_BASE_URL}/images/about-yakja.webp`,
};