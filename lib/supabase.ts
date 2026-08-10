// مسیر فایل: lib/supabase.ts
// اتصال مستقیم به همان پروژه‌ی Supabase وب — فقط برای خواندن‌های عمومی با Anon Key
// (بند ۲ سند راهبردی موبایل). هرگز Service Role Key اینجا قرار نمی‌گیرد.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ EXPO_PUBLIC_SUPABASE_URL یا EXPO_PUBLIC_SUPABASE_ANON_KEY تنظیم نشده — فایل .env.example را ببینید.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
