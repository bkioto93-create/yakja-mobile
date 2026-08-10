// مسیر فایل: lib/realEstate/api.ts — فاز M05، تسک ۱ + تسک ۲
//
// طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل («مسیر اول: خواندن عمومی — مستقیماً از اپ با Anon Key
// به همان توابع Postgres موجود وصل می‌شود، صفر کد سرور تازه»)، هر سه تابع این فایل مستقیماً
// lib/supabase.ts (Anon Key) را صدا می‌زنند — نه لایه‌ی پل موبایل. توابع Postgres
// `search_real_estate`, `get_real_estate_detail`, `get_similar_real_estate` از قبل با
// `grant execute ... to anon` عمومی و امن برای خواندن هستند (docs/YAKJA_DATABASE_LOG.md) —
// دقیقاً همان سه تابعی که خودِ وب هم (src/lib/realEstate/queries.ts، سرور-به-سرور با Service
// Role) صدا می‌زند؛ RLS جدول real_estate («Public can read approved real_estate») همان فیلترِ
// status='approved' را برای این کلاینت (Anon Key) هم اجرا می‌کند.
//
// دقیقاً هم‌الگو با lib/marketplace/api.ts (فاز M02، تسک ۱/۲): شکل دقیق پارامترها و ستون‌های
// خروجی، عیناً از تعریف SQL سه تابع (docs/YAKJA_DATABASE_LOG.md) کپی شده — نه فرض، نه حدس. ستون
// `images` هر سه تابع، مسیرهای خامِ Storage است، نه URL کامل؛ تبدیل همیشه همین‌جا با
// getRealEstateImageUrls انجام می‌شود (lib/realEstate/images.ts) — دقیقاً همان درسِ باگ فاز M02.
//
// تفاوت با ماژول کالا: real_estate ستون title ندارد (تسک ۲ فاز ۰۵ وب) — RealEstateSummary/Detail
// به‌جای title، فقط propertyType/dealType دارند؛ برچسب نمایشی («فروش خانه · فروش») در خودِ
// کامپوننت مصرف‌کننده از dict.realEstate.propertyTypes/dealTypes ساخته می‌شود. contactPhone فقط
// در RealEstateDetail هست (با Join به users در خودِ تابع get_real_estate_detail خوانده می‌شود)،
// نه در Summary — دقیقاً هم‌الگو با queries.ts وب.
import { supabase } from '@/lib/supabase';
import type { DealTypeId } from './dealTypes';
import { getRealEstateImageUrls } from './images';
import type { PropertyTypeId } from './propertyTypes';

export type RealEstateSummary = {
  id: string;
  propertyType: PropertyTypeId;
  dealType: DealTypeId;
  price: number;
  address: string;
  images: string[];
  createdAt: string;
  distanceMeters: number | null;
};

export type RealEstateDetail = {
  id: string;
  ownerId: string;
  propertyType: PropertyTypeId;
  dealType: DealTypeId;
  price: number;
  address: string;
  description: string | null;
  images: string[];
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
};

export type SearchRealEstateParams = {
  propertyType?: PropertyTypeId | null;
  dealType?: DealTypeId | null;
  province?: string | null;
  lat?: number | null;
  lng?: number | null;
  query?: string | null;
  limit?: number;
  offset?: number;
};

export type SearchRealEstateResult = {
  items: RealEstateSummary[];
  /** ستون total_count روی هر ردیف (window function) — برای تشخیص «آیا صفحه‌ی بعدی وجود دارد؟» */
  totalCount: number;
};

// ردیف خامی که تابع Postgres «search_real_estate» برمی‌گرداند — دقیقاً همین شکل snake_case
// (supabase-js تبدیل خودکار به camelCase انجام نمی‌دهد).
type RawSummaryRow = {
  id: string;
  property_type: string;
  deal_type: string;
  price: number;
  address: string;
  images: string[] | null;
  created_at: string;
  distance_meters: number | null;
  total_count: number;
};

type RawDetailRow = {
  id: string;
  owner_id: string;
  property_type: string;
  deal_type: string;
  price: number;
  address: string;
  description: string | null;
  images: string[] | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  contact_phone: string;
};

type RawSimilarRow = {
  id: string;
  property_type: string;
  deal_type: string;
  price: number;
  address: string;
  images: string[] | null;
  created_at: string;
  distance_meters: number | null;
};

export async function searchRealEstate({
  propertyType = null,
  dealType = null,
  province = null,
  lat = null,
  lng = null,
  query = null,
  limit = 20,
  offset = 0,
}: SearchRealEstateParams): Promise<SearchRealEstateResult> {
  const { data, error } = await supabase.rpc('search_real_estate', {
    p_property_type: propertyType,
    p_deal_type: dealType,
    // province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی (دقیقاً هم‌رفتار با وب).
    p_province: province,
    p_lat: lat,
    p_lng: lng,
    p_query: query && query.trim().length > 0 ? query.trim() : null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  const rows = (data ?? []) as RawSummaryRow[];
  return {
    items: rows.map((r) => ({
      id: r.id,
      propertyType: r.property_type as PropertyTypeId,
      dealType: r.deal_type as DealTypeId,
      price: Number(r.price),
      address: r.address,
      images: getRealEstateImageUrls(r.images ?? []),
      createdAt: r.created_at,
      distanceMeters: r.distance_meters,
    })),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}

// get_real_estate_detail یک تابع «returns table» است (نه یک ردیف تکی)، پس supabase-js همیشه یک
// آرایه برمی‌گرداند — دقیقاً هم‌الگو با getListingDetail (lib/marketplace/api.ts)؛ آرایه‌ی خالی
// یعنی آگهی وجود ندارد، حذف شده، یا هنوز توسط مدیر تایید نشده (همان قاعده‌ی status='approved').
export async function getRealEstateDetail(id: string): Promise<RealEstateDetail | null> {
  const { data, error } = await supabase.rpc('get_real_estate_detail', { p_id: id });
  if (error) throw error;

  const rows = (data ?? []) as RawDetailRow[];
  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    id: r.id,
    ownerId: r.owner_id,
    propertyType: r.property_type as PropertyTypeId,
    dealType: r.deal_type as DealTypeId,
    price: Number(r.price),
    address: r.address,
    description: r.description,
    images: getRealEstateImageUrls(r.images ?? []),
    createdAt: r.created_at,
    latitude: r.latitude,
    longitude: r.longitude,
    contactPhone: r.contact_phone,
  };
}

export async function getSimilarRealEstate(params: {
  propertyType: PropertyTypeId;
  dealType: DealTypeId;
  excludeId: string;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}): Promise<RealEstateSummary[]> {
  const { data, error } = await supabase.rpc('get_similar_real_estate', {
    p_property_type: params.propertyType,
    p_deal_type: params.dealType,
    p_exclude_id: params.excludeId,
    p_lat: params.lat ?? null,
    p_lng: params.lng ?? null,
    p_limit: params.limit ?? 6,
  });
  if (error) throw error;

  const rows = (data ?? []) as RawSimilarRow[];
  return rows.map((r) => ({
    id: r.id,
    propertyType: r.property_type as PropertyTypeId,
    dealType: r.deal_type as DealTypeId,
    price: Number(r.price),
    address: r.address,
    images: getRealEstateImageUrls(r.images ?? []),
    createdAt: r.created_at,
    distanceMeters: r.distance_meters,
  }));
}