// مسیر فایل: lib/network.ts — فاز M07، تسک ۲
//
// دو Hook برای «مدیریت حالت آفلاین (پیام واضح، تلاش خودکار مجدد)» (متن دقیق تسک):
//   useIsOffline      → وضعیت اتصال فعلی؛ مصرف‌کننده‌اش components/OfflineBanner.tsx است
//                        (پیام واضحِ سراسری، در ریشه‌ی اپ — نگاه کنید به app/_layout.tsx).
//   useAutoRetryOnReconnect → وقتی اتصال از قطع به وصل تغییر کند، یک بار callback را صدا می‌زند؛
//                        مصرف‌کننده‌اش هر ۴ صفحه‌ی فهرست است (fetchPage همان صفحه را دوباره
//                        صدا می‌زند) — دقیقاً همان «تلاش خودکار مجدد».
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';

/**
 * مقدار اولیه‌ی isConnected در NetInfo تا لحظه‌ی اول بررسی واقعی، null است — آن را «آفلاین» فرض
 * نمی‌کنیم (که باعث یک فلاش لحظه‌ای نادرست از نوار آفلاین در هر بار باز شدن اپ می‌شد)؛ فقط مقدار
 * صریحِ false به معنای واقعاً آفلاین است.
 */
export function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return unsubscribe;
  }, []);

  return isOffline;
}

/**
 * callback را فقط دقیقاً در لحظه‌ی گذار از «آفلاین» به «آنلاین» یک‌بار صدا می‌زند — نه در mount
 * اولیه (که خودِ صفحه با useEffect جداگانه‌اش این کار را می‌کند) و نه در هر تغییر دیگر. الگوی
 * Ref برای onReconnect (به‌جای گذاشتن مستقیم در dependency array) عمداً استفاده شد تا اگر
 * closure صفحه‌ی مصرف‌کننده (مثلاً fetchPage) بین رندرها عوض شود، افکت این Hook دوباره اجرا/نصب
 * نشود — فقط تغییر واقعی isOffline باعث بررسی مجدد می‌شود.
 */
export function useAutoRetryOnReconnect(onReconnect: () => void): void {
  const isOffline = useIsOffline();
  const wasOffline = useRef(false);
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    if (wasOffline.current && !isOffline) {
      onReconnectRef.current();
    }
    wasOffline.current = isOffline;
  }, [isOffline]);
}