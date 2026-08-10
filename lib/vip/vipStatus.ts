// مسیر فایل: lib/vip/vipStatus.ts
// **کپیِ عینیِ** src/lib/vip/vipStatus.ts وب — تک‌نقطه‌ی حقیقتِ محاسبه‌ی «آیا این کاربر الان VIP
// فعال است؟». طبق یادداشتِ صریحِ خودِ فایلِ وب: «عمداً بدون هیچ وابستگی به Supabase یا
// "server-only" نوشته شده تا... در لایه‌ی API موبایل بدون مشکل قابل‌استفاده باشد» — یعنی
// نویسنده‌ی وب از همان ابتدا این فایل را برای همین کپی‌شدن طراحی کرده بود. هیچ منطقی اینجا
// تغییر نکرده و نباید بکند؛ اگر روزی فرمولِ محاسبه در وب عوض شود، این فایل هم باید دستی هم‌گام
// شود (یک وظیفه‌ی نگهداریِ کوچک و مستندشده، نه یک وابستگیِ اجرایی بین دو ریپازیتوری).
//
// چرا هرگز یک ستونِ boolean ساده‌ی is_vip نبود: بدون یک cron همیشه‌بیدار (که در سرورلس به‌سختی
// قابل‌اعتماد است) آن boolean به‌مرور با واقعیت ناهم‌خوان می‌شود. به‌جایش همه‌جا (وب و حالا
// موبایل) از همین یک قاعده استفاده می‌شود: vip_expires_at is not null and vip_expires_at > now().

export function isUserVip(vipExpiresAt: string | null | undefined): boolean {
  if (!vipExpiresAt) return false;
  return new Date(vipExpiresAt).getTime() > Date.now();
}

// شکل ساده‌شده‌ی وضعیت VIP برای نمایش در UI (پروفایل، بنر، badge و ...) — یک‌جا محاسبه می‌شود
// تا کامپوننت‌های مصرف‌کننده مجبور به تکرار منطق تاریخ نباشند.
export type VipDisplayStatus = {
  isVip: boolean;
  expiresAt: string | null;
};

export function getVipDisplayStatus(vipExpiresAt: string | null | undefined): VipDisplayStatus {
  return {
    isVip: isUserVip(vipExpiresAt),
    expiresAt: vipExpiresAt ?? null,
  };
}