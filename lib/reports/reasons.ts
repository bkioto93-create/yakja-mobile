// مسیر فایل: lib/reports/reasons.ts
// تسک ۴ فاز ۰۶ — تک‌نقطه‌ی حقیقت (Single Source of Truth) برای «دلیل گزارش» (reports.reason)،
// دقیقاً هم‌الگو با src/lib/realEstate/propertyTypes.ts (فاز ۰۵، تسک ۱) و
// src/lib/transport/vehicleTypes.ts (فاز ۰۳، تسک ۱): این فایل عمداً فقط ساختار/شناسه/آیکون هر
// دلیل را مشخص می‌کند؛ برچسب متنی هرگز اینجا هاردکد نمی‌شود (طبق الزام قطعی ۲) و همیشه باید در
// کامپوننت مصرف‌کننده، از طریق dict.reports.newPage.reasons خوانده شود.
//
// مقدار id دقیقاً همان ۴ مقداری است که از تسک ۱ همین فاز، با CHECK constraint روی ستون
// reports.reason قفل شده‌اند (مهاجرت 19_phase_06_reports_columns.sql): scam، inappropriate_content،
// fake_listing، other — دقیقاً منطبق بر متن تسک ۴ («کلاهبرداری، محتوای نامناسب، آگهی جعلی، سایر»).
//
// برای «سایر» عمداً آیکون تازه ساخته نشد؛ همان Icons.CategoryOther موجود (که هم‌اکنون در
// کالا/حمل‌ونقل/خدمات/املاک برای همین مفهوم استفاده می‌شود) اینجا هم بازاستفاده شد — دقیقاً همان
// تصمیمی که در propertyTypes.ts/vehicleTypes.ts گرفته شده بود — تا نماد «سایر» در کل اپ یکدست بماند.
import { Icons } from "@/components/ui/Icons";

export const REPORT_REASONS = [
  { id: "scam", dictKey: "scam", icon: Icons.ReportScam },
  { id: "inappropriate_content", dictKey: "inappropriateContent", icon: Icons.ReportInappropriate },
  { id: "fake_listing", dictKey: "fakeListing", icon: Icons.ReportFakeListing },
  { id: "other", dictKey: "other", icon: Icons.CategoryOther },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

// اعتبارسنجی مقدار دلیل گزارش پیش از هرگونه درج گزارش تازه (هماهنگ با CHECK constraint دیتابیس
// که در تسک ۱ همین فاز روی ستون reports.reason اضافه شده — این فایل تک‌نقطه‌ی حقیقت در سمت کد
// است، دقیقاً هم‌الگو با بقیه‌ی ماژول‌ها).
export function isValidReportReason(value: string): value is ReportReason {
  return REPORT_REASONS.some((r) => r.id === value);
}

