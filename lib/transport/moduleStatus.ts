// مسیر فایل: lib/transport/moduleStatus.ts
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، «غیرفعال‌سازی موقت بخش راننده و بار») — خواندنِ
// پرچمِ سراسریِ isTransportModuleEnabled از پل موبایلِ تازه (Route کنارِ همین فایل، پوشه‌ی
// web-repo-routes/). یک هوکِ آماده هم صادر می‌شود چون این پرچم در دو صفحه‌ی مستقل لازم است
// (app/(tabs)/transport.tsx و app/transport/driver.tsx) — طبق همان اصلِ DRY که بقیه‌ی این
// پروژه هم دنبال می‌کند.
import { apiFetch } from '@/lib/session';
import { useEffect, useState } from 'react';

export async function getTransportModuleEnabled(): Promise<boolean> {
  try {
    const res = await apiFetch('/api/mobile/v1/transport/module-status');
    const data = await res.json();
    // 🛡️ پیش‌فرضِ امن: هر خطای شبکه/سرور به‌جای غیرفعال‌نشان‌دادنِ کاذبِ کل بخش، «فعال» فرض
    // می‌شود — دقیقاً هم‌روحیه با پیش‌فرضِ خودِ isTransportModuleEnabled وب («نبودِ کلید هرگز
    // نباید باعثِ ازکارافتادنِ ناخواسته شود»)؛ اینجا هم یک خطای شبکه نباید کاربران را از
    // بخشی که واقعاً فعال است محروم کند.
    return typeof data?.enabled === 'boolean' ? data.enabled : true;
  } catch {
    return true;
  }
}

/**
 * undefined = هنوز در حالِ بررسی (اسپینر/چیزی نشان نده)، true/false = نتیجه‌ی قطعی.
 * دقیقاً هم‌الگو با useState سه‌حالته‌ی بقیه‌ی این پروژه (مثلاً profile در app/users/[id].tsx).
 */
export function useTransportModuleEnabled(): boolean | undefined {
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getTransportModuleEnabled().then((value) => {
      if (!cancelled) setEnabled(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}