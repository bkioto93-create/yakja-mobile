// مسیر فایل: lib/phone.ts
// اعتبارسنجی و نرمال‌سازی شماره موبایل به فرمت بین‌المللی:
// - افغانستان: +93 + ۹ رقم  (طبق تسک ۳ فاز ۰۱)
// - ایران: +98 + ۱۰ رقم  (افزوده‌شده برای ادمین/تسترهای داخل ایران)
// هر فرمت دیگری رد می‌شود. ورودی می‌تواند با/بدون کد کشور، با/بدون صفر ابتدایی باشد.

export function normalizeAfghanPhone(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, "");

  // --- افغانستان: +93 + ۹ رقم ---
  if (/^\+93\d{9}$/.test(cleaned)) return cleaned;
  if (/^93\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0\d{9}$/.test(cleaned)) return `+93${cleaned.slice(1)}`;
  if (/^\d{9}$/.test(cleaned)) return `+93${cleaned}`;

  // --- ایران: +98 + ۱۰ رقم ---
  if (/^\+98\d{10}$/.test(cleaned)) return cleaned;
  if (/^98\d{10}$/.test(cleaned)) return `+${cleaned}`;
  if (/^0\d{10}$/.test(cleaned)) return `+98${cleaned.slice(1)}`;
  if (/^\d{10}$/.test(cleaned)) return `+98${cleaned}`;

  return null;
}

