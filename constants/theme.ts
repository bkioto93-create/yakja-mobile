// مسیر فایل: constants/theme.ts
// توکن‌های طراحی برند «یکجا» — دقیقاً همان مقادیر src/app/globals.css در پروژه‌ی وب.
// هر تغییر رنگ باید هم‌زمان اینجا و در پروژه‌ی وب اعمال شود (تک‌نقطه‌ی حقیقت، بند ۶ سند راهبردی موبایل).
//
// یادداشت تسک ۱ فاز M00B: دو توکن `success`/`danger` برای کامپوننت‌های Input (حالت خطا) و
// Toast (پیام موفقیت/خطا) اضافه شدند. این دو مقدار در globals.css وب موجود نبودند (فقط
// primary/accent تعریف شده بود)، پس فعلاً به همون سبک Tailwind بقیه‌ی پالت (green-500/red-500)
// انتخاب شدند — پیش از هم‌سویی نهایی، این دو مقدار را با پروژه‌ی وب تایید کنید.

export const Colors = {
  primary: '#06b6d4',
  primaryDark: '#0891b2',
  accent: '#f97316',
  accentDark: '#ea580c',
  success: '#22c55e',
  danger: '#ef4444',
  bgBase: '#f8fafc',
  textMain: '#0f172a',
  textMuted: '#475569',
  white: '#ffffff',
  border: '#e2e8f0',
  // **افزوده‌شده (هم‌سازی با بازطراحیِ Premium Enterprise / Dark Mode بنر اصلیِ وب):**
  // heroDark دقیقاً همان #0B1121 است که در src/app/[lang]/page.tsx وب برای بک‌گراند بنر
  // اصلی/کاور موبایلی و بنر اسپلیت دسکتاپی استفاده شد. blue600 دومین رنگِ افکتِ نوریِ محو
  // (Mesh Gradient) پشتِ بنر است — معادل کلاسِ Tailwind `blue-600` وب.
  heroDark: '#0B1121',
  blue600: '#2563eb',
  // **افزوده‌شده (بازطراحیِ کامل — تعمیقِ رنگِ بنر در سراسر اپ):** طبق درخواستِ صریحِ کارفرما
  // («این گرادیانت رو به سراسر اپ تعمیق بدید»)، این چهار توکنِ تازه پایه‌ی هر سطحِ تیره‌ی دیگری
  // در اپ هستند — دقیقاً معادلِ توکن‌های تازه‌ی globals.css وب (--color-hero-dark-elevated/
  // --color-on-dark/...)، تا هر دو پروژه یک منبعِ رنگیِ واحد داشته باشند.
  //   heroDarkElevated: یک پله روشن‌تر از heroDark — برای سطوحی که روی خودِ heroDark می‌نشینند
  //     (مثلاً یک کارت روی نوار تیره) و باید از پس‌زمینه‌شان قابل‌تشخیص باشند.
  //   onDark/onDarkMuted/onDarkBorder: معادلِ textMain/textMuted/border برای متن و حاشیه‌ی روی
  //     پس‌زمینه‌ی تیره — چون خودِ textMain/textMuted روی heroDark عملاً نامرئی می‌شوند (دقیقاً
  //     همان باگی که در NotificationBell/ProvinceBar قبلاً رفع شد؛ این توکن‌ها همان رفع را به
  //     یک الگوی رسمی و قابل‌استفاده در همه‌جا تبدیل می‌کنند).
  heroDarkElevated: '#141b2e',
  onDark: '#ffffff',
  onDarkMuted: 'rgba(255,255,255,0.65)',
  onDarkBorder: 'rgba(255,255,255,0.12)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
} as const;

export const Fonts = {
  regular: 'Vazirmatn-Regular',
  bold: 'Vazirmatn-Bold',
} as const;