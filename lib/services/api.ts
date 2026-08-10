// مسیر فایل: lib/services/api.ts — فاز M04، تسک ۱
//
// دقیقاً هم‌الگو با lib/transport/api.ts: طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل («مسیر اول:
// خواندن عمومی — مستقیماً از اپ با Anon Key به همان توابع Postgres موجود وصل می‌شود، صفر کد سرور
// تازه»)، تابع این فایل مستقیماً lib/supabase.ts (Anon Key) را صدا می‌زند. تابع Postgres
// `get_active_service_providers` از قبل با `grant execute ... to anon` عمومی و امن برای خواندن
// است — دقیقاً همان تابعی که خودِ وب هم (src/lib/services/serviceProviderQueries.ts ::
// getActiveServiceProviders) به‌صورت سرور-به-سرور صدا می‌زند.
//
// **🔴 رفع خطای واقعی (کشف‌شده هنگام سیم‌کشیِ دکمه‌ی چت):** نسخه‌ی قبلیِ این فایل با امضای
// واقعیِ تابع get_active_service_providers روی دیتابیس هم‌خوان نبود — دقیقاً همان علتِ توضیح‌داده‌
// شده در یادداشتِ بالای lib/transport/api.ts (تحولاتِ فازهای ۱۰/۱۱/۱۲ در وب، بدون هم‌گام‌سازیِ
// این فایلِ مستقلِ موبایل). **هیچ مهاجرتِ دیتابیسیِ تازه‌ای لازم نیست** — امضای پارامترها و
// نگاشتِ ستون‌ها، عیناً از src/lib/services/serviceProviderQueries.ts::getActiveServiceProviders
// وب کپی شد.
import { supabase } from '@/lib/supabase';
import { getServiceProviderImageUrls } from './images';

export type ActiveServiceProviderSummary = {
  id: string;
  ownerId: string;
  serviceCategoryId: string;
  categoryNameFa: string;
  categoryNamePs: string;
  categoryIconSource: 'builtin' | 'custom';
  categoryIconKey: string | null;
  categoryIconUrl: string | null;
  contactPhone: string;
  address: string;
  description: string | null;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  ownerIsVip: boolean;
};

export type GetActiveServiceProvidersParams = {
  category?: string | null;
  province?: string | null;
  lat?: number | null;
  lng?: number | null;
  query?: string | null;
  limit?: number;
  offset?: number;
};

export type GetActiveServiceProvidersResult = {
  providers: ActiveServiceProviderSummary[];
  /** ستون total_count روی هر ردیف (window function) — برای تشخیص «آیا صفحه‌ی بعدی وجود دارد؟» */
  totalCount: number;
};

// ردیف خامی که تابع Postgres «get_active_service_providers» برمی‌گرداند — عیناً از
// RawActiveServiceProviderRow وب کپی شده.
type RawActiveServiceProviderRow = {
  id: string;
  owner_id: string;
  service_category_id: string;
  category_name_fa: string;
  category_name_ps: string;
  category_icon_source: string;
  category_icon_key: string | null;
  category_icon_url: string | null;
  contact_phone: string;
  address: string;
  description: string | null;
  images: string[] | null;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  owner_is_vip: boolean;
  total_count: number;
};

export async function getActiveServiceProviders({
  category = null,
  province = null,
  lat = null,
  lng = null,
  query = null,
  limit = 20,
  offset = 0,
}: GetActiveServiceProvidersParams): Promise<GetActiveServiceProvidersResult> {
  const { data, error } = await supabase.rpc('get_active_service_providers', {
    p_category: category,
    // province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی (دقیقاً هم‌رفتار با وب).
    p_province: province,
    p_lat: lat,
    p_lng: lng,
    p_query: query,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  const rows = (data ?? []) as RawActiveServiceProviderRow[];

  return {
    providers: rows.map((r) => ({
      id: r.id,
      ownerId: r.owner_id,
      serviceCategoryId: r.service_category_id,
      categoryNameFa: r.category_name_fa,
      categoryNamePs: r.category_name_ps,
      categoryIconSource: r.category_icon_source === 'custom' ? 'custom' : 'builtin',
      categoryIconKey: r.category_icon_key,
      categoryIconUrl: r.category_icon_url,
      contactPhone: r.contact_phone,
      address: r.address,
      description: r.description,
      images: getServiceProviderImageUrls(r.images ?? []),
      latitude: r.latitude,
      longitude: r.longitude,
      distanceMeters: r.distance_meters,
      ownerIsVip: r.owner_is_vip ?? false,
    })),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}