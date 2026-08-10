// مسیر فایل: context/AppVersionContext.tsx
// 🆕 سیستم تازه‌ی «کنترلِ نسخه‌ی اپ از دیتابیس» — طبق درخواست صریح کارفرما.
//
// **دو سناریوی دقیقِ کارفرما، و این‌که این Context چطور هرکدام را پیاده می‌کند:**
//   ۱) «آپدیتِ اجباری» — کارفرما در ردیفِ دیتابیس، latest_version را افزایش می‌دهد و
//      force_update را true می‌کند → status می‌شود 'updateRequired' → app/_layout.tsx به‌جای
//      Stackِ عادی، فقط <UpdateRequiredScreen /> را نشان می‌دهد؛ هیچ راهِ دیگری برای رد کردن
//      نیست (نه دکمه‌ی بستن، نه دکمه‌ی بازگشتِ گوشی).
//   ۲) «آپدیتِ اختیاری» — فقط latest_version افزایش می‌یابد، force_update همچنان false می‌ماند
//      → status می‌شود 'updateAvailable' → یک‌بار (تا کاربر «بعداً» را نزند) یک مودالِ قابل‌ردکردن
//      نشان داده می‌شود؛ اگر کاربر «بعداً» بزند، دیگر هرگز برای همین latest_version دوباره نشان
//      داده نمی‌شود (ذخیره در SecureStore) — ولی وضعیتِ واقعی («نسخه‌ی تازه‌ای هست») هم‌چنان در
//      بخشِ «نسخه‌ی برنامه»‌ی تبِ پروفایل (برای کاربرِ مهمان و واردشده، هردو) قابل‌دیدن می‌ماند،
//      دقیقاً همان چیزی که کارفرما خواسته بود: «هم پیام رو دیده، هم می‌تونه بعداً از پروفایل
//      ببینه که نیاز به آپدیت داره یا نه».
//
// **چرا نسخه‌ی نصب‌شده از app.json/expo-constants خوانده می‌شود، نه یک پکیجِ تازه:**
// expo-constants از قبل نصب است (Constants.expoConfig?.version می‌خواند دقیقاً همان رشته‌ای که
// در app.json فیلدِ expo.version است — همان عددی که کارفرما پیش از هر Build جدید، مثل خودِ
// نسخه‌ی نمایش‌داده‌شده به کاربر در استور/صفحه‌ی دانلود، دستی افزایش می‌دهد). گزینه‌ی دیگر
// (expo-application، برای خواندنِ versionCode/buildNumبرِ واقعیِ باینری) یک وابستگیِ Native
// تازه و نیازمندِ Rebuild بود؛ چون app.json::version همان عددی است که کارفرما خودش، آگاهانه، هر
// بار پیش از Build تغییر می‌دهد، این همان «عددِ ساده‌ای که بالا می‌بریم» است که در پیام
// خواسته شد — بدون افزودنِ هیچ وابستگیِ Native تازه.
//
// **تصمیمِ ایمنیِ مهم:** اگر خواندنِ پیکربندی از دیتابیس شکست بخورد (قطعیِ اینترنت و مانند آن)،
// status همیشه 'upToDate' می‌ماند — این قابلیت هرگز نباید خودش یک نقطه‌ی شکستِ کلِ اپ شود.
// جزئیاتِ کامل در یادداشتِ بالای lib/appVersion/api.ts.
import { getAppVersionConfig } from '@/lib/appVersion/api';
import { isVersionOutdated } from '@/lib/appVersion/compareVersions';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const DISMISSED_VERSION_KEY = 'yakja_update_dismissed_version';
const DEFAULT_DOWNLOAD_URL = 'https://yakja.top';

export type AppVersionStatus = 'checking' | 'upToDate' | 'updateAvailable' | 'updateRequired';

type AppVersionContextValue = {
  status: AppVersionStatus;
  currentVersion: string;
  latestVersion: string | null;
  // هردو نسخه‌ی زبان همین‌جا نگه داشته می‌شوند (نه یکی از پیش انتخاب‌شده) — چون این Context
  // خودش به زبانِ فعلی وابسته نیست (بیرون از دغدغه‌ی خودش است)؛ کامپوننت‌های مصرف‌کننده
  // (UpdateRequiredScreen/UpdateAvailableModal/تبِ پروفایل) که خودشان از قبل useLanguage()
  // را برای بقیه‌ی متن‌هایشان صدا می‌زنند، همان‌جا بینِ این دو انتخاب می‌کنند.
  messageFa: string | null;
  messagePs: string | null;
  downloadUrl: string;
  // true فقط وقتی status === 'updateAvailable' باشد و کاربر قبلاً همین latestVersion را رد
  // نکرده باشد — app/_layout.tsx فقط بر همین اساس مودالِ نرم را نشان می‌دهد.
  showSoftPrompt: boolean;
  dismissSoftPrompt: () => void;
};

const AppVersionContext = createContext<AppVersionContextValue | null>(null);

export function useAppVersion(): AppVersionContextValue {
  const ctx = useContext(AppVersionContext);
  if (!ctx) {
    throw new Error('useAppVersion() باید داخل <AppVersionProvider> استفاده شود.');
  }
  return ctx;
}

export function AppVersionProvider({ children }: { children: ReactNode }) {
  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

  const [status, setStatus] = useState<AppVersionStatus>('checking');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [messageFa, setMessageFa] = useState<string | null>(null);
  const [messagePs, setMessagePs] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>(DEFAULT_DOWNLOAD_URL);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const [config, storedDismissed] = await Promise.all([
        getAppVersionConfig(),
        SecureStore.getItemAsync(DISMISSED_VERSION_KEY),
      ]);
      if (cancelled) return;

      setDismissedVersion(storedDismissed);

      // شکست در خواندنِ پیکربندی (یا جدول هنوز ساخته نشده) → فرض «بروز است»، هرگز اپ را
      // قفل نکن. جزئیاتِ کامل در یادداشتِ بالای lib/appVersion/api.ts.
      if (!config) {
        setStatus('upToDate');
        return;
      }

      setLatestVersion(config.latestVersion);
      setDownloadUrl(config.downloadUrl?.trim() || DEFAULT_DOWNLOAD_URL);

      if (!isVersionOutdated(currentVersion, config.latestVersion)) {
        setStatus('upToDate');
        return;
      }

      setMessageFa(config.updateMessageFa);
      setMessagePs(config.updateMessagePs);
      setStatus(config.forceUpdate ? 'updateRequired' : 'updateAvailable');
    }

    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissSoftPrompt() {
    if (!latestVersion) return;
    setDismissedVersion(latestVersion);
    SecureStore.setItemAsync(DISMISSED_VERSION_KEY, latestVersion);
  }

  const showSoftPrompt = status === 'updateAvailable' && dismissedVersion !== latestVersion;

  return (
    <AppVersionContext.Provider
      value={{
        status,
        currentVersion,
        latestVersion,
        messageFa,
        messagePs,
        downloadUrl,
        showSoftPrompt,
        dismissSoftPrompt,
      }}>
      {children}
    </AppVersionContext.Provider>
  );
}