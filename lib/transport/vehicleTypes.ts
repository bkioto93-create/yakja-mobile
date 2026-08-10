// مسیر فایل: lib/transport/vehicleTypes.ts
// تعریف کامل انواع وسیله نقلیه ماژول «حمل‌ونقل» — تسک ۱ فاز ۰۳.
// دقیقاً هم‌الگو با src/lib/marketplace/categories.ts (فاز ۰۲، تسک ۱): این فایل عمداً فقط
// ساختار/شناسه/آیکون هر نوع وسیله را مشخص می‌کند؛ برچسب متنی هرگز اینجا هاردکد نمی‌شود (طبق
// الزام قطعی ۲) و همیشه باید در کامپوننت مصرف‌کننده، از طریق dict.transport.vehicleTypes خوانده
// شود. مقدار id دقیقاً همان مقداری خواهد بود که در تسک ۲ (تکمیل فیلدهای جدول drivers) در ستون
// drivers.vehicle_type — با یک CHECK constraint هم‌سو با همین لیست — ذخیره می‌شود.
//
// 🛠️ اصلاح (هم‌سازی با وب): نوع «وانت» (pickup) از اپ حذف شد — دقیقاً هم‌سو با
// src/lib/transport/vehicleTypes.ts وب («درخواست صریح کارفرما: این نوع وسیله در افغانستان رایج
// نیست»). این فایل قبلاً همچنان یک آیتم "pickup" با icon: Icons.VehiclePickup داشت، در حالی که
// components/ui/Icons.tsx از قبل مستندش کرده بود که VehiclePickup عمداً حذف شده — یعنی آن مقدار
// همیشه undefined بود (خواندن یک کلید ناموجود از Icons، نه خطا، فقط undefined). فهرست فعلی، دقیقاً
// هم‌سو با وب: تاکسی، زرنج، ریکشا، تراکتور، کامیون، سایر.
import { Icons } from "@/components/ui/Icons";

export const VEHICLE_TYPES = [
  { id: "taxi", dictKey: "taxi", icon: Icons.VehicleTaxi },
  { id: "zaranj", dictKey: "zaranj", icon: Icons.VehicleZaranj },
  { id: "rickshaw", dictKey: "rickshaw", icon: Icons.VehicleRickshaw },
  { id: "tractor", dictKey: "tractor", icon: Icons.VehicleTractor },
  // برای «کامیون» عمداً آیکون تازه ساخته نشد؛ همان Icons.Truck موجود (که هم‌اکنون در
  // ناوبری/داشبورد برای کل ماژول حمل‌ونقل هم استفاده می‌شود) اینجا مستقیماً بازاستفاده شد.
  { id: "truck", dictKey: "truck", icon: Icons.Truck },
  // برای «سایر» هم از همان Icons.CategoryOther (فاز ۰۲) استفاده شد تا نماد «سایر» در کل اپ
  // (کالا/حمل‌ونقل/...) یکدست بماند، نه یک آیکون جدا برای هر ماژول.
  { id: "other", dictKey: "other", icon: Icons.CategoryOther },
] as const;

export type VehicleTypeId = (typeof VEHICLE_TYPES)[number]["id"];

// اعتبارسنجی مقدار نوع وسیله پیش از هرگونه درج/ویرایش پروفایل راننده (هماهنگ با CHECK
// constraint دیتابیس که در تسک ۲ روی ستون drivers.vehicle_type اضافه خواهد شد — این فایل
// تک‌نقطه‌ی حقیقت (Single Source of Truth) در سمت کد است، دقیقاً هم‌الگو با ماژول کالا).
export function isValidVehicleType(value: string): value is VehicleTypeId {
  return VEHICLE_TYPES.some((v) => v.id === value);
}