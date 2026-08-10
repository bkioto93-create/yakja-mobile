<!-- مسیر فایل: YAKJA_DATABASE_LOG.md -->
# مرجع کامل پایگاه داده — پروژه یکجا (YAKJA) — نسخه‌ی مرجع فاز موبایل

**نسخه:** ۲.۰ (بازبینی‌شده و نهایی، مشتق از آرشیو کامل وب تا آخرین رکورد فاز ۰۹)
**تاریخ:** ۳۰ سرطان ۱۴۰۵ (۲۱ ژوئیه ۲۰۲۶)

## چیستی این سند

این سند، عکس‌فوریِ **وضعیت نهایی و فعلی** دیتابیس مشترک پروژه‌ی یکجا است — همان دیتابیسی که وب‌اپلیکیشن از آن استفاده می‌کند. هر جدول با ساختار *کامل و نهایی*‌اش (بعد از اعمال تمام مهاجرت‌های تاریخی) نشان داده شده، نه ترتیب زمانی رسیدن به آن؛ برای اینکه فاز موبایل بدون نیاز به خواندن ۱۷۰۰+ خط لاگ تاریخی وب، دقیقاً بداند همین الان دیتابیس چه شکلی است.

**دیتابیس تازه‌ای در کار نیست.** پروژه‌ی موبایل از همان پروژه‌ی Supabase وب (همان URL، همان کلید Anon) استفاده می‌کند. هیچ‌کدام از دستورات این فایل نیاز به اجرای دوباره ندارند — همه از قبل روی دیتابیس زنده اعمال شده‌اند؛ این فایل فقط برای مرجع و مطالعه است.

---

## ✅ یک قدم نهایی پیش از شروع کدنویسی

در بازسازی این سند، دو ستون‌بندی — ستون‌های پایه‌ی جدول `users` و ستون‌های تکمیلی جدول `otp_codes` — بر اساس رفتار قطعی کد (نه یک رکورد SQL جداگانه در آرشیو وب) بازسازی شده‌اند؛ کد این دو بخش را به‌شدت و با موفقیت در فاز ۰۱ تا ۰۹ استفاده کرده، پس روی دیتابیس زنده قطعاً موجودند. برای رسیدن به دقت ۱۰۰٪ کامل، همین یک کوئری را یک‌بار در SQL Editor پروژه‌ی Supabase اجرا و خروجی را جای‌گذاری کنید (زیر ۲ دقیقه کار است):

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('users', 'otp_codes')
order by table_name, ordinal_position;
```

ستون‌های این دو جدول در بخش‌های مربوطه با علامت 🔶 مشخص شده‌اند.

---

## فهرست کامل جداول

| جدول | نقش |
|---|---|
| `users` | کاربران، احراز هویت، نقش، زبان، مسدودی |
| `listings` | آگهی‌های کالا |
| `drivers` | رانندگان حمل‌ونقل |
| `service_providers` | متخصصین فنی |
| `service_categories` | فهرست پویای تخصص‌های خدماتی |
| `real_estate` | آگهی‌های ملک |
| `reports` | گزارش‌های تخلف |
| `otp_codes` | کدهای یک‌بارمصرف ورود |
| `admin_logs` | لاگ اقدامات ادمین |

همه‌ی جداول: `Row Level Security` **فعال**. تمام نوشتن‌ها همیشه از سرور (Service Role) انجام می‌شوند — قانون ثابت این پروژه، هم برای وب و هم برای موبایل: **هیچ نوشتنی هرگز مستقیم از کلاینت (وب یا موبایل) با Anon Key انجام نمی‌شود؛ همیشه از طریق سرور.**

---

## 1️⃣ جدول `users`

```sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- 🔶 بازسازی‌شده از رفتار کد:
  phone_number text unique not null,
  name text,
  role text not null default 'user',                -- مقادیر در استفاده: 'user' | 'admin'
  language text,                                     -- 'fa' | 'ps'
  is_blocked boolean not null default false,
  last_login timestamptz,

  -- ستون‌های ورود مجزای ادمین (فقط پنل ادمین وب استفاده می‌کند؛ خارج از محدوده‌ی موبایل)
  admin_username text,
  admin_password_hash text,
  admin_failed_attempts integer not null default 0,
  admin_locked_until timestamptz
);

create unique index if not exists users_admin_username_unique_idx
  on public.users (admin_username) where admin_username is not null;

alter table public.users enable row level security;
-- بدون Policy → دسترسی مستقیم بسته؛ هر خواندن/نوشتن فقط از سرور با Service Role.
```

نقش‌های مفهومی «خریدار/فروشنده/راننده/متخصص» (بند ۷ سند اصلی وب) با مقدار `role` مشخص نمی‌شوند، بلکه با وجود ردیف در `drivers`/`service_providers`. `phone_number` و `role` هرگز در پروفایل عمومی یک کاربر (که کاربر دیگر می‌بیند) نمایش داده نمی‌شوند — فقط `id`, `name`, `created_at` عمومی‌اند.

---

## 2️⃣ جدول `listings` (کالا)

```sql
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  category text not null
    check (category in ('food','building_materials','clothing','home_goods',
                         'motorcycle','car','livestock','agriculture','other')),
  title text not null,
  price numeric(12,2) not null check (price >= 0),
  address text not null,
  contact_phone text not null,
  description text,
  images text[] not null check (cardinality(images) between 1 and 5),
  location geography(point, 4326),
  status text not null default 'pending'
    check (status in ('pending','approved','deleted'))
);

create index if not exists listings_category_status_idx on public.listings (category, status);
create index if not exists listings_location_gix on public.listings using gist (location);
create index if not exists listings_owner_id_idx on public.listings (owner_id);

alter table public.listings enable row level security;
create policy "Public can read approved listings" on public.listings for select using (status = 'approved');
create policy "Owner can read own listing any status" on public.listings for select using (auth.uid() = owner_id);
create policy "Owner can update own listing" on public.listings for update using (auth.uid() = owner_id);
create policy "Owner can delete own listing" on public.listings for delete using (auth.uid() = owner_id);
```

**باکت Storage:** `listings-images` (خواندن عمومی؛ نوشتن فقط از طریق Signed URL صادرشده با Service Role — موبایل باید همین الگو را عیناً تکرار کند).

```sql
create or replace function public.get_listing_detail(p_id uuid)
returns table (
  id uuid, owner_id uuid, category text, title text, price numeric,
  address text, contact_phone text, description text, images text[],
  created_at timestamptz, latitude double precision, longitude double precision
)
language sql stable as $$
  select l.id, l.owner_id, l.category, l.title, l.price, l.address,
         l.contact_phone, l.description, l.images, l.created_at,
         case when l.location is not null then ST_Y(l.location::geometry) else null end,
         case when l.location is not null then ST_X(l.location::geometry) else null end
  from public.listings l
  where l.id = p_id and l.status = 'approved';
$$;

create or replace function public.get_similar_listings(
  p_category text, p_exclude_id uuid,
  p_lat double precision default null, p_lng double precision default null,
  p_limit integer default 6
)
returns table (
  id uuid, category text, title text, price numeric, address text,
  images text[], created_at timestamptz, distance_meters double precision
)
language sql stable as $$
  select l.id, l.category, l.title, l.price, l.address, l.images, l.created_at,
    case when p_lat is not null and p_lng is not null and l.location is not null
      then ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)
      else null end
  from public.listings l
  where l.status = 'approved' and l.category = p_category and l.id <> p_exclude_id
  order by
    (case when p_lat is not null and p_lng is not null and l.location is not null
      then ST_Distance(l.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)
      else null end) asc nulls last,
    l.created_at desc
  limit p_limit;
$$;

create or replace function public.search_listings(
  p_category text default null, p_lat double precision default null,
  p_lng double precision default null, p_query text default null,
  p_limit integer default 20, p_offset integer default 0
)
returns table (
  id uuid, category text, title text, price numeric, address text, images text[],
  created_at timestamptz, distance_meters double precision, total_count bigint
)
language sql stable as $$
  with origin as (
    select case when p_lat is not null and p_lng is not null
      then ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography else null end as point
  ),
  filtered as (
    select l.* from public.listings l
    where l.status = 'approved'
      and (p_category is null or l.category = p_category)
      and (p_query is null or btrim(p_query) = ''
           or l.address ilike '%' || p_query || '%'
           or l.title ilike '%' || p_query || '%')
  )
  select f.id, f.category, f.title, f.price, f.address, f.images, f.created_at,
    case when o.point is not null and f.location is not null
      then ST_Distance(f.location, o.point) else null end,
    count(*) over()
  from filtered f, origin o
  order by
    (case when o.point is not null and f.location is not null
      then ST_Distance(f.location, o.point) else null end) asc nulls last,
    f.created_at desc
  limit p_limit offset p_offset;
$$;

grant execute on function public.get_listing_detail(uuid) to anon, authenticated, service_role;
grant execute on function public.get_similar_listings(text, uuid, double precision, double precision, integer) to anon, authenticated, service_role;
grant execute on function public.search_listings(text, double precision, double precision, text, integer, integer) to anon, authenticated, service_role;
```

---

## 3️⃣ جدول `drivers` (حمل‌ونقل)

```sql
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  vehicle_type text not null
    check (vehicle_type in ('taxi','zaranj','rickshaw','tractor','pickup','truck','other')),
  vehicle_details text,
  contact_phone text not null,
  location geography(point, 4326),
  is_active boolean not null default false,
  last_location_update timestamptz,
  images text[] default '{}'::text[]
    check (array_length(images, 1) is null or array_length(images, 1) <= 5)
);

create index if not exists drivers_location_gix on public.drivers using gist (location);
create index if not exists drivers_is_active_idx on public.drivers (is_active);
create index if not exists drivers_owner_id_idx on public.drivers (owner_id);

alter table public.drivers enable row level security;
create policy "Public can read active drivers" on public.drivers for select using (is_active = true);
create policy "Owner can read own driver profile any status" on public.drivers for select using (auth.uid() = owner_id);
create policy "Owner can update own driver profile" on public.drivers for update using (auth.uid() = owner_id);
```

**Realtime فعال روی این جدول** (`supabase_realtime` publication) — موبایل مستقیماً subscribe می‌کند، دقیقاً مثل وب.
**باکت Storage:** `drivers-images`.
**Cron خارجی (سرور وب/Vercel، ربطی به موبایل ندارد):** `/api/cron/deactivate-stale-drivers` هر ۵ دقیقه رانندگان با موقعیت قدیمی‌تر از ۱۰ دقیقه را `is_active=false` می‌کند.

```sql
create or replace function public.get_active_drivers(
  p_lat double precision default null, p_lng double precision default null,
  p_limit integer default 20, p_offset integer default 0
)
returns table (
  id uuid, vehicle_type text, vehicle_details text, contact_phone text, images text[],
  latitude double precision, longitude double precision,
  distance_meters double precision, last_location_update timestamptz, total_count bigint
)
language sql stable as $$
  with origin as (
    select case when p_lat is not null and p_lng is not null
      then ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography else null end as point
  )
  select d.id, d.vehicle_type, d.vehicle_details, d.contact_phone, d.images,
    case when d.location is not null then ST_Y(d.location::geometry) else null end,
    case when d.location is not null then ST_X(d.location::geometry) else null end,
    case when o.point is not null and d.location is not null
      then ST_Distance(d.location, o.point) else null end,
    d.last_location_update, count(*) over()
  from public.drivers d, origin o
  where d.is_active = true
  order by
    (case when o.point is not null and d.location is not null
      then ST_Distance(d.location, o.point) else null end) asc nulls last,
    d.last_location_update desc nulls last
  limit p_limit offset p_offset;
$$;

grant execute on function public.get_active_drivers(double precision, double precision, integer, integer)
  to anon, authenticated, service_role;
```

---

## 4️⃣ جدول `service_categories` (فهرست پویای تخصص‌ها)

```sql
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name_fa text not null,
  name_ps text not null,
  icon_source text not null check (icon_source in ('builtin','custom')),
  icon_key text,
  icon_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  constraint service_categories_icon_check check (
    (icon_source = 'builtin' and icon_key is not null and icon_url is null)
    or (icon_source = 'custom' and icon_url is not null and icon_key is null)
  )
);

create index if not exists service_categories_active_order_idx on public.service_categories (is_active, display_order);

alter table public.service_categories enable row level security;
create policy "Public can read active service categories" on public.service_categories for select using (is_active = true);
```

**داده‌ی اولیه (نسخه‌ی نهایی، شامل اصلاحات پشتوی فاز ۰۹):**

```sql
insert into public.service_categories (name_fa, name_ps, icon_source, icon_key, display_order) values
  ('بنا', 'بنا', 'builtin', 'ServiceBuilder', 1),
  ('برقکار', 'برېښنا کار', 'builtin', 'ServiceElectrician', 2),
  ('لوله‌کش', 'نلدوان', 'builtin', 'ServicePlumber', 3),
  ('نجار', 'ترکاڼ', 'builtin', 'ServiceCarpenter', 4),
  ('نقاش', 'رنګمال', 'builtin', 'ServicePainter', 5),
  ('جوشکار', 'جوشکار', 'builtin', 'ServiceWelder', 6),
  ('مکانیک', 'مېخانیک', 'builtin', 'ServiceMechanic', 7),
  ('کارگر روزمزد', 'ورځنی کارګر', 'builtin', 'ServiceDailyWorker', 8),
  ('خیاط', 'درزي', 'builtin', 'ServiceTailor', 9),
  ('سایر', 'نور', 'builtin', 'ServiceOther', 10)
on conflict do nothing;
```

**باکت Storage:** `service-category-icons` (خواندن عمومی؛ نوشتن فقط پنل ادمین). موبایل فقط select مستقیم برای پر کردن چیپ‌های فیلتر انجام می‌دهد.

---

## 5️⃣ جدول `service_providers` (خدمات فنی)

```sql
create table public.service_providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  service_category_id uuid not null references public.service_categories(id),
  contact_phone text not null,
  address text not null,
  description text,
  location geography(point, 4326),
  is_active boolean not null default true,        -- توجه: پیش‌فرض true (برخلاف drivers که false است)
  images text[] default '{}'::text[]
    check (array_length(images, 1) is null or array_length(images, 1) <= 5)
);

create index if not exists service_providers_category_idx on public.service_providers (service_category_id);
create index if not exists service_providers_location_gix on public.service_providers using gist (location);
create index if not exists service_providers_owner_id_idx on public.service_providers (owner_id);
create index if not exists service_providers_is_active_idx on public.service_providers (is_active);

alter table public.service_providers enable row level security;
create policy "Public can read service provider profiles" on public.service_providers for select using (is_active = true);
create policy "Owner can read own service provider profile any status" on public.service_providers for select using (auth.uid() = owner_id);
create policy "Owner can update own service provider profile" on public.service_providers for update using (auth.uid() = owner_id);
```

**نکته‌ی طراحی UI موبایل:** سوییچ `is_active` فقط دست ادمین است (پنهان‌سازی پروفایل بد بدون بلاک کامل حساب) — در UI موبایل هیچ کنترلی برای خودِ متخصص برای تغییر این مقدار قرار نگیرد، دقیقاً مثل وب.
**باکت Storage:** `service-providers-images`.

```sql
create or replace function public.get_active_service_providers(
  p_category uuid default null, p_lat double precision default null,
  p_lng double precision default null, p_query text default null,
  p_limit integer default 20, p_offset integer default 0
)
returns table (
  id uuid, service_category_id uuid, category_name_fa text, category_name_ps text,
  category_icon_source text, category_icon_key text, category_icon_url text,
  contact_phone text, address text, description text, images text[],
  latitude double precision, longitude double precision,
  distance_meters double precision, total_count bigint
)
language sql stable as $$
  with origin as (
    select case when p_lat is not null and p_lng is not null
      then ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography else null end as point
  ),
  filtered as (
    select sp.* from public.service_providers sp
    join public.service_categories sc on sc.id = sp.service_category_id
    where sc.is_active = true and sp.is_active = true
      and (p_category is null or sp.service_category_id = p_category)
      and (p_query is null or btrim(p_query) = '' or sp.address ilike '%' || p_query || '%')
  )
  select f.id, f.service_category_id, sc.name_fa, sc.name_ps, sc.icon_source, sc.icon_key, sc.icon_url,
    f.contact_phone, f.address, f.description, f.images,
    case when f.location is not null then ST_Y(f.location::geometry) else null end,
    case when f.location is not null then ST_X(f.location::geometry) else null end,
    case when o.point is not null and f.location is not null
      then ST_Distance(f.location, o.point) else null end,
    count(*) over()
  from filtered f
  join public.service_categories sc on sc.id = f.service_category_id, origin o
  order by
    (case when o.point is not null and f.location is not null
      then ST_Distance(f.location, o.point) else null end) asc nulls last,
    f.id desc
  limit p_limit offset p_offset;
$$;

grant execute on function public.get_active_service_providers(uuid, double precision, double precision, text, integer, integer)
  to anon, authenticated, service_role;
```

---

## 6️⃣ جدول `real_estate` (املاک)

```sql
create table public.real_estate (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  deal_type text not null check (deal_type in ('sale','rent')),
  property_type text not null
    check (property_type in ('house_sale','house_rent','land_sale','garden','shop','warehouse','other')),
  price numeric(12,2) not null check (price >= 0),
  address text not null,
  description text,
  images text[] not null check (cardinality(images) between 1 and 5),
  location geography(point, 4326),
  status text not null default 'pending'
    check (status in ('pending','approved','deleted'))
  -- بدون ستون title و بدون contact_phone (برخلاف listings) — شماره‌ی تماس با Join به users خوانده می‌شود.
);

create index if not exists real_estate_property_type_status_idx on public.real_estate (property_type, status);
create index if not exists real_estate_deal_type_status_idx on public.real_estate (deal_type, status);
create index if not exists real_estate_location_gix on public.real_estate using gist (location);
create index if not exists real_estate_owner_id_idx on public.real_estate (owner_id);

alter table public.real_estate enable row level security;
create policy "Public can read approved real_estate" on public.real_estate for select using (status = 'approved');
create policy "Owner can read own real_estate any status" on public.real_estate for select using (auth.uid() = owner_id);
create policy "Owner can update own real_estate" on public.real_estate for update using (auth.uid() = owner_id);
create policy "Owner can delete own real_estate" on public.real_estate for delete using (auth.uid() = owner_id);
```

**باکت Storage:** `real-estate-images`.

```sql
create or replace function public.get_real_estate_detail(p_id uuid)
returns table (
  id uuid, owner_id uuid, property_type text, deal_type text, price numeric,
  address text, description text, images text[], created_at timestamptz,
  latitude double precision, longitude double precision, contact_phone text
)
language sql stable as $$
  select r.id, r.owner_id, r.property_type, r.deal_type, r.price, r.address,
    r.description, r.images, r.created_at,
    case when r.location is not null then ST_Y(r.location::geometry) else null end,
    case when r.location is not null then ST_X(r.location::geometry) else null end,
    u.phone_number
  from public.real_estate r
  join public.users u on u.id = r.owner_id
  where r.id = p_id and r.status = 'approved';
$$;

create or replace function public.get_similar_real_estate(
  p_property_type text, p_deal_type text, p_exclude_id uuid,
  p_lat double precision default null, p_lng double precision default null,
  p_limit integer default 6
)
returns table (
  id uuid, property_type text, deal_type text, price numeric, address text,
  images text[], created_at timestamptz, distance_meters double precision
)
language sql stable as $$
  select r.id, r.property_type, r.deal_type, r.price, r.address, r.images, r.created_at,
    case when p_lat is not null and p_lng is not null and r.location is not null
      then ST_Distance(r.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)
      else null end
  from public.real_estate r
  where r.status = 'approved' and r.property_type = p_property_type
    and r.deal_type = p_deal_type and r.id <> p_exclude_id
  order by
    (case when p_lat is not null and p_lng is not null and r.location is not null
      then ST_Distance(r.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)
      else null end) asc nulls last,
    r.created_at desc
  limit p_limit;
$$;

create or replace function public.search_real_estate(
  p_property_type text default null, p_deal_type text default null,
  p_lat double precision default null, p_lng double precision default null,
  p_query text default null, p_limit integer default 20, p_offset integer default 0
)
returns table (
  id uuid, property_type text, deal_type text, price numeric, address text,
  images text[], created_at timestamptz, distance_meters double precision, total_count bigint
)
language sql stable as $$
  with origin as (
    select case when p_lat is not null and p_lng is not null
      then ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography else null end as point
  ),
  filtered as (
    select r.* from public.real_estate r
    where r.status = 'approved'
      and (p_property_type is null or r.property_type = p_property_type)
      and (p_deal_type is null or r.deal_type = p_deal_type)
      and (p_query is null or btrim(p_query) = '' or r.address ilike '%' || p_query || '%')
  )
  select f.id, f.property_type, f.deal_type, f.price, f.address, f.images, f.created_at,
    case when o.point is not null and f.location is not null
      then ST_Distance(f.location, o.point) else null end,
    count(*) over()
  from filtered f, origin o
  order by
    (case when o.point is not null and f.location is not null
      then ST_Distance(f.location, o.point) else null end) asc nulls last,
    f.created_at desc
  limit p_limit offset p_offset;
$$;

grant execute on function public.get_real_estate_detail(uuid) to anon, authenticated, service_role;
grant execute on function public.get_similar_real_estate(text, text, uuid, double precision, double precision, integer) to anon, authenticated, service_role;
grant execute on function public.search_real_estate(text, text, double precision, double precision, text, integer, integer) to anon, authenticated, service_role;
```

---

## 7️⃣ جدول `reports` (گزارش تخلف)

```sql
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),

  target_type text not null check (target_type in ('listing','driver','service_provider','real_estate','user')),
  target_id uuid not null,                          -- بدون FK واقعی (طراحی چندریختی/Polymorphic)
  reason text not null check (reason in ('scam','inappropriate_content','fake_listing','other')),
  description text,
  status text not null default 'pending' check (status in ('pending','reviewed','resolved'))
);

create index if not exists reports_target_idx on public.reports (target_type, target_id);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);

alter table public.reports enable row level security;
-- بدون Policy عمومی — گزارش‌ها هرگز برای عموم قابل مشاهده نیستند.
create policy "Reporter can read own reports" on public.reports for select using (auth.uid() = reporter_id);
create policy "Reporter can insert own reports" on public.reports for insert with check (auth.uid() = reporter_id);
```

اعتبارسنجی وجودِ واقعی `target_id` (که آگهی/راننده/متخصص/ملک/کاربر مشخص‌شده واقعاً وجود دارد) سمت سرور انجام می‌شود — پل موبایل باید همان بررسی را عیناً تکرار کند.

---

## 8️⃣ جدول `otp_codes`

```sql
create table public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  created_at timestamptz not null default now(),

  -- 🔶 بازسازی‌شده از رفتار کد:
  code text not null,
  expires_at timestamptz not null,
  is_used boolean not null default false,
  attempts integer not null default 0
);

create index if not exists otp_codes_phone_created_idx on public.otp_codes (phone_number, created_at desc);

alter table public.otp_codes enable row level security;
-- بدون Policy → این جدول هرگز مستقیم از موبایل خوانده نمی‌شود؛ فقط سرور (لایه‌ی API موبایل) با Service Role.
```

**قوانین کسب‌وکار (سمت سرور — باید عیناً در لایه‌ی API موبایل هم رعایت شود):**
کول‌داون ۶۰ ثانیه بین دو درخواست کد برای یک شماره؛ حداکثر ۵ درخواست در ساعت؛ انقضا ۲ دقیقه؛ حداکثر ۵ تلاش اشتباه.

---

## 9️⃣ جدول `admin_logs`

```sql
create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  target_type text not null,   -- user, listing, real_estate, driver, service_provider
  target_id uuid not null,
  action text not null
);

create index if not exists admin_logs_created_at_idx on public.admin_logs (created_at desc);
alter table public.admin_logs enable row level security;
-- بدون Policy → کاملاً خارج از محدوده‌ی موبایل؛ فقط پنل ادمین وب می‌نویسد.
```

---

## 🗄️ باکت‌های Storage (خلاصه)

| باکت | خواندن | نوشتن واقعی |
|---|---|---|
| `listings-images` | عمومی | Signed URL از سرور (Service Role) |
| `drivers-images` | عمومی | همان الگو |
| `service-providers-images` | عمومی | همان الگو |
| `real-estate-images` | عمومی | همان الگو |
| `service-category-icons` | عمومی | فقط پنل ادمین |

قرارداد مسیر فایل: `{owner_id}/{filename}`. لایه‌ی API موبایل باید دقیقاً همین الگوی Signed URL را تکرار کند — هرگز آپلود مستقیم با Anon Key.

---

## ⚙️ تنظیمات سطح دیتابیس

```sql
create extension if not exists postgis;

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;

alter publication supabase_realtime add table public.drivers;
```

Realtime فقط روی `drivers` فعال است — `listings`/`real_estate`/`service_providers` با «نمایش موارد بیشتر»/رفرش دستی کار می‌کنند، نه Push زنده (طراحی عمدی مشترک وب و موبایل).

---

## 🔑 محیط اجرا — چه چیزی به پروژه‌ی موبایل می‌رسد

| متغیر | در پروژه‌ی موبایل |
|---|---|
| URL پروژه‌ی Supabase | ✅ همان مقدار وب، به‌عنوان `EXPO_PUBLIC_SUPABASE_URL` |
| Anon Key | ✅ همان مقدار وب، به‌عنوان `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Service Role Key | ❌ هرگز — فقط سمت سرور Next.js |
| `SESSION_SECRET` | ❌ هرگز در کد اپ — فقط سرور امضا/تایید می‌کند؛ اپ فقط توکنِ نتیجه را نگه می‌دارد |

---

**پایان مرجع دیتابیس فاز موبایل.**

### ۱۴۰۵/۰۵/۱۶ (2026-08-07) — رفع باگ استقرار — SECURITY DEFINER جاافتاده روی ۴ تابع عمومی (بعد از فاز ۱۰)

توضیح: بعد از تست واقعیِ اپ موبایل (Expo Go)، مشخص شد صفحه‌ی اصلی و صفحات فهرست (کالا، ملک،
حمل‌ونقل، خدمات) هیچ داده‌ای نمایش نمی‌دهند. خطای دقیق سمت موبایل (کلید anon):
`permission denied for table users` (کد Postgres 42501)، با این hint:
`Grant the required privileges to the current role with: GRANT SELECT ON public.users TO anon;`

ریشه‌یابی: هر ۴ تابع `search_listings`، `search_real_estate`، `get_active_drivers`،
`get_active_service_providers` — که طبق طراحی اولیه باید `SECURITY DEFINER` باشند (اجرا با
دسترسی owner یعنی `postgres`، نه با دسترسی محدودِ نقشِ صدازننده؛ همان الگویی که از ابتدا اجازه
می‌داد این توابع با `grant execute ... to anon` بدون نیاز به دسترسی مستقیم جدول‌ها کار کنند) —
وقتی در فاز ۱۰ (`21_phase_10_province_feature.sql`) برای افزودن پارامتر `p_province` با
`DROP FUNCTION` + بازسازی از نو ساخته شدند، **ویژگی `SECURITY DEFINER` در بازسازی جا افتاد** و
بی‌صدا به پیش‌فرض `SECURITY INVOKER` برگشت. روی وب این باگ دیده نشد چون خواندن‌های سمت سرور با
Service Role Key انجام می‌شوند (که خودش به همه‌چیز دسترسی دارد، مستقل از این تنظیم)؛ فقط
مسیرهای موبایل که مستقیماً با کلید anon این توابع را صدا می‌زنند (`lib/marketplace/api.ts`,
`lib/realEstate/api.ts`, `lib/transport/api.ts`, `lib/services/api.ts` در پروژه‌ی موبایل) این
مشکل را نشان دادند.

⚠️ راه‌حلِ رد‌شده: پیام خطا خودش پیشنهاد `GRANT SELECT ON public.users TO anon` را می‌دهد — این
کار عمداً انجام **نشد**، چون کل جدول `users` (شماره تلفن، role، وضعیت مسدودی و بقیه‌ی ستون‌ها)
را برای هر کسی با کلید anon (یعنی عملاً همه) قابل‌خواندن می‌کرد. راه‌حل درست، فقط برگرداندنِ
`SECURITY DEFINER` روی خودِ تابع بود.

تایید قبل از اجرا: با یک کوئری فقط‌خواندنی (`select p.prosecdef ...`) ابتدا `is_security_definer:
false` روی هر ۴ تابع (owner=postgres) تایید شد، سپس اصلاح اجرا شد.

فایل کامل: `24_fix_rpc_functions_security_definer.sql` (پیوست).

```sql
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'search_listings',
        'search_real_estate',
        'get_active_drivers',
        'get_active_service_providers'
      )
  loop
    execute format('alter function %s security definer', r.sig);
  end loop;
end $$;
```

**یادداشت برای مهاجرت‌های آینده:** هر بار که یکی از این ۴ تابع (یا هر تابع دیگری که با
`grant execute ... to anon` طراحی شده) با الگوی «همیشگیِ پروژه» یعنی `DROP FUNCTION` + بازسازی
از نو تغییر کند، حتماً `SECURITY DEFINER` را صریحاً در تعریف تازه بگنجانید — این ویژگی به‌صورت
خودکار از نسخه‌ی قبلی منتقل نمی‌شود.

---

اجرا شده در دیتابیس برای بخش آپدیت اپلیکیشن: 
-- مسیر پیشنهادی: supabase/migrations/xxxx_app_version_config.sql
-- (یا مستقیم در Supabase Studio → SQL Editor اجرا کنید — نیازی به فایلِ migration رسمی نیست.)
--
-- جدولِ کنترلِ نسخه‌ی اپِ موبایل — طبق درخواستِ صریحِ کارفرما: یک ردیفِ ثابت و ساده (id=1) که
-- مستقیماً از پنلِ Table Editor خودِ Supabase ویرایش می‌شود؛ هیچ پنلِ ادمینِ تازه‌ای لازم نیست.
--
-- دو سناریو، دقیقاً با همین دو ستون:
--   ۱) آپدیتِ اجباری  → latest_version را افزایش بده + force_update = true
--   ۲) آپدیتِ اختیاری → فقط latest_version را افزایش بده، force_update = false بماند
--
-- نسخه‌ی نصب‌شده روی گوشیِ هر کاربر، همان چیزی است که در app.json (فیلدِ expo.version) پیش از
-- هر Build تنظیم می‌کنید — همان عددی که در استور/صفحه‌ی دانلود هم به‌عنوانِ «نسخه» دیده می‌شود.

create table if not exists app_version_config (
  -- محدود به یک ردیفِ ثابت — این جدول هرگز بیش از یک ردیف نخواهد داشت.
  id smallint primary key default 1 check (id = 1),
  -- نسخه‌ی هدف، مثلاً '1.2.0' یا حتی فقط '2' — هر دو فرمت درست کار می‌کنند.
  latest_version text not null,
  -- true = آپدیتِ اجباری (کاربر تا آپدیت نکند، به هیچ بخشِ اپ دسترسی ندارد)
  -- false = آپدیتِ اختیاری (یک‌بار پیام نشان داده می‌شود، کاربر می‌تواند رد کند)
  force_update boolean not null default false,
  -- پیامِ اختصاصی (اختیاری) — اگر خالی/NULL باشد، اپ خودش یک پیامِ پیش‌فرضِ مناسب نشان می‌دهد.
  -- مثال برای سناریوی امنیتی: 'یک بروزرسانیِ امنیتیِ مهم منتشر شده؛ لطفاً همین الان آپدیت کنید.'
  update_message_fa text,
  update_message_ps text,
  -- لینکِ دانلودِ فایلِ APK یا صفحه‌ی دانلود (چون فعلاً نصبی است، نه از طریقِ Google Play).
  download_url text,
  updated_at timestamptz not null default now()
);

-- ردیفِ اولیه — با نسخه‌ی فعلیِ اپ (app.json) هماهنگ نگه دارید.
insert into app_version_config (id, latest_version, force_update, download_url)
values (1, '1.0.0', false, 'https://yakja.top')
on conflict (id) do nothing;

-- خواندنِ عمومی (کاربرِ مهمان و واردشده، هردو) — دقیقاً هم‌الگو با سیاستِ RLS جدولِ
-- service_categories: این یک تنظیمِ کاملاً عمومی و بی‌خطر است، هیچ داده‌ی حساسی ندارد.
alter table app_version_config enable row level security;

create policy "Public can read app version config"
  on app_version_config
  for select
  to anon, authenticated
  using (true);

-- به‌روزرسانیِ خودکارِ updated_at — فقط برای این‌که همیشه بدانید آخرین تغییر کِی بوده؛ به خودِ
-- منطقِ اپ هیچ ربطی ندارد.
create or replace function set_app_version_config_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_version_config_updated_at on app_version_config;
create trigger app_version_config_updated_at
  before update on app_version_config
  for each row
  execute function set_app_version_config_updated_at();