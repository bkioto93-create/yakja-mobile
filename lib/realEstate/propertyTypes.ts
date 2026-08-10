// مسیر فایل: lib/realEstate/propertyTypes.ts
// تعریف کامل انواع ملک پشتیبانی‌شده ماژول «املاک» — تسک ۱ فاز ۰۵.
// دقیقاً هم‌الگو با src/lib/marketplace/categories.ts (فاز ۰۲، تسک ۱) و
// src/lib/transport/vehicleTypes.ts (فاز ۰۳، تسک ۱): این فایل عمداً فقط ساختار/شناسه/آیکون هر
// نوع ملک را مشخص می‌کند؛ برچسب متنی هرگز اینجا هاردکد نمی‌شود (طبق الزام قطعی ۲) و همیشه باید
// در کامپوننت مصرف‌کننده، از طریق dict.realEstate.propertyTypes خوانده شود. مقدار id دقیقاً همان
// مقداری خواهد بود که در تسک ۲ (تکمیل فیلدهای جدول real_estate) در ستون real_estate.property_type
// — با یک CHECK constraint هم‌سو با همین لیست — ذخیره می‌شود؛ فهرست کامل و بدون‌حذف طبق تسک ۱
// همین فاز: فروش خانه، اجاره خانه، فروش زمین، باغ، مغازه، سوله، سایر.
import { Icons } from "@/components/ui/Icons";

export const PROPERTY_TYPES = [
  { id: "house_sale", dictKey: "houseSale", icon: Icons.PropertyHouseSale },
  { id: "house_rent", dictKey: "houseRent", icon: Icons.PropertyHouseRent },
  { id: "land_sale", dictKey: "landSale", icon: Icons.PropertyLand },
  { id: "garden", dictKey: "garden", icon: Icons.PropertyGarden },
  { id: "shop", dictKey: "shop", icon: Icons.PropertyShop },
  { id: "warehouse", dictKey: "warehouse", icon: Icons.PropertyWarehouse },
  // برای «سایر» عمداً آیکون تازه ساخته نشد؛ همان Icons.CategoryOther (فاز ۰۲) استفاده شد — دقیقاً
  // همان تصمیمی که در src/lib/transport/vehicleTypes.ts هم گرفته شد — تا نماد «سایر» در کل اپ
  // (کالا/حمل‌ونقل/خدمات/املاک) یکدست بماند.
  { id: "other", dictKey: "other", icon: Icons.CategoryOther },
] as const;

export type PropertyTypeId = (typeof PROPERTY_TYPES)[number]["id"];

// اعتبارسنجی مقدار نوع ملک پیش از هرگونه درج/ویرایش آگهی ملک (هماهنگ با CHECK constraint
// دیتابیس که در تسک ۲ روی ستون real_estate.property_type اضافه خواهد شد — این فایل تک‌نقطه‌ی
// حقیقت (Single Source of Truth) در سمت کد است، دقیقاً هم‌الگو با ماژول کالا و حمل‌ونقل).
export function isValidPropertyType(value: string): value is PropertyTypeId {
  return PROPERTY_TYPES.some((p) => p.id === value);
}

