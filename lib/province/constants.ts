// مسیر فایل: lib/province/constants.ts
// 🆕 فایل تازه — معادل موبایلیِ src/lib/province/constants.ts وب. وب این مقدار را در یک کوکی
// (yakja_province) نگه می‌دارد؛ موبایل به‌جای کوکی از expo-secure-store استفاده می‌کند — دقیقاً
// همان الگویی که context/LanguageContext.tsx و components/DisclaimerModal.tsx از قبل برای
// ذخیره‌ی یک انتخاب ساده و بادوام کاربر به کار برده‌اند (یکدست نگه‌داشتن الگوی Storage در کل اپ).
//
// مقدار ذخیره‌شده یا یکی از ۳۴ شناسه‌ی lib/provinces.ts است، یا رشته‌ی خاص ALL_PROVINCES_VALUE
// (یعنی «همه‌ی افغانستان» — کاربر عمداً فیلتر ولایتی نمی‌خواهد).
export const PROVINCE_STORAGE_KEY = 'yakja_province';

// مقدار ویژه‌ی «همه‌ی افغانستان» — یعنی بدون فیلتر ولایتی. عیناً همان رشته‌ی وب
// (src/lib/province/constants.ts::ALL_PROVINCES_VALUE) تا اگر روزی نیازی به هماهنگی مقدار بین
// دو پلتفرم پیش آمد (مثلاً یک Deep Link مشترک)، همان رشته کار کند.
export const ALL_PROVINCES_VALUE = 'all';