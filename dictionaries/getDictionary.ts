// مسیر فایل: dictionaries/getDictionary.ts

// منطقِ ایمن‌سازی شده، برای جایگذاری تایپ اسکریپتیِ فایل‌ها به‌جهت اطمینان در اعمالِ کامنت‌ها در بالای فایل که الزامات معماریست!
const dictionaries = {
  fa: () => import('./fa').then((module) => module.default),
  ps: () => import('./ps').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  return dictionaries[locale as keyof typeof dictionaries]?.() ?? dictionaries.fa();
};

