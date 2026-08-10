// مسیر فایل: lib/appVersion/api.ts
// 🆕 خواندنِ پیکربندیِ نسخه‌ی اپ از دیتابیس — دقیقاً هم‌الگو با lib/services/categories.ts:
// یک select مستقیم (نه RPC) روی یک جدولِ عمومیِ کوچک، با Anon Key. این جدول فقط یک ردیفِ ثابت
// دارد (id=1) — تمامِ منطقِ «کنترل از دیتابیس» که کارفرما خواسته بود، خلاصه می‌شود به: کارفرما
// همین یک ردیف را در پنلِ Table Editor خودِ Supabase ویرایش می‌کند (رجوع کنید به راهنمای پیوست
// برای دستورالعملِ دقیق)؛ هیچ پنلِ ادمینِ تازه‌ای لازم نبود چون این پروژه از قبل، برای کارهای
// نادر و ساده‌ی مشابه (تنظیماتِ سراسری)، همین الگو را می‌پذیرد.
//
// **تصمیمِ مهمِ ایمنی:** اگر این تماس شکست بخورد (قطعیِ اینترنت، دیتابیس در دسترس نیست، جدول
// هنوز ساخته نشده)، تابع null برمی‌گرداند — نه یک خطای پرتاب‌شده. چرا: قابلیتِ «بررسیِ نسخه»
// هرگز نباید خودش تبدیل به یک نقطه‌ی شکستِ کل اپ شود؛ اگر این یک تماسِ شبکه‌ای شکست بخورد،
// درست‌ترین رفتار این است که فرض کنیم «آپدیتی در کار نیست» و کاربر بدونِ مزاحمت وارد اپ شود —
// نه این‌که یک قطعیِ موقتِ شبکه، کاربر را برای همیشه پشتِ یک صفحه‌ی خالی/خطا گیر بیندازد.
import { supabase } from '@/lib/supabase';

export type AppVersionConfig = {
  latestVersion: string;
  forceUpdate: boolean;
  updateMessageFa: string | null;
  updateMessagePs: string | null;
  downloadUrl: string | null;
};

type RawAppVersionConfigRow = {
  latest_version: string;
  force_update: boolean;
  update_message_fa: string | null;
  update_message_ps: string | null;
  download_url: string | null;
};

export async function getAppVersionConfig(): Promise<AppVersionConfig | null> {
  try {
    const { data, error } = await supabase
      .from('app_version_config')
      .select('latest_version, force_update, update_message_fa, update_message_ps, download_url')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as RawAppVersionConfigRow;
    return {
      latestVersion: row.latest_version,
      forceUpdate: row.force_update,
      updateMessageFa: row.update_message_fa,
      updateMessagePs: row.update_message_ps,
      downloadUrl: row.download_url,
    };
  } catch {
    return null;
  }
}