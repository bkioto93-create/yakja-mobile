// مسیر فایل: lib/contactInfo/api.ts
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، کارتِ «اطلاعاتِ تماس» در تبِ پروفایل).
//
// تا پیش از این تسک، کارتِ تماسِ موبایل (app/(tabs)/profile.tsx) مستقیم از دیکشنریِ ایستا
// (dict.contact.phoneVal/addressVal) می‌خواند — یعنی اگر ادمین از پنلِ مدیریتِ وب («اطلاعاتِ
// یکجا») شماره/آدرس/واتساپ/توضیحاتِ تکمیلی را تغییر می‌داد، موبایل هرگز آن تغییر را نمی‌دید (تا
// نسخه‌ی بعدیِ اپ که با آن متنِ هاردکد Build می‌شد). این تابع دقیقاً همان کاری را می‌کند که
// resolveYakjaContactInfo وب انجام می‌دهد: مقدارِ زنده را از پل موبایل می‌خواند و فقط اگر ادمین
// چیزی ذخیره نکرده باشد، به مقدارِ دیکشنری (fallback) برمی‌گردد — یعنی این تغییر هرگز باعث
// خالی‌شدنِ کارتِ تماس نمی‌شود.
//
// **Route لازم در ریپازیتوریِ وب:** src/app/api/contact-info/route.ts (فایلِ تازه، پیوستِ همین
// تحویل، زیرِ پوشه‌ی web-repo-routes/) — دقیقاً هم‌الگو با src/app/api/exchange-rates/route.ts
// از‌قبل‌موجود: یک Route عمومیِ فقط-خواندنی، بدون نیاز به Authorization، چون این داده هم کاملاً
// عمومی است (نه اطلاعاتِ خصوصیِ کاربر).
import { apiFetch } from '@/lib/session';

export type ContactInfo = {
  whatsappNumber: string;
  phoneNumbers: string[];
  address: string;
  extraInfo: string;
  primaryPhone: string;
};

/**
 * اطلاعاتِ تماسِ زنده را از پل موبایل می‌خواند. هرگز throw نمی‌کند — هر خطای شبکه/سرور به همان
 * fallback (مقدارِ دیکشنریِ فعلی) تبدیل می‌شود، دقیقاً هم‌رفتار با resolveYakjaContactInfo وب
 * برای حالتی که جدولِ platform_settings هنوز هیچ مقداری ندارد.
 */
export async function getContactInfo(fallback: { phone: string; address: string }): Promise<ContactInfo> {
  try {
    const res = await apiFetch('/api/contact-info');
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const phoneNumbers: string[] =
      Array.isArray(data?.phoneNumbers) && data.phoneNumbers.length > 0
        ? data.phoneNumbers
        : [fallback.phone];
    return {
      whatsappNumber: typeof data?.whatsappNumber === 'string' ? data.whatsappNumber : '',
      phoneNumbers,
      address: typeof data?.address === 'string' && data.address ? data.address : fallback.address,
      extraInfo: typeof data?.extraInfo === 'string' ? data.extraInfo : '',
      primaryPhone: phoneNumbers[0],
    };
  } catch {
    return {
      whatsappNumber: '',
      phoneNumbers: [fallback.phone],
      address: fallback.address,
      extraInfo: '',
      primaryPhone: fallback.phone,
    };
  }
}