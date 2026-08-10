// مسیر فایل: lib/stories/api.ts
// قابلیت استوری — لایه‌ی خواندنِ «دسته‌ی کامل استوری‌های فعال یک کاربر» (وقتی روی حلقه‌ی
// هایلایتِ یک آواتار در ردیف صفحه‌ی اصلی لمس می‌شود).
//
// **مسیر اول (خواندن عمومی مستقیم با Anon Key)، نه پل موبایل:** برخلاف «تازه‌ترین استوری‌ها»ی
// صفحه‌ی اصلی (که به نامِ مالک نیاز دارد و پس باید از پل موبایل بیاید — رجوع کنید به یادداشت
// lib/home/api.ts)، این کوئری فقط خودِ جدول stories را می‌خواند (بدون Join با users) — چون
// نامِ مالک را والدِ این تماس (ردیف صفحه‌ی اصلی، که آن را از قبل از همان داده‌ی «تازه‌ترین
// استوری‌ها» دارد) به‌عنوان prop به کامپوننتِ Viewer پاس می‌دهد، نه این تابع.
//
// چرا Anon Key مستقیم اینجا امن است: جدول public.stories یک Policy کاملاً عمومی دارد
// («Public read - stories» — using(true)، رجوع کنید به database/2026_08_stories_feature.sql
// در ریپازیتوری وب) — دقیقاً همان الگویی که get_active_drivers (فاز M03) برای خواندنِ عمومی
// استفاده می‌کند، فقط اینجا حتی نیازی به یک تابع RPC هم نیست چون خودِ جدول قابل SELECT مستقیم
// است.
import { supabase } from '@/lib/supabase';
import { getStoryMediaUrl } from './images';

export type StoryMediaType = 'image' | 'video';

export type ActiveStory = {
  id: string;
  mediaType: StoryMediaType;
  mediaUrl: string;
  durationSeconds: number | null;
  createdAt: string;
};

// ردیف خامی که Supabase برمی‌گرداند — snake_case، دقیقاً هم‌شکل ستون‌های واقعی جدول.
type RawStoryRow = {
  id: string;
  media_type: StoryMediaType;
  media_path: string;
  duration_seconds: number | null;
  created_at: string;
};

// دسته‌ی کامل استوری‌های فعالِ یک کاربر، قدیمی‌ترین اول — دقیقاً هم‌الگو با
// getActiveStoriesForUser وب (src/lib/stories/storyQueries.ts)، برای این‌که Viewer پشت‌سرهم و
// به همان ترتیب زمانی نمایش دهد (مثل اینستاگرام).
export async function getActiveStoriesForUser(userId: string): Promise<ActiveStory[]> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('stories')
    .select('id, media_type, media_path, duration_seconds, created_at')
    .eq('owner_id', userId)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const rows = data as RawStoryRow[];

  return rows.map((row) => ({
    id: row.id,
    mediaType: row.media_type,
    mediaUrl: getStoryMediaUrl(row.media_path),
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  }));
}