// مسیر فایل: lib/marketplace/api.ts — فاز M02، تسک ۱ و ۲
//
// طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل («مسیر اول: خواندن عمومی — مستقیماً از اپ با Anon Key
// به همان توابع Postgres موجود وصل می‌شود، صفر کد سرور تازه»)، سه تابع این فایل مستقیماً
// lib/supabase.ts (Anon Key) را صدا می‌زنند — نه لایه‌ی پل موبایل (`/api/mobile/v1/*`). این با
// تسک‌های فاز M01 فرق دارد: آنجا هر عملیات (OTP، پروفایل) چون منطق اختصاصی/محرمانه داشت، از پل
// موبایل رد می‌شد؛ اینجا سه تابع Postgres (`search_listings`, `get_listing_detail`,
// `get_similar_listings`) از قبل با `grant execute ... to anon` عمومی و امن برای خواندن هستند —
// دقیقاً همان چیزی که خودِ وب هم (به‌صورت سرور-به-سرور) صدا می‌زند.
//
// شکل دقیق ستون‌های هر تابع، عیناً از خروجی `returns table (...)` تعریف SQL آن سه تابع
// (docs/YAKJA_DATABASE_LOG.md) کپی شده — نه فرض، نه حدس.
//
// 🟠 اصلاح (ممیزی i18n/RTL فاز M02، تسک ۹): ستون `images` این سه تابع، عیناً همان مسیرهای خامِ
// Storage است (مثل "owner-uuid/167000_0.jpg")، نه URL کامل — دقیقاً هم‌رفتار وب (که این تبدیل
// را در لحظه‌ی خواندن، در src/lib/marketplace/images.ts::getListingImageUrl انجام می‌دهد). قبلاً
// این فایل مسیر خام را بدون تبدیل مستقیم برمی‌گرداند و هیچ عکسی در اپ نمایش داده نمی‌شد؛ حالا با
// getListingImageUrls (فایل تازه‌ی lib/marketplace/images.ts) این تبدیل همین‌جا انجام می‌شود.
import { supabase } from '@/lib/supabase';
import type { ListingCategoryId } from './categories';
import { getListingImageUrls } from './images';

export type ListingSummary = {
  id: string;
  category: ListingCategoryId;
  title: string;
  price: number;
  address: string;
  images: string[];
  createdAt: string;
  distanceMeters: number | null;
};

export type ListingDetail = {
  id: string;
  ownerId: string;
  category: ListingCategoryId;
  title: string;
  price: number;
  address: string;
  contactPhone: string;
  description: string | null;
  images: string[];
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
};

export type SearchListingsParams = {
  category?: ListingCategoryId | null;
  province?: string | null;
  lat?: number | null;
  lng?: number | null;
  query?: string | null;
  limit?: number;
  offset?: number;
};

export type SearchListingsResult = {
  listings: ListingSummary[];
  /** ستون total_count در هر ردیف (window function) — برای تشخیص «آیا صفحه‌ی بعدی وجود دارد؟» */
  totalCount: number;
};

// ردیف خام هر سه تابع Postgres دقیقاً همین شکل snake_case را برمی‌گرداند (supabase-js تبدیل
// خودکار به camelCase انجام نمی‌دهد)؛ این سه تایپ فقط برای map کردن همان یک نقطه استفاده می‌شوند.
type RawListingRow = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  created_at: string;
  distance_meters: number | null;
  total_count: number;
};

type RawDetailRow = {
  id: string;
  owner_id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  contact_phone: string;
  description: string | null;
  images: string[];
  created_at: string;
  latitude: number | null;
  longitude: number | null;
};

type RawSimilarRow = {
  id: string;
  category: string;
  title: string;
  price: number;
  address: string;
  images: string[];
  created_at: string;
  distance_meters: number | null;
};

export async function searchListings({
  category = null,
  province = null,
  lat = null,
  lng = null,
  query = null,
  limit = 20,
  offset = 0,
}: SearchListingsParams): Promise<SearchListingsResult> {
  const { data, error } = await supabase.rpc('search_listings', {
    p_category: category,
    // province=null یعنی «همه‌ی افغانستان» — بدون فیلتر ولایتی (دقیقاً هم‌رفتار با وب).
    p_province: province,
    p_lat: lat,
    p_lng: lng,
    p_query: query && query.trim().length > 0 ? query.trim() : null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  const rows = (data ?? []) as RawListingRow[];
  return {
    listings: rows.map((r) => ({
      id: r.id,
      category: r.category as ListingCategoryId,
      title: r.title,
      price: r.price,
      address: r.address,
      images: getListingImageUrls(r.images ?? []),
      createdAt: r.created_at,
      distanceMeters: r.distance_meters,
    })),
    // total_count با window function روی هر ردیف تکرار می‌شود؛ اگر هیچ ردیفی برنگردد، یعنی ۰.
    totalCount: rows.length > 0 ? rows[0].total_count : 0,
  };
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const { data, error } = await supabase.rpc('get_listing_detail', { p_id: id });
  if (error) throw error;

  const rows = (data ?? []) as RawDetailRow[];
  if (rows.length === 0) return null; // یعنی وجود ندارد یا هنوز تایید نشده (همان رفتار SQL)

  const r = rows[0];
  return {
    id: r.id,
    ownerId: r.owner_id,
    category: r.category as ListingCategoryId,
    title: r.title,
    price: r.price,
    address: r.address,
    contactPhone: r.contact_phone,
    description: r.description,
    images: getListingImageUrls(r.images ?? []),
    createdAt: r.created_at,
    latitude: r.latitude,
    longitude: r.longitude,
  };
}

export async function getSimilarListings(params: {
  category: ListingCategoryId;
  excludeId: string;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}): Promise<ListingSummary[]> {
  const { data, error } = await supabase.rpc('get_similar_listings', {
    p_category: params.category,
    p_exclude_id: params.excludeId,
    p_lat: params.lat ?? null,
    p_lng: params.lng ?? null,
    p_limit: params.limit ?? 6,
  });
  if (error) throw error;

  const rows = (data ?? []) as RawSimilarRow[];
  return rows.map((r) => ({
    id: r.id,
    category: r.category as ListingCategoryId,
    title: r.title,
    price: r.price,
    address: r.address,
    images: getListingImageUrls(r.images ?? []),
    createdAt: r.created_at,
    distanceMeters: r.distance_meters,
  }));
}