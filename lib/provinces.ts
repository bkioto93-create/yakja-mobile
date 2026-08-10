// مسیر فایل: lib/provinces.ts
// 🆕 فایل تازه (هم‌ترازی با فاز ۱۰ وب — قابلیت «ولایت») — تک‌نقطه‌ی حقیقتِ لیست ۳۴ ولایت
// افغانستان در پروژه‌ی موبایل. تا امروز این فایل اصلاً در ریپازیتوری موبایل وجود نداشت — دقیقاً
// همان چیزی که باعث می‌شد اپ موبایل هیچ‌راهی برای «تعریف/انتخاب ولایت» نداشته باشد.
//
// عیناً کپی‌شده از src/lib/provinces.ts وب — همان ۳۴ id، همان ترتیب (مرکز، شرق، جنوب‌شرق/جنوب،
// غرب، مرکز-کوهستانی، شمال)، همان ۵ ولایت پرکاربرد. این تطابق دقیق حیاتی است چون مقدار id همان
// چیزی است که مستقیماً در ستون‌های listings.province / drivers.province /
// service_providers.province / real_estate.province در Supabase (با یک CHECK constraint) ذخیره
// می‌شود؛ یک id متفاوت بین وب و موبایل یعنی داده‌ی ثبت‌شده از موبایل رد می‌شود.
//
// طبق الزام قطعی ۲ (برچسب متنی هرگز هاردکد نمی‌شود)، این فایل هم فقط id/ترتیب را مشخص می‌کند؛
// نام هر ولایت همیشه از طریق dict.province.names[id] خوانده می‌شود (دری در dictionaries/fa.ts،
// پشتو در dictionaries/ps.ts — هر دو در همین تحویل به‌روزرسانی شدند).
export const PROVINCES = [
  { id: 'kabul', dictKey: 'kabul' },
  { id: 'kapisa', dictKey: 'kapisa' },
  { id: 'parwan', dictKey: 'parwan' },
  { id: 'wardak', dictKey: 'wardak' },
  { id: 'logar', dictKey: 'logar' },
  { id: 'nangarhar', dictKey: 'nangarhar' },
  { id: 'laghman', dictKey: 'laghman' },
  { id: 'kunar', dictKey: 'kunar' },
  { id: 'nuristan', dictKey: 'nuristan' },
  { id: 'panjshir', dictKey: 'panjshir' },
  { id: 'paktia', dictKey: 'paktia' },
  { id: 'paktika', dictKey: 'paktika' },
  { id: 'khost', dictKey: 'khost' },
  { id: 'ghazni', dictKey: 'ghazni' },
  { id: 'helmand', dictKey: 'helmand' },
  { id: 'kandahar', dictKey: 'kandahar' },
  { id: 'zabul', dictKey: 'zabul' },
  { id: 'uruzgan', dictKey: 'uruzgan' },
  { id: 'nimroz', dictKey: 'nimroz' },
  { id: 'farah', dictKey: 'farah' },
  { id: 'herat', dictKey: 'herat' },
  { id: 'badghis', dictKey: 'badghis' },
  { id: 'ghor', dictKey: 'ghor' },
  { id: 'daykundi', dictKey: 'daykundi' },
  { id: 'bamyan', dictKey: 'bamyan' },
  { id: 'balkh', dictKey: 'balkh' },
  { id: 'jowzjan', dictKey: 'jowzjan' },
  { id: 'faryab', dictKey: 'faryab' },
  { id: 'sar_e_pol', dictKey: 'sar_e_pol' },
  { id: 'samangan', dictKey: 'samangan' },
  { id: 'baghlan', dictKey: 'baghlan' },
  { id: 'kunduz', dictKey: 'kunduz' },
  { id: 'takhar', dictKey: 'takhar' },
  { id: 'badakhshan', dictKey: 'badakhshan' },
] as const;

export type ProvinceId = (typeof PROVINCES)[number]['id'];

// ۵ ولایت پرجمعیت/پرکاربردتر — عیناً همان لیست وب (src/lib/provinces.ts::POPULAR_PROVINCE_IDS)؛
// به‌عنوان چیپ‌های بزرگ و یک‌لمسی در بالای ProvincePickerModal نمایش داده می‌شوند.
export const POPULAR_PROVINCE_IDS: ProvinceId[] = ['kabul', 'herat', 'balkh', 'kandahar', 'nangarhar'];

// اعتبارسنجی سمت کلاینت پیش از ارسال به سرور — دقیقاً هم‌الگو با isValidProvince وب. سرور
// (createListingAction و بقیه‌ی اکشن‌های وب) خودش هم دوباره همین اعتبارسنجی را انجام می‌دهد؛ این
// فقط برای بازخورد سریع‌تر سمت کاربر است.
export function isValidProvince(value: string): value is ProvinceId {
  return PROVINCES.some((p) => p.id === value);
}