// مسیر فایل: context/ProvinceContext.tsx
// 🆕 فایل تازه (هم‌ترازی با فاز ۱۰ وب — قابلیت «ولایت») — مدیریت ولایتِ انتخابیِ کاربر به‌صورت
// Context سراسری، دقیقاً هم‌الگو با context/LanguageContext.tsx موجود (که خودش معادل موبایلیِ
// کوکیِ زبان وب است). معادل مستقیم src/lib/province/getSelectedProvince.ts +
// src/lib/province/actions.ts وب — با این تفاوت که وب کوکی/Server Action دارد و موبایل
// SecureStore/Context.
//
// hasChosenProvince: دقیقاً همان تمایز hasChosen در getSelectedProvince.ts وب — true فقط وقتی
// که یا مقداری واقعاً از SecureStore خوانده شده، یا کاربر همین حالا با ProvincePickerModal یک
// گزینه (از جمله «همه‌ی افغانستان») را انتخاب کرده باشد. مصرف‌کننده‌ی اصلی: ProvinceBar (برای
// تشخیص «آیا مودال باید خودکار در اولین بازدید باز شود؟»).
//
// province=null یعنی «بدون فیلتر ولایتی / همه‌ی افغانستان» — چه چون کاربر صراحتاً همین را
// انتخاب کرده (hasChosenProvince=true)، چه چون هنوز هیچ‌چیز انتخاب نکرده
// (hasChosenProvince=false). این دو حالت را کامپوننت مصرف‌کننده باید از هم تفکیک کند، دقیقاً
// همان یادداشتی که در getSelectedProvince.ts وب هم مستند شده.
import { ALL_PROVINCES_VALUE, PROVINCE_STORAGE_KEY } from '@/lib/province/constants';
import { isValidProvince, type ProvinceId } from '@/lib/provinces';
import * as SecureStore from 'expo-secure-store';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

type ProvinceContextValue = {
  /** null یعنی «همه‌ی افغانستان» (بدون فیلتر) — یا هنوز انتخاب نشده، یا صراحتاً همین انتخاب شده. */
  province: ProvinceId | null;
  /** ثبت انتخاب تازه؛ id یکی از ۳۴ شناسه‌ی lib/provinces.ts یا ALL_PROVINCES_VALUE است. */
  setProvince: (id: string) => void;
  isReady: boolean;
  hasChosenProvince: boolean;
};

const ProvinceContext = createContext<ProvinceContextValue | undefined>(undefined);

export function ProvinceProvider({ children }: PropsWithChildren) {
  const [province, setProvinceState] = useState<ProvinceId | null>(null);
  const [hasChosenProvince, setHasChosenProvince] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(PROVINCE_STORAGE_KEY).then((stored) => {
      if (cancelled) return;
      if (stored === ALL_PROVINCES_VALUE) {
        setProvinceState(null);
        setHasChosenProvince(true);
      } else if (stored && isValidProvince(stored)) {
        setProvinceState(stored);
        setHasChosenProvince(true);
      }
      // مقدار خالی/نامعتبر (یا اصلاً چیزی ذخیره نشده) → hasChosenProvince همان false پیش‌فرض
      // می‌ماند، دقیقاً هم‌رفتار با «کوکی خراب/نبود کوکی» در getSelectedProvince.ts وب.
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setProvince = (id: string) => {
    if (id === ALL_PROVINCES_VALUE) {
      setProvinceState(null);
    } else if (isValidProvince(id)) {
      setProvinceState(id);
    } else {
      // دفاع در عمق — دقیقاً هم‌الگو با محافظت مشابه در setProvinceAction وب؛ مقدار نامعتبر را
      // بی‌صدا نادیده می‌گیرد، چون خودِ ProvincePickerModal فقط مقادیر مجاز را می‌فرستد.
      return;
    }
    setHasChosenProvince(true);
    SecureStore.setItemAsync(PROVINCE_STORAGE_KEY, id);
  };

  return (
    <ProvinceContext.Provider value={{ province, setProvince, isReady, hasChosenProvince }}>
      {children}
    </ProvinceContext.Provider>
  );
}

export function useProvince() {
  const ctx = useContext(ProvinceContext);
  if (!ctx) throw new Error('useProvince must be used within ProvinceProvider');
  return ctx;
}