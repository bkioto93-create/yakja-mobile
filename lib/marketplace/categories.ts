// مسیر فایل: lib/marketplace/categories.ts
// تعریف کامل دسته‌بندی‌های ماژول «خرید و فروش کالا» — تسک ۱ فاز ۰۲.
// طبق اصل طلایی ۱ (بند ۲ سند راهبردی: اولویت تصویر بر متن)، هر دسته یک آیکون بزرگ و گویا دارد.
// این فایل عمداً فقط ساختار/شناسه/آیکون هر دسته را مشخص می‌کند؛ برچسب متنی هرگز اینجا هاردکد
// نمی‌شود (طبق الزام قطعی ۲) و همیشه باید در کامپوننت مصرف‌کننده، از طریق dict.marketplace.categories
// خوانده شود. مقدار id دقیقاً همان مقداری است که در ستون listings.category در پایگاه داده ذخیره می‌شود.
import { Icons } from "@/components/ui/Icons";

export const LISTING_CATEGORIES = [
  { id: "food", dictKey: "food", icon: Icons.CategoryFood },
  { id: "building_materials", dictKey: "buildingMaterials", icon: Icons.CategoryBuildingMaterials },
  { id: "clothing", dictKey: "clothing", icon: Icons.CategoryClothing },
  { id: "home_goods", dictKey: "homeGoods", icon: Icons.CategoryHomeGoods },
  { id: "motorcycle", dictKey: "motorcycle", icon: Icons.CategoryMotorcycle },
  { id: "car", dictKey: "car", icon: Icons.CategoryCar },
  { id: "livestock", dictKey: "livestock", icon: Icons.CategoryLivestock },
  { id: "agriculture", dictKey: "agriculture", icon: Icons.CategoryAgriculture },
  { id: "other", dictKey: "other", icon: Icons.CategoryOther },
] as const;

export type ListingCategoryId = (typeof LISTING_CATEGORIES)[number]["id"];

// اعتبارسنجی مقدار دسته پیش از هرگونه درج/ویرایش آگهی (هماهنگ با CHECK constraint دیتابیس
// در ستون listings.category — این فایل تک‌نقطه‌ی حقیقت (Single Source of Truth) در سمت کد است).
export function isValidListingCategory(value: string): value is ListingCategoryId {
  return LISTING_CATEGORIES.some((c) => c.id === value);
}

