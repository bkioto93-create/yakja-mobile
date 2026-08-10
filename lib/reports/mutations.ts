// مسیر فایل: lib/reports/mutations.ts — فاز M06، تسک ۲
//
// طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل، ثبت گزارش (که نیاز به احراز هویت دارد — reporter_id
// از توکن، نه از ورودی کاربر) از پل موبایل رد می‌شود، نه مستقیم با Anon Key. دقیقاً هم‌الگو با
// lib/services/providerProfile.ts (فاز M04، تسک ۳): صفر منطق تجاری تازه، فقط یک Route تازه
// (`POST /api/mobile/v1/reports`، زیر پوشه‌ی جدا web-repo-routes/ تحویل داده شده) که خودش عیناً
// همان createReportAction از-قبل-موجود و تست‌شده‌ی وب (src/app/[lang]/report/new/actions.ts) را
// صدا می‌زند.
import { apiFetch } from '@/lib/session';
import type { ReportReason } from './reasons';
import type { ReportTargetType } from './reportTargets';

/** خطای برگشتی از Route؛ code دقیقاً یکی از کلیدهای dict.reports.newPage.errors است. */
export class ReportApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export type CreateReportPayload = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  /** آزاد و اختیاری — رشته‌ی خالی هم مجاز است (سرور آن را با description?.trim() || null به
   *  null تبدیل می‌کند، دقیقاً طبق actions.ts). */
  description: string;
};

type CreateReportResponse = { success: true } | { success: false; error: string };

export async function createReport(payload: CreateReportPayload): Promise<void> {
  const res = await apiFetch('/api/mobile/v1/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data: CreateReportResponse = await res.json();
  if (!data.success) throw new ReportApiError(data.error);
}