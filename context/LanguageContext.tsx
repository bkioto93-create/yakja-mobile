// مسیر فایل: context/LanguageContext.tsx
// مدیریت زبان به‌صورت Context سراسری (نه پوشه‌ی مسیر [lang] مثل وب) — بند ۴ سند راهبردی موبایل.
//
// 🛠️ اصلاح جانبی (بین فاز M00B و فاز M01) — افزودن `hasChosenLanguage`:
// تا پیش از این اصلاح، هیچ راهی برای تشخیص «کاربر خودش دری را انتخاب کرده» از «هنوز هیچ‌چیز
// انتخاب نکرده و مقدار state هنوز فقط پیش‌فرض اولیه‌ی useState است» وجود نداشت — چون هر دو
// حالت دقیقاً همان `language === 'fa'` را نتیجه می‌دادند. همین خلأ باعث شده بود
// app/_layout.tsx هیچ‌وقت نتواند کاربر تازه‌وارد را به app/select-language.tsx بفرستد (معادل
// دقیق میان‌افزار `src/proxy.ts` وب که وجود کوکی `yakja_lang` را چک می‌کند). فیلد تازه‌ی
// `hasChosenLanguage` دقیقاً همان تمایز را فراهم می‌کند: فقط وقتی true می‌شود که یا مقداری
// واقعاً از SecureStore خوانده شده باشد، یا کاربر همین حالا با انتخاب یکی از دو گزینه
// setLanguage را صدا زده باشد. منطق قبلی (پیش‌فرض 'fa'، ذخیره در همان کلید SecureStore) بدون
// کوچک‌ترین تغییر باقی مانده — فقط یک state تازه اضافه شده.
import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

export type Language = 'fa' | 'ps';
const LANGUAGE_KEY = 'yakja_language';

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  isReady: boolean;
  // true فقط وقتی که کاربر واقعاً یک زبان را انتخاب کرده (یا از اجرای قبلی از SecureStore
  // خوانده شده) — برخلاف `language` که همیشه یک مقدار معتبر دارد (پیش‌فرض 'fa')، این فیلد
  // مشخصاً برای تشخیص «اولین اجرا / هنوز انتخاب نشده» است. مصرف‌کننده‌ی اصلی:
  // app/_layout.tsx (برای گیت Stack.Protected) و app/select-language.tsx.
  hasChosenLanguage: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>('fa');
  const [hasChosenLanguage, setHasChosenLanguage] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(LANGUAGE_KEY).then((stored) => {
      if (stored === 'fa' || stored === 'ps') {
        setLanguageState(stored);
        setHasChosenLanguage(true);
      }
      setIsReady(true);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setHasChosenLanguage(true);
    SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isReady, hasChosenLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}