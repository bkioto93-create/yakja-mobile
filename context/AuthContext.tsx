// مسیر فایل: context/AuthContext.tsx
// فاز M01 (بخش ب) — وضعیت سراسری احراز هویت کاربر، دقیقاً هم‌الگو با context/LanguageContext.tsx
// (Provider + hook در یک فایل، با یک وضعیت «isReady» برای تشخیص پایان بررسی اولیه).
//
// نکته‌ی معماری مهم: خودِ توکن نشست از قبل در lib/session.ts مدیریت می‌شود (خواندن/نوشتن/حذف از
// expo-secure-store + fetch wrapper مشترک apiFetch که هدر Authorization را خودکار اضافه می‌کند —
// تسک ۹ همین فاز، از پیش پیاده‌سازی‌شده و دست‌نخورده مانده). این Context روی همان لایه سوار
// می‌شود: مسئولیتش فقط نگه‌داشتن «کاربر فعلی» (نتیجه‌ی GET /api/mobile/v1/profile) به‌صورت یک
// وضعیت سراسری در دسترس هر صفحه است — دقیقاً هم‌رفتار با getCurrentUser() وب که هر صفحه‌ی سرور
// مستقیم صدا می‌زند.
//
// طبق تسک ۱۱ («حالت کاربر مهمان — گشت‌وگذار آزاد در هر ۴ ماژول، دقیقاً مثل وب»): این Provider
// عمداً هیچ رندری را پشت isReady مسدود نمی‌کند (برخلاف LanguageProvider که کل اپ را تا مشخص شدن
// زبان صبر می‌دهد) — چون وب هم هیچ‌وقت کاربر را به‌خاطر ناشناخته‌بودن وضعیت ورود معطل نمی‌کند؛
// فقط همان صفحه‌ای که واقعاً به user نیاز دارد (مثلاً تب پروفایل) باید خودش isReady را چک کند و
// یک Spinner محلی نشان دهد، نه کل اپ.
//
// **افزوده‌شده (قابلیت Push Notification):** بعد از هر بارگذاریِ موفقِ پروفایل با کاربرِ
// واردشده (چه در اولین بازکردنِ اپ اگر نشست از قبل معتبر بود، چه بلافاصله بعد از login())، یک
// تلاشِ بی‌صدا برای گرفتن/ثبتِ Expo Push Token انجام می‌شود — دقیقاً همان‌جایی که منطقاً باید
// باشد، چون فقط از همین لحظه به بعد سرور می‌داند این توکن مالِ کدام کاربر است. در logout()، پیش
// از پاک‌کردنِ نشستِ محلی، همان توکن از سرور هم حذف می‌شود — تا کاربری که خارج شده، دیگر
// اعلانِ حسابِ (احتمالاً کاربرِ بعدیِ) همین دستگاه را نبیند.
import {
  registerForPushNotificationsAsync,
  removePushTokenFromServer,
  sendPushTokenToServer,
} from '@/lib/push/registerForPushNotifications';
import { apiFetch, clearSessionToken, setSessionToken } from '@/lib/session';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type AuthUser = {
  id: string;
  phoneNumber: string;
  name: string | null;
  role: 'user' | 'admin';
  language: 'fa' | 'ps' | null;
  vipExpiresAt: string | null;
};

type ProfileResponse = { success: boolean; user: AuthUser | null };

type AuthContextValue = {
  /** null یعنی کاربر مهمان (بدون نشست معتبر) — دقیقاً هم‌رفتار با getCurrentUser() وب */
  user: AuthUser | null;
  /** میانبر خوانایی؛ همیشه معادل user !== null */
  isLoggedIn: boolean;
  /** تا وقتی false است، هنوز اولین بررسی نشست (Storage + سرور) تمام نشده — فقط برای Loader
   *  محلیِ صفحاتی که واقعاً به user نیاز دارند (مثل تب پروفایل)، نه برای گیت کردن کل اپ. */
  isReady: boolean;
  /** بعد از موفقیت verify-otp صدا زده می‌شود: توکن را ذخیره و بلافاصله پروفایل کامل را می‌خواند */
  login: (token: string) => Promise<void>;
  /** خروج از حساب: هم Route وب (بخش الف، تسک ۵) و هم توکن محلی expo-secure-store */
  logout: () => Promise<void>;
  /** بازخوانی دستی پروفایل فعلی (مثلاً بعد از تغییر زبان حساب از تب پروفایل، یا بعد از ثبتِ
   *  موفقِ درخواستِ VIP — تا وضعیتِ VIP سراسری فوراً به‌روز شود) */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch('/api/mobile/v1/profile');
      const data: ProfileResponse = await res.json();
      setUser(data.user ?? null);

      if (data.user) {
        // بی‌صدا و بدون انتظار — اگر کاربر اجازه ندهد یا هر خطایی رخ دهد، خودِ این تابع هرگز
        // throw نمی‌کند (رجوع کنید به lib/push/registerForPushNotifications.ts)، پس نیازی به
        // await یا try/catch اینجا نیست.
        registerForPushNotificationsAsync().then((token) => {
          if (token) void sendPushTokenToServer(token);
        });
      }
    } catch {
      // بدون اینترنت، EXPO_PUBLIC_API_BASE_URL تنظیم‌نشده، یا خطای سرور: کاربر را مهمان فرض کن،
      // نه یک خطای مسدودکننده‌ی کل اپ — دقیقاً هم‌روحیه با رفتار تحمل‌گر خودِ این Route برای
      // کاربر مهمان. بهینه‌سازی کامل حالت آفلاین (تلاش خودکار مجدد و...) در فاز M07 است.
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsReady(true));
  }, [refreshUser]);

  const login = useCallback(
    async (token: string) => {
      await setSessionToken(token);
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    // پیش از پاک‌کردنِ نشستِ محلی، توکنِ Push همین دستگاه از سرور حذف می‌شود — اگر گرفتنِ
    // توکن هم شکست بخورد (مثلاً کاربر هرگز اجازه نداده بود)، بی‌صدا رد می‌شود، مانعِ خروج
    // نمی‌شود.
    registerForPushNotificationsAsync().then((token) => {
      if (token) void removePushTokenFromServer(token);
    });

    try {
      await apiFetch('/api/mobile/v1/logout', { method: 'POST' });
    } catch {
      // طبق یادداشت تسک ۵ فاز M01 (بخش الف): نشست بدون‌حالت (Stateless) است؛ حتی اگر همین تماس
      // شبکه شکست بخورد، حذف توکن محلی (پایین‌تر) به‌تنهایی برای خروج واقعی کاربر کافی است.
    } finally {
      await clearSessionToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: user !== null, isReady, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}