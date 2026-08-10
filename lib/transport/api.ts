// مسیر فایل: lib/transport/api.ts — فاز M03، تسک ۱
//
// دقیقاً هم‌الگو با lib/marketplace/api.ts: طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل («مسیر
// اول: خواندن عمومی — مستقیماً از اپ با Anon Key به همان توابع Postgres موجود وصل می‌شود، صفر
// کد سرور تازه»)، تابع این فایل مستقیماً lib/supabase.ts (Anon Key) را صدا می‌زند. تابع Postgres
// `get_active_drivers` از قبل با `grant execute ... to anon` عمومی و امن برای خواندن است —
// دقیقاً همان تابعی که خودِ وب هم (src/lib/transport/driverQueries.ts :: getActiveDrivers)
// به‌صورت سرور-به-سرور صدا می‌زند.
//
// **🔴 رفع خطای واقعی (کشف‌شده هنگام سیم‌کشیِ دکمه‌ی چت):** نسخه‌ی قبلیِ این فایل (پارامترها:
// فقط lat/lng/limit/offset؛ ستون‌ها: بدون owner_id، با یک آرایه‌ی عمومیِ images) با امضای واقعیِ
// تابع get_active_drivers روی دیتابیس هم‌خوان نبود. علتش این بود که خودِ تابع، طیِ چند فاز (۱۰:
// فیلترِ ولایت/نوعِ وسیله؛ ۱۱: عضویتِ VIP + دو عکسِ اختصاصیِ personal/vehicle به‌جای یک آرایه‌ی
// عمومی؛ ۱۲: افزودنِ owner_id برای قابلیتِ چت) در ریپازیتوریِ وب بازسازی شده بود، ولی این فایلِ
// موبایل — که مستقیماً و جدا از آن فایل‌ها نوشته شده — هرگز با آن تحولات هم‌گام نشده بود.
// **هیچ مهاجرتِ دیتابیسیِ تازه‌ای لازم نیست** — تابعِ روی دیتابیس از قبل کاملاً درست است؛ فقط
// همین فایلِ TypeScript باید با شکلِ واقعیِ خروجیِ آن هماهنگ شود، دقیقاً کاری که همین‌جا انجام
// شد (امضای پارامترها و نگاشتِ ستون‌ها، عیناً از src/lib/transport/driverQueries.ts::
// getActiveDrivers وب کپی شد — نه فرض، نه حدس).
import { supabase } from '@/lib/supabase';
import { getDriverImageUrl } from './images';
import type { VehicleTypeId } from './vehicleTypes';

export type ActiveDriverSummary = {
  id: string;
  ownerId: string;
  vehicleType: VehicleTypeId;
  vehicleDetails: string | null;
  contactPhone: string;
  // جایگزینِ آرایه‌ی عمومیِ قبلیِ images — دو ستونِ معنادارِ اختصاصی (فاز VIP/۱۱ وب).
  personalPhotoUrl: string | null;
  vehiclePhotoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  lastLocationUpdate: string | null;
  ownerIsVip: boolean;
};

export type GetActiveDriversParams = {
  province?: string | null;
  vehicleType?: string | null;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
  offset?: number;
};

export type GetActiveDriversResult = {
  drivers: ActiveDriverSummary[];
  /** ستون total_count روی هر ردیف (window function) — برای تشخیص «آیا صفحه‌ی بعدی وجود دارد؟» */
  totalCount: number;
};

// ردیف خامی که تابع Postgres «get_active_drivers» برمی‌گرداند — عیناً از RawActiveDriverRow وب
// (src/lib/transport/driverQueries.ts) کپی شده.
type RawActiveDriverRow = {
  id: string;
  owner_id: string;
  vehicle_type: string;
  vehicle_details: string | null;
  contact_phone: string;
  personal_photo_path: string | null;
  vehicle_photo_path: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number | null;
  last_location_update: string | null;
  owner_is_vip: boolean;
  total_count: number;
};

export async function getActiveDrivers({
  province = null,
  vehicleType = null,
  lat = null,
  lng = null,
  limit = 20,
  offset = 0,
}: GetActiveDriversParams): Promise<GetActiveDriversResult> {
  const { data, error } = await supabase.rpc('get_active_drivers', {
    // province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی (دقیقاً هم‌رفتار با وب).
    p_province: province,
    p_lat: lat,
    p_lng: lng,
    p_vehicle_type: vehicleType,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  const rows = (data ?? []) as RawActiveDriverRow[];

  return {
    drivers: rows.map((r) => ({
      id: r.id,
      ownerId: r.owner_id,
      vehicleType: r.vehicle_type as VehicleTypeId,
      vehicleDetails: r.vehicle_details,
      contactPhone: r.contact_phone,
      personalPhotoUrl: r.personal_photo_path ? getDriverImageUrl(r.personal_photo_path) : null,
      vehiclePhotoUrl: r.vehicle_photo_path ? getDriverImageUrl(r.vehicle_photo_path) : null,
      latitude: r.latitude,
      longitude: r.longitude,
      distanceMeters: r.distance_meters,
      lastLocationUpdate: r.last_location_update,
      ownerIsVip: r.owner_is_vip ?? false,
    })),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}