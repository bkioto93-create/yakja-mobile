// مسیر فایل: lib/realEstate/dealTypes.ts
// تعریف «نوع معامله» (فروش/اجاره) ماژول «املاک» — تسک ۲ فاز ۰۵.
// دقیقاً هم‌الگو با src/lib/realEstate/propertyTypes.ts (تسک ۱ همین فاز): این فایل عمداً فقط
// ساختار/شناسه هر نوع معامله را مشخص می‌کند؛ برچسب متنی هرگز اینجا هاردکد نمی‌شود (طبق الزام
// قطعی ۲) و همیشه باید در کامپوننت مصرف‌کننده، از طریق dict.realEstate.dealTypes خوانده شود.
// مقدار id دقیقاً همان مقداری است که در ستون real_estate.deal_type (با CHECK constraint هم‌سو،
// در همین تسک ۲ اضافه شد) ذخیره می‌شود.
//
// یادداشت طراحی: «نوع معامله» عمداً از «نوع ملک» (propertyTypes.ts) جدا نگه داشته شده، چون
// خانه، مغازه، سوله و... هرکدام می‌توانند هم فروشی و هم اجاره‌ای باشند (فقط برای «فروش زمین»
// و «باغ»، عملاً همیشه sale انتخاب می‌شود). دو نوع ملک "house_sale"/"house_rent" در
// propertyTypes.ts صرفاً برای انتخاب سریع‌تر آیکونی «خانه» در قدم اول فرم (تسک ۴) نگه داشته
// شده‌اند؛ فیلد deal_type مستقل، منبع حقیقت نهایی برای فیلتر «فروش/اجاره» در جستجو (تسک ۶) است.
export const DEAL_TYPES = [
  { id: "sale", dictKey: "sale" },
  { id: "rent", dictKey: "rent" },
] as const;

export type DealTypeId = (typeof DEAL_TYPES)[number]["id"];

// اعتبارسنجی مقدار نوع معامله پیش از هرگونه درج/ویرایش آگهی ملک (هماهنگ با CHECK constraint
// دیتابیس روی ستون real_estate.deal_type — این فایل تک‌نقطه‌ی حقیقت در سمت کد است).
export function isValidDealType(value: string): value is DealTypeId {
  return DEAL_TYPES.some((d) => d.id === value);
}

