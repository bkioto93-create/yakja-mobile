// مسیر فایل: hooks/useDictionary.ts
// معادل ساده‌شده‌ی getDictionary.ts وب — چون در موبایل هر دو دیکشنری کوچک‌اند،
// به‌جای import پویا (که در وب برای کدسپلیتینگ سمت سرور لازم بود)، هر دو مستقیم
// import می‌شوند و بر اساس زبان فعلی (از LanguageContext) یکی انتخاب می‌شود.
import fa from '@/dictionaries/fa';
import ps from '@/dictionaries/ps';
import { useLanguage } from '@/context/LanguageContext';

const dictionaries = { fa, ps };

export function useDictionary() {
  const { language } = useLanguage();
  return dictionaries[language];
}

export type Dictionary = typeof fa;
