// مسیر فایل: lib/stories/images.ts
// معادل موبایلِ src/lib/stories/images.ts در ریپازیتوری وب. دقیقاً هم‌الگو با
// lib/transport/images.ts (فاز M03): مسیر خامِ ذخیره‌شده در ستون stories.media_path (مثل
// "owner-uuid/167000.jpg") را به یک URL کامل و قابل‌بارگذاری در <Image>/<Video> تبدیل می‌کند.
// باکت stories از فاز ۱۵ «عمومی» (public) تعریف شده، پس نیازی به Sign کردن نیست.
//
// این فایل فقط برای getActiveStoriesForUser (lib/stories/api.ts) لازم است — چون آن تابع
// مستقیماً جدول خام stories را با Anon Key می‌خواند (مسیر خام). برای ردیف «تازه‌ترین
// استوری‌ها»ی صفحه‌ی اصلی (که از پل موبایل می‌آید)، mediaUrl از قبل توسط سرور کامل ساخته شده —
// رجوع کنید به یادداشت بالای src/app/api/mobile/v1/home/newest/route.ts.
const STORIES_BUCKET = 'stories';

export function getStoryMediaUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  return `${baseUrl}/storage/v1/object/public/${STORIES_BUCKET}/${path}`;
}