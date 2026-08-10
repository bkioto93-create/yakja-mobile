// مسیر فایل: lib/services/categoryIcons.ts
// فایل تازه — فاز M04، تسک ۱.
//
// معادل موبایل src/lib/services/serviceCategoryIcons.ts در ریپازیتوری وب — با یک تفاوت عمدی: نسخه‌ی
// وب هم برای رندر آیکون در فهرست عمومی استفاده می‌شود و هم برای «انتخابگر آیکون» در فرم مدیریت
// تخصص‌های پنل ادمین (dictKey/label برای هر گزینه، isValidBuiltinIconKey برای اعتبارسنجی هنگام
// درج/ویرایش). پنل ادمین فقط در نسخه‌ی وب وجود دارد — این اپ موبایل هرگز تخصص جدید نمی‌سازد یا
// آیکون یک تخصص را عوض نمی‌کند، فقط آیکونِ از-قبل-ذخیره‌شده در دیتابیس را می‌خواند و نشان می‌دهد؛
// پس این نسخه فقط بخش «خواندن/نمایش» را دارد (SERVICE_CATEGORY_ICON_MAP + getBuiltinIconComponent)،
// بدون آرایه‌ی dictKey/label و بدون isValidBuiltinIconKey.
//
// کلید هر ردیف دقیقاً همان چیزی است که ممکن است در ستون service_categories.icon_key ذخیره شده
// باشد (برای ۱۰ تخصص پایه، طبق 10_phase_04_service_categories_schema.sql در وب). خودِ گلیف‌ها
// (Icons.Service...) در تسک همین فاز به components/ui/Icons.tsx اضافه شدند.
import { Icons, type IconComponent } from '@/components/ui/Icons';

export const SERVICE_CATEGORY_ICON_MAP: Record<string, IconComponent> = {
  ServiceBuilder: Icons.ServiceBuilder,
  ServiceElectrician: Icons.ServiceElectrician,
  ServicePlumber: Icons.ServicePlumber,
  ServiceCarpenter: Icons.ServiceCarpenter,
  ServicePainter: Icons.ServicePainter,
  ServiceWelder: Icons.ServiceWelder,
  ServiceMechanic: Icons.ServiceMechanic,
  ServiceDailyWorker: Icons.ServiceDailyWorker,
  ServiceTailor: Icons.ServiceTailor,
  // «ServiceOther» عمداً به Icons.CategoryOther نگاشت شده، نه یک آیکون تازه — دقیقاً هم‌الگو با
  // تصمیم مشابه در src/lib/services/serviceCategoryIcons.ts وب (نماد «سایر» در کل اپ یکدست بماند).
  ServiceOther: Icons.CategoryOther,
  Wrench: Icons.Wrench,
  User: Icons.User,
  Box: Icons.Box,
  Truck: Icons.Truck,
};

// برای رندر ایمن یک ردیف دیتابیسی: اگر icon_key ناشناخته/قدیمی بود (مثلاً بعداً از کتابخانه‌ی وب
// حذف شد)، به‌جای کرش کردن رابط کاربری، آیکون خنثی «سایر» نمایش داده می‌شود — دقیقاً هم‌الگو با
// getBuiltinIconComponent در نسخه‌ی وب.
export function getBuiltinIconComponent(key: string | null): IconComponent {
  if (key && SERVICE_CATEGORY_ICON_MAP[key]) return SERVICE_CATEGORY_ICON_MAP[key];
  return Icons.CategoryOther;
}
