// مسیر فایل: lib/vip/api.ts
// قابلیت VIP — لایه‌ی خواندنِ «تنظیمات فعلی + آخرین درخواستِ خودِ کاربر»، از پل موبایل.
//
// چرا از پل موبایل، نه Anon Key مستقیم: نه جدول platform_settings نه جدول vip_requests هیچ
// Policy عمومی‌ای دارند — دقیقاً هم‌الگو با درایورها/متخصصینِ صفحه‌ی اصلی. رجوع کنید به یادداشت
// کامل بالای src/app/api/mobile/v1/vip/route.ts در ریپازیتوری وب.
import { apiFetch } from '@/lib/session';

export type VipSettings = {
  monthlyPrice: number;
  bankDetails: string;
  exchangeDetails: string;
};

export type VipRequestStatus = 'pending' | 'approved' | 'rejected';

export type MyVipRequest = {
  id: string;
  paymentMethod: 'bank' | 'exchange';
  status: VipRequestStatus;
  requestedAt: string;
  rejectionReason: string | null;
};

export type VipPageData = {
  settings: VipSettings;
  latestRequest: MyVipRequest | null;
};

const FALLBACK_SETTINGS: VipSettings = { monthlyPrice: 0, bankDetails: '', exchangeDetails: '' };

export async function getVipPageData(): Promise<VipPageData> {
  try {
    const res = await apiFetch('/api/mobile/v1/vip');
    const data: VipPageData = await res.json();
    return data;
  } catch {
    // آفلاین یا خطای سرور — به‌جای شکستنِ کل صفحه، تنظیماتِ خالی نشان بده؛ کاربر می‌تواند صفحه
    // را دوباره باز کند. دقیقاً هم‌روحیه با تحمل‌گریِ AuthContext.refreshUser.
    return { settings: FALLBACK_SETTINGS, latestRequest: null };
  }
}