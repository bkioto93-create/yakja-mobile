// مسیر فایل: lib/reports/reportTargets.ts
// تسک ۱ فاز ۰۶ — تک‌نقطه‌ی حقیقت (Single Source of Truth) برای «نوع هدف گزارش‌شده»
// (target_type)، هم‌راستا با CHECK constraint ستون reports.target_type
// (مهاجرت 19_phase_06_reports_columns.sql، همین تسک).
//
// تفاوت مهم با propertyTypes.ts/vehicleTypes.ts/categories.ts: این فایل بدون آیکون و بدون
// dictKey است، چون target_type هرگز مستقیماً توسط کاربر از یک منو انتخاب نمی‌شود؛ بلکه خودِ
// دکمه‌ی «گزارش تخلف» — که طبق برنامه در تسک ۳ همین فاز روی هر آگهی/پروفایل قرار می‌گیرد —
// از روی صفحه‌ای که کاربر در آن قرار دارد (آگهی کالا، پروفایل راننده، متخصص، آگهی ملک، یا
// پروفایل کاربر) به‌صورت خودکار target_type درست را می‌فرستد. این فایل صرفاً برای اعتبارسنجی
// سمت سرور (دفاع در عمق، هم‌سو با الگوی isValidPropertyType/isValidVehicleType) استفاده می‌شود.
export const REPORT_TARGET_TYPES = [
  { id: "listing" },
  { id: "driver" },
  { id: "service_provider" },
  { id: "real_estate" },
  { id: "user" },
] as const;

export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number]["id"];

// اعتبارسنجی مقدار نوع هدف پیش از هرگونه درج گزارش تازه (هماهنگ با CHECK constraint دیتابیس —
// این فایل تک‌نقطه‌ی حقیقت در سمت کد است، دقیقاً هم‌الگو با بقیه‌ی ماژول‌ها).
export function isValidReportTargetType(value: string): value is ReportTargetType {
  return REPORT_TARGET_TYPES.some((t) => t.id === value);
}

