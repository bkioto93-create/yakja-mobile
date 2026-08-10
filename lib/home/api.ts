// مسیر فایل: lib/home/api.ts
// چک‌آپ هم‌ترازی صفحه‌ی اصلی موبایل با نسخه‌ی تازه‌طراحی‌شده‌ی وب — لایه‌ی خواندنِ داده برای پنج
// بخشِ صفحه‌ی اصلی («رانندگان تازه»، «متخصصین تازه»، «آگهی‌های تازه‌ی کالا»، «آگهی‌های تازه‌ی
// ملک»، و «تازه‌ترین استوری‌ها»). دقیقاً هم‌الگو با src/lib/home/homeQueries.ts وب، با یک تفاوت
// معماری آگاهانه به‌جای پنج Export جدا: چون هر پنج بخش همیشه با هم، همان یک‌بار mount شدن صفحه‌ی
// اصلی، لازم‌اند، یک تابع واحد getHomeShowcase همه را موازی می‌گیرد و برمی‌گرداند — یک تماس
// شبکه‌ی کمتر و یک وضعیت loading واحد برای کل صفحه.
//
// دو مسیر متفاوت برای پنج بخش (دقیقاً طبق جدول بند ۳ سند راهبردی موبایل):
//   - listings/realEstate → «مسیر اول» — مستقیم با Anon Key، از توابع از-قبل-موجودِ
//     lib/marketplace/api.ts::searchListings و lib/realEstate/api.ts::searchRealEstate.
//   - drivers/providers/stories → «مسیر دوم» — از پل موبایل (Route
//     GET /api/mobile/v1/home/newest) چون هر سه به Join با جدول users برای نام مالک نیاز
//     دارند و آن جدول Policy عمومی ندارد. **به‌روزرسانی (هم‌سازی استوری):** این Route قبلاً فقط
//     drivers/providers برمی‌گرداند؛ حالا stories هم به همان یک پاسخ اضافه شده — رجوع کنید به
//     یادداشت کامل بالای خودِ آن Route وب. mediaUrl استوری‌ها از قبل کامل است (سرور خودش
//     getStoryMediaUrl را صدا زده)، برخلاف images راننده/متخصص که هنوز مسیر خام Storage است.
//
// 🆕 به‌روزرسانی (فاز ۱۰ موبایل — قابلیت «ولایت»): getHomeShowcase حالا یک پارامتر سوم اختیاری
// (province) می‌گیرد و آن را به هر سه منبع پاس می‌دهد — دقیقاً هم‌الگو با getNewestDriversForHome/
// getNewestProvidersForHome/getNewestListingsForHome/getNewestRealEstateForHome وب که همگی
// آرگومان province می‌گیرند (src/lib/home/homeQueries.ts). province=null (پیش‌فرض) یعنی «همه‌ی
// افغانستان»، دقیقاً هم‌رفتار با وب.
//
// 🛠️ اصلاح باگ جدی (گزارش‌شده بعد از تست واقعی: «زیر دسترسی عاجل هیچی لود نمی‌شود»): قبلاً این
// تابع سه منبع (fetchNewest / searchListings / searchRealEstate) را با Promise.all می‌گرفت —
// یعنی اگر فقط یکی از این سه (مثلاً به‌خاطر یک خطای شبکه‌ی موقت، یا هر خطای دیگری در سمت سرور)
// شکست می‌خورد، Promise.all کل درخواست را reject می‌کرد، و catch بالادستی در app/(tabs)/index.tsx
// هر پنج بخش را (نه فقط بخش خراب) خالی می‌گذاشت — یعنی یک خطا در، مثلاً، فقط searchRealEstate،
// باعث می‌شد رانندگان/متخصصین/آگهی‌های کالا هم که کاملاً سالم بودند، اصلاً دیده نشوند.
//
// رفعش: Promise.allSettled به‌جای Promise.all — هر منبع کاملاً مستقل از بقیه ارزیابی می‌شود؛
// اگر یکی شکست بخورد، فقط همان یک بخش خالی می‌ماند (نه همه) و خطای دقیقش با console.error چاپ
// می‌شود (قابل‌دیدن در ترمینال `npx expo start`) تا اگر مشکل واقعاً تکرار شد، بشود دقیقاً فهمید
// کدام یک از سه منبع خراب است.
import { ListingSummary, searchListings } from '@/lib/marketplace/api';
import { RealEstateSummary, searchRealEstate } from '@/lib/realEstate/api';
import { getServiceProviderImageUrls } from '@/lib/services/images';
import { apiFetch } from '@/lib/session';
import { getDriverImageUrls } from '@/lib/transport/images';
import { VehicleTypeId } from '@/lib/transport/vehicleTypes';

export type HomeDriverPreview = {
  id: string;
  ownerName: string | null;
  vehicleType: VehicleTypeId;
  images: string[];
};

export type HomeProviderPreview = {
  id: string;
  ownerName: string | null;
  categoryNameFa: string | null;
  categoryNamePs: string | null;
  categoryIconSource: 'builtin' | 'custom';
  categoryIconKey: string | null;
  categoryIconUrl: string | null;
  images: string[];
};

// دقیقاً هم‌شکلِ HomeStoryPreview وب (src/lib/stories/storyQueries.ts).
// **افزوده‌شده (سنجاق‌شدنِ استوریِ مدیریت):** وب همین حالا isOfficial را در پاسخِ همان Route
// مشترک (GET /api/mobile/v1/home/newest) برمی‌گرداند — اینجا فقط باید در تایپ هم اضافه شود تا
// مقداری که از قبل در JSON می‌آید، در موبایل هم قابل‌استفاده باشد؛ هیچ فچِ تازه‌ای لازم نیست.
export type HomeStoryPreview = {
  storyId: string;
  ownerId: string;
  ownerName: string | null;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  createdAt: string;
  isOfficial: boolean;
};

export type HomeShowcase = {
  drivers: HomeDriverPreview[];
  providers: HomeProviderPreview[];
  listings: ListingSummary[];
  realEstate: RealEstateSummary[];
  stories: HomeStoryPreview[];
};

// شکل خام پاسخ Route (مسیرهای Storage راننده/متخصص هنوز خام‌اند؛ mediaUrl استوری از قبل کامل است).
type RawNewestResponse = {
  drivers: (Omit<HomeDriverPreview, 'images'> & { images: string[] })[];
  providers: (Omit<HomeProviderPreview, 'images'> & { images: string[] })[];
  stories: HomeStoryPreview[];
};

async function fetchNewest(
  limit: number,
  storiesLimit: number,
  province: string | null
): Promise<{
  drivers: HomeDriverPreview[];
  providers: HomeProviderPreview[];
  stories: HomeStoryPreview[];
}> {
  // فاز ۱۰ — province در query string فقط اگر مقدار داشته باشد اضافه می‌شود؛ Route وب هم برای
  // نبودِ این پارامتر «بدون فیلتر» را پیش‌فرض می‌گیرد (رجوع کنید به route.ts::rawProvince).
  const provinceQuery = province ? `&province=${province}` : '';
  const res = await apiFetch(
    `/api/mobile/v1/home/newest?limit=${limit}&storiesLimit=${storiesLimit}${provinceQuery}`
  );
  const data: RawNewestResponse = await res.json();
  return {
    drivers: data.drivers.map((d) => ({ ...d, images: getDriverImageUrls(d.images) })),
    providers: data.providers.map((p) => ({ ...p, images: getServiceProviderImageUrls(p.images) })),
    stories: data.stories,
  };
}

export async function getHomeShowcase(
  limit = 10,
  storiesLimit = 10,
  province: string | null = null
): Promise<HomeShowcase> {
  const [newestResult, listingsSettled, realEstateSettled] = await Promise.allSettled([
    fetchNewest(limit, storiesLimit, province),
    searchListings({ limit, province }),
    searchRealEstate({ limit, province }),
  ]);

  // هر سه منبع کاملاً مستقل از هم بررسی می‌شوند — شکستِ یکی، دو تای دیگر را خالی نمی‌کند.
  if (newestResult.status === 'rejected') {
    console.error('[getHomeShowcase] fetchNewest (drivers/providers/stories) failed:', newestResult.reason);
  }
  if (listingsSettled.status === 'rejected') {
    console.error('[getHomeShowcase] searchListings failed:', listingsSettled.reason);
  }
  if (realEstateSettled.status === 'rejected') {
    console.error('[getHomeShowcase] searchRealEstate failed:', realEstateSettled.reason);
  }

  const newest =
    newestResult.status === 'fulfilled' ? newestResult.value : { drivers: [], providers: [], stories: [] };
  const listings = listingsSettled.status === 'fulfilled' ? listingsSettled.value.listings : [];
  const realEstate = realEstateSettled.status === 'fulfilled' ? realEstateSettled.value.items : [];

  return {
    drivers: newest.drivers,
    providers: newest.providers,
    listings,
    realEstate,
    stories: newest.stories,
  };
}