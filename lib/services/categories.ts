// مسیر فایل: lib/services/categories.ts
// فایل تازه — فاز M04، تسک ۱.
//
// برخلاف lib/marketplace/categories.ts (فاز M02) و lib/transport/vehicleTypes.ts (فاز M03) که
// فایل کد ثابت هستند (چون معادل‌های وبشان هم فایل کد ثابتند)، service_categories یک جدول پویاست
// که فقط از پنل ادمین وب مدیریت می‌شود؛ پس تک‌نقطه‌ی حقیقتِ «کدام تخصص‌ها الان فعال‌اند» همیشه خودِ
// دیتابیس است، نه یک فایل کد. طبق متن دقیق تسک ۱ («چیپ‌های فیلتر تخصص — select مستقیم
// service_categories»)، این تابع یک select ساده روی همان جدول است، نه یک تابع Postgres/RPC —
// دقیقاً هم‌الگو با src/lib/services/serviceCategories.ts :: getActiveServiceCategories در وب، با
// یک تفاوت معماری بین دو ریپازیتوری: وب از سمت سرور با Service Role (supabaseAdminClient) می‌خواند
// و طبق بند ۸.۴ سند راهبردی وب صریحاً is_active=true را در کد فیلتر می‌کند (چون RLS برای
// Service Role اصلاً اجرا نمی‌شود)؛ این اپ موبایل طبق بند ۲ سند راهبردی موبایل («مسیر اول: خواندن
// عمومی — مستقیماً از اپ با Anon Key») مستقیماً با lib/supabase.ts (Anon Key) می‌خواند، یعنی اینجا
// RLS واقعاً هم اجرا می‌شود (سیاست «Public can read active service categories»، همان‌طور که در
// 10_phase_04_service_categories_schema.sql مستند شده)؛ با این‌حال، طبق همان انضباط «هرگز فقط به
// RLS متکی نشو» که در سراسر این پروژه (مثل lib/transport/api.ts) رعایت شده، فیلتر is_active=true
// همچنان صریحاً هم در کد تکرار می‌شود — دفاع‌در-عمق، نه اضافه‌کاری.
import { supabase } from '@/lib/supabase';

export type ServiceCategory = {
  id: string;
  nameFa: string;
  namePs: string;
  iconSource: 'builtin' | 'custom';
  iconKey: string | null;
  iconUrl: string | null;
  displayOrder: number;
};

// ردیف خامی که جدول service_categories برمی‌گرداند — دقیقاً همان ستون‌های
// 10_phase_04_service_categories_schema.sql، عیناً هم‌شکل با RawServiceCategoryRow در وب.
type RawServiceCategoryRow = {
  id: string;
  name_fa: string;
  name_ps: string;
  icon_source: string;
  icon_key: string | null;
  icon_url: string | null;
  display_order: number;
};

export async function getActiveServiceCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name_fa, name_ps, icon_source, icon_key, icon_url, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error || !data) return [];

  return (data as RawServiceCategoryRow[]).map((row) => ({
    id: row.id,
    nameFa: row.name_fa,
    namePs: row.name_ps,
    iconSource: row.icon_source === 'custom' ? 'custom' : 'builtin',
    iconKey: row.icon_key,
    iconUrl: row.icon_url,
    displayOrder: row.display_order,
  }));
}
