// مسیر فایل: app/(tabs)/transport.tsx — معادل /transport وب — فاز M03، تسک‌های ۱، ۲ و ۶
//
// طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل («Supabase مستقیم (get_active_drivers) + Realtime»)،
// این صفحه مستقیماً تابع Postgres get_active_drivers را (با Anon Key، از lib/transport/api.ts)
// صدا می‌زند — بدون هیچ Route تازه در پل موبایل؛ دقیقاً هم‌الگو با app/(tabs)/listings.tsx
// (فاز M02، تسک ۱).
//
// این تسک دقیقاً معادل تسک ۸ فاز ۰۳ وب است («ساخت فهرست رانندگان فعال... مرتب‌شده بر اساس
// نزدیک‌ترین فاصله (PostGIS)، با به‌روزرسانی زنده از طریق Supabase Realtime»). به همین دلیل این
// نسخه عمداً بدون فرم پروفایل راننده، سوییچ فعال/غیرفعال، جستجوی دستی شهر/منطقه، و دکمه‌ی
// «گزارش تخلف» است — هرکدام موضوع یک تسک جداگانه‌ی همین فاز (به‌ترتیب تسک‌های ۳، ۴، ۷، ۸) خواهند
// بود. دکمه‌ی «من راننده‌ام» فقط به مسیر از‌پیش‌ساخته‌شده‌ی app/transport/driver.tsx لینک می‌شود (که
// تا تسک ۳ همچنان PlaceholderScreen می‌ماند) — دقیقاً هم‌الگو با دکمه‌ی «ثبت آگهی» در listings.tsx
// که به مسیری لینک می‌شود که ممکن است هنوز کامل نباشد.
//
// **به‌روزرسانی تسک ۲ فاز M03:** دکمه‌ی تماس یک‌لمسی با پروتکل tel: زیر مشخصات هر راننده اضافه
// شد — دقیقاً همان الگوی دکمه‌ی تماس در app/listings/[id].tsx (فاز M02): یک Button ساده با
// onPress={() => Linking.openURL(`tel:...`)}، بدون هیچ کامپوننت یا کتابخانه‌ی تازه. هیچ تغییری در
// lib/transport/api.ts لازم نبود چون contactPhone از همان تسک ۱ در ActiveDriverSummary موجود بود؛
// این تسک صرفاً یک دکمه‌ی رابط کاربری اضافه کرد.
//
// **به‌روزرسانی تسک ۶ فاز M03 (مدیریت مجوز GPS اندروید — درخواست صریح + پیام راهنما در صورت رد):**
// تا پیش از این تسک، useMyLocation فقط یک حالت «رد شد» می‌شناخت (locationDenied بولی) و همیشه
// همان یک پیام عمومی «دسترسی ممکن نشد» را نشان می‌داد — حتی وقتی کاربر با «دیگر نشان نده» مجوز را
// برای همیشه رد کرده بود، که در آن حالت دوباره زدن همان دکمه هیچ‌وقت پنجره‌ی سیستمی تازه‌ای باز
// نمی‌کند (اندروید بی‌صدا 'denied' برمی‌گرداند) — یعنی کاربر گیر می‌افتاد بدون هیچ راه‌حلی جلوی
// چشمش. رفع شد: به‌جای فراخوانی مستقیم Location.requestForegroundPermissionsAsync، اکنون از
// requestLocationAccess مشترک (lib/location.ts، تازه) استفاده می‌شود که با فیلد canAskAgain
// (و بررسی جداگانه‌ی hasServicesEnabledAsync) سه حالت را از هم تشخیص می‌دهد: 'deniedRetry' (همان
// پیام قبلی locationDeniedNotice کافی است — دفعه‌ی بعد پنجره‌ی سیستمی دوباره باز می‌شود)،
// 'deniedBlocked' و 'servicesDisabled' (هر دو نیازمند یک پیام راهنمای تازه + دکمه‌ی «باز کردن
// تنظیمات گوشی» که با Linking.openSettings() پنل تنظیمات همین اپ را باز می‌کند — تنها راه واقعی
// خروج از این دو حالت). کلیدهای تازه‌ی دیکشنری: transport.list.locationBlockedNotice،
// transport.list.locationServicesDisabledNotice، common.openSettingsButton (مشترک، چون
// app/transport/driver.tsx هم دقیقاً همین دکمه را لازم دارد — نگاه کنید به کامنت تسک ۶ همان‌جا).
//
// **به‌روزرسانی تسک ۷ فاز M03 (جستجوی دستی شهر/منطقه به‌جای GPS):** تا پیش از این تسک، تنها راه
// مرتب‌سازی بر اساس فاصله همان دکمه‌ی «نمایش نزدیک‌ترین‌ها» (GPS دستگاه) بود؛ اگر کاربر مجوز GPS
// نمی‌داد/نمی‌توانست بدهد (یا اصلاً نمی‌خواست GPS گوشی‌اش را روشن کند)، هیچ جایگزینی نداشت.
// برخلاف app/(tabs)/listings.tsx (فاز M02) که در آن یک جستجوی متنی واقعی سمت سرور اضافه شد
// (چون listings ستون address دارد و search_listings با p_query روی همان ستون ILIKE می‌زند)،
// اینجا چنین راهی وجود ندارد: جدول drivers هیچ ستون آدرس/شهر متنی ندارد — فقط یک ستون location
// (geography point) که فقط با مختصات واقعی پر می‌شود (نگاه کنید به docs/YAKJA_DATABASE_LOG.md،
// فاز ۰۳). پس افزودن یک ستون تازه یا یک p_query تازه به get_active_drivers، هم نیازمند مهاجرت
// دیتابیس بود و هم نیازمند افزودن فیلد آدرس به فرم پروفایل راننده (app/transport/driver.tsx) —
// که هیچ‌کدام طبق اصل بنیادین سند راهبردی موبایل («هیچ جدول تازه») و طبق متن دقیق خودِ تسک
// («جستجوی دستی... به‌جای GPS»، نه «فیلتر بر اساس آدرس راننده») لازم نبود.
//
// راه‌حل: از expo-location — همان کتابخانه‌ای که دکمه‌ی GPS از قبل استفاده می‌کند — تابع
// Location.geocodeAsync(cityName) صدا زده می‌شود (Forward Geocoding: تبدیل یک نام مکان به
// مختصات، دقیقاً برعکس Reverse Geocoding). این تابع هیچ مجوز GPS/موقعیت مکانی لازم ندارد (فقط
// اتصال اینترنت)؛ نتیجه‌اش دقیقاً همان شکل { lat, lng } را پر می‌کند که getCurrentPositionAsync
// (دکمه‌ی GPS) هم پر می‌کرد. یعنی از دید fetchPage/get_active_drivers هیچ فرقی بین «کاربر GPS
// زد» و «کاربر نام شهر تایپ کرد» وجود ندارد — هر دو فقط coords را پر می‌کنند؛ صفر تغییر در
// lib/transport/api.ts یا هر تابع Postgres.
//
// state تازه‌ی coordsSource ('gps' | 'search' | null) فقط برای تعیین متن درست پیام «بر اساس چه
// چیزی مرتب شده» استفاده می‌شود (sortedByDistanceNotice برای GPS، sortedBySearchNotice با
// جایگذاری {query} برای جستجوی دستی) — در منطق فراخوانی get_active_drivers هیچ نقشی ندارد. اگر
// geocodeAsync نتیجه‌ی خالی برگرداند (نام واردشده تشخیص داده نشد) یا شبکه خطا بدهد، پیام
// searchNotFoundNotice نمایش داده می‌شود؛ کلیدهای دیکشنری تازه: transport.list.searchPlaceholder/
// searchButton/searchingButton/searchNotFoundNotice/sortedBySearchNotice (در fa.ts/ps.ts).
//
// **به‌روزرسانی تسک ۸ فاز M03 (دکمه‌ی «گزارش تخلف»):** دقیقاً هم‌الگو با app/listings/[id].tsx
// (فاز M02، تسک ۸): یک Button ساده زیر دکمه‌ی تماس هر راننده اضافه شد که با
// router.push({ pathname: '/report/new', params: { targetType: 'driver', targetId: item.id } })
// به فرم گزارش (فعلاً همچنان PlaceholderScreen، فاز M06) می‌رود؛ 'driver' دقیقاً همان مقداری
// است که در lib/reports/reportTargets.ts (REPORT_TARGET_TYPES) تعریف شده. هیچ کلید دیکشنری
// تازه‌ای لازم نبود — dict.reports.reportButtonLabel از قبل (فاز M00) برای همین منظور نوشته شده
// بود و در M02 هم عیناً همین متن استفاده شد. برخلاف کالا (که هر آگهی صفحه‌ی جزئیات مستقل خودش
// را دارد)، رانندگان صفحه‌ی جزئیات جدا ندارند — کل اطلاعات همین‌جا، روی کارت فهرست، نمایش داده
// می‌شود؛ پس دکمه‌ی گزارش هم دقیقاً همین‌جا، روی همان کارت، معنادار است.
//
// اشتراک Realtime: دقیقاً هم‌الگو با src/app/[lang]/transport/ActiveDriversList.tsx وب — با
// رسیدن هر رویدادی (INSERT/UPDATE/DELETE) روی جدول drivers، به‌جای پچ‌کردن دستی آرایه از روی
// payload خودِ رویداد، همان تابع get_active_drivers دوباره صدا زده می‌شود؛ چون payload رویداد
// تابع سیاست RLS جدول drivers است و مرتب‌سازی/فاصله باید دوباره توسط PostGIS محاسبه شود، رویداد
// Realtime اینجا صرفاً «علامت شروع دوباره‌خوانی» است، نه منبع داده. تفاوت با وب: وب برای
// دوباره‌خوانی از supabaseAdminClient (سرور، بدون RLS) استفاده می‌کند؛ اینجا چون get_active_drivers
// از قبل با grant execute به anon عمومی و امن است، همان تابع سمت کلاینت دوباره صدا زده می‌شود —
// نیازی به دور زدن RLS نیست.
//
// ⚠️ فرض فنی نیازمند تایید روی دستگاه واقعی: نسخه‌ی نصب‌شده‌ی @supabase/supabase-js (۲.۱۱۰.۸) از
// Realtime روی React Native/Expo (با WebSocket بومی) پشتیبانی می‌کند؛ فراخوانی‌های ساده‌ی rpc/fetch
// روی همین کلاینت (lib/supabase.ts) در فاز M02 تایید شده‌اند، اما خودِ کانال Realtime
// (postgres_changes) پیش از این تسک هیچ‌جای پروژه‌ی موبایل امتحان نشده بود. اگر اتصال WebSocket
// روی دستگاه واقعی برقرار نشود، فهرست هنوز با همان فراخوانی اولیه‌ی get_active_drivers درست کار
// می‌کند — فقط به‌روزرسانی زنده (بدون رفرش) کار نخواهد کرد. رفع احتمالی (در صورت نیاز، بدون تغییر
// این فایل): افزودن `import 'react-native-url-polyfill/auto';` به ابتدای lib/supabase.ts.
import { ReportButton } from '@/components/ReportButton';
import { ChatButton } from '@/components/chat/ChatButton';
import { TransportDisabledNotice } from '@/components/transport/TransportDisabledNotice';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { VipBadge } from '@/components/vip/VipBadge';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useProvince } from '@/context/ProvinceContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getCached, setCached } from '@/lib/cache';
import { LocationAccessStatus, requestLocationAccess } from '@/lib/location';
import { useAutoRetryOnReconnect } from '@/lib/network';
import { supabase } from '@/lib/supabase';
import { ActiveDriverSummary, getActiveDrivers } from '@/lib/transport/api';
import { useTransportModuleEnabled } from '@/lib/transport/moduleStatus';
import { VEHICLE_TYPES, VehicleTypeId } from '@/lib/transport/vehicleTypes';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const PAGE_SIZE = 20;
const LOCATION_TIMEOUT_MS = 8000;
// فاز M07، تسک ۱ — کلید کش محلی «آخرین فهرست» این ماژول (فقط حالت پیش‌فرض، بدون GPS/جستجو).
const LIST_CACHE_KEY = 'transport:list';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

function vehicleIcon(vehicleType: string) {
  const found = VEHICLE_TYPES.find((v) => v.id === vehicleType);
  return found ? found.icon : VEHICLE_TYPES[VEHICLE_TYPES.length - 1].icon;
}

// 🆕 فیلترِ نوعِ وسیله — دقیقاً معادلِ همان چیزی که وب دارد
// (src/app/[lang]/transport/ActiveDriversList.tsx :: selectedVehicleType)، فقط قبلاً هرگز به
// موبایل منتقل نشده بود. طبق بازخوردِ کارفرما اضافه شد. الگوی 'all' | id عیناً از
// CategoryFilter در همین پوشه (app/(tabs)/services.tsx) کپی شده — همان الگوی state محلی
// (نه query string)، بدون هیچ تغییری در بک‌اند، چون getActiveDrivers از قبل پارامترِ
// vehicleType را کامل پشتیبانی می‌کرد (رجوع کنید به lib/transport/api.ts).
type VehicleTypeFilter = VehicleTypeId | 'all';

export default function TransportScreen() {
  const dict = useDictionary();
  // فاز ۱۰ موبایل — قابلیت «ولایت».
  const { province } = useProvince();
  const { user } = useAuth();
  const router = useRouter();

  // 🆕 فاز M09 — همگام‌سازی با وب، «غیرفعال‌سازی موقت بخش راننده و بار»: undefined = هنوز در
  // حالِ بررسی، false = ادمین از پنل خاموش کرده. تمام Hookهای دیگرِ این کامپوننت (فهرست، GPS،
  // جستجو، Realtime) دست‌نخورده و بی‌شرط زیرِ همین خط تعریف می‌مانند — قانونِ Hookهای React
  // اجازه نمی‌دهد این‌ها را داخل یک `if` ببریم؛ به‌جایش فقط تصمیمِ *رندر* (پایین‌ترِ همین تابع)
  // بین فهرستِ واقعی و TransportDisabledNotice انتخاب می‌کند، دقیقاً هم‌اثر با شرطِ
  // `if (!moduleEnabled) return <TransportDisabledNotice .../>` در transport/page.tsx وب.
  const moduleEnabled = useTransportModuleEnabled();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  // 🆕 فیلترِ نوعِ وسیله — رجوع کنید به یادداشتِ کاملِ کنارِ تعریفِ VehicleTypeFilter بالای فایل.
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleTypeFilter>('all');
  // تسک ۶ — جایگزین بولیِ قبلیِ locationDenied: هر چهار حالت ممکنِ requestLocationAccess را
  // نگه می‌دارد (null یعنی هنوز مشکلی گزارش نشده، مثلاً هنوز هیچ‌وقت دکمه زده نشده یا آخرین
  // تلاش موفق بوده).
  const [locationStatus, setLocationStatus] = useState<LocationAccessStatus | null>(null);

  // تسک ۷ — جستجوی دستی شهر/منطقه به‌جای GPS؛ جزئیات کامل در کامنت بالای فایل. cityQuery متن
  // خام ورودی کاربر است؛ searchedQueryLabel همان متنی است که واقعاً geocode شده (برای نمایش در
  // sortedBySearchNotice) — این دو عمداً از هم جدا نگه داشته شده‌اند چون کاربر ممکن است بعد از
  // یک جستجوی موفق، متن Input را دوباره تغییر دهد بدون این‌که هنوز دکمه‌ی جستجو را بزند.
  const [cityQuery, setCityQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [searchedQueryLabel, setSearchedQueryLabel] = useState('');
  // مبدأ فعلیِ coords — فقط برای انتخاب متن درستِ پیام «بر اساس چه چیزی مرتب شده» به کار می‌رود
  // (sortedByDistanceNotice برای GPS، sortedBySearchNotice برای جستجوی دستی)؛ در فراخوانی خودِ
  // get_active_drivers (که فقط lat/lng خام می‌خواهد) هیچ نقشی ندارد.
  const [coordsSource, setCoordsSource] = useState<'gps' | 'search' | null>(null);

  const [drivers, setDrivers] = useState<ActiveDriverSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // برای این‌که با رسیدن رویداد Realtime، فهرست به‌جای «همان صفحه‌ی اول»، همان تعداد فعلیِ
  // بارگذاری‌شده (بعد از چند بار «نمایش موارد بیشتر») را دوباره بگیرد — دقیقاً هم‌الگو با
  // itemsLengthRef در ActiveDriversList.tsx وب.
  const driversLengthRef = useRef(0);
  driversLengthRef.current = drivers.length;

  // فاز M07، تسک ۱ — «نمایش فوری در باز شدن مجدد اپ»؛ جزئیات کامل استدلال در کامنت مشابه بالای
  // app/(tabs)/listings.tsx. چون فهرست راننده‌ها هیچ فیلتر دیگری جز coords ندارد (برخلاف
  // listings/services/real-estate)، شرط «حالت پیش‌فرض» هم اینجا ساده‌تر است: فقط coords===null.
  useEffect(() => {
    getCached<{ items: ActiveDriverSummary[]; totalCount: number }>(LIST_CACHE_KEY).then((cached) => {
      if (cached) {
        setDrivers(cached.items);
        setTotalCount(cached.totalCount);
      }
    });
  }, []);

  const fetchPage = useCallback(
    async (offset: number, append: boolean, limitOverride?: number) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setLoadError(false);

      try {
        const result = await getActiveDrivers({
          province,
          vehicleType: selectedVehicleType === 'all' ? null : selectedVehicleType,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          limit: limitOverride ?? PAGE_SIZE,
          offset,
        });
        setTotalCount(result.totalCount);
        setDrivers((prev) => (append ? [...prev, ...result.drivers] : result.drivers));

        if (offset === 0 && !province && selectedVehicleType === 'all' && !coords) {
          setCached(LIST_CACHE_KEY, { items: result.drivers, totalCount: result.totalCount });
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [province, selectedVehicleType, coords]
  );

  // هر بار ولایت، فیلترِ نوعِ وسیله، یا مختصات کاربر عوض شود (پس از زدن دکمه‌ی «نمایش
  // نزدیک‌ترین‌ها»)، از صفحه‌ی صفر دوباره شروع کن — دقیقاً هم‌الگو با app/(tabs)/listings.tsx.
  // این افکت همان بار اول (mount) هم اجرا می‌شود، پس نیازی به فراخوانی جداگانه‌ی fetchPage در
  // mount نیست.
  useEffect(() => {
    fetchPage(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province, selectedVehicleType, coords]);

  // فاز M07، تسک ۲ — «تلاش خودکار مجدد» پس از قطعی اینترنت؛ جزئیات کامل در کامنت مشابه بالای
  // app/(tabs)/listings.tsx.
  useAutoRetryOnReconnect(() => fetchPage(0, false));

  // اشتراک زنده‌ی Realtime — تسک ۱ همین فاز؛ نگاه کنید به یادداشت بالای فایل.
  useEffect(() => {
    const channel = supabase
      .channel('active-drivers-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
        fetchPage(0, false, Math.max(driversLengthRef.current, PAGE_SIZE));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تسک ۶ — از این پس درخواست صریحِ مجوز از طریق requestLocationAccess مشترک انجام می‌شود، نه
  // مستقیماً Location.requestForegroundPermissionsAsync؛ جزئیات کامل در کامنت بالای فایل.
  const useMyLocation = async () => {
    setLocating(true);
    setLocationStatus(null);
    setSearchNotFound(false); // کاربر از مسیر GPS استفاده کرد؛ هر پیام «یافت نشد»ِ جستجوی دستی قبلی دیگر بی‌ربط است.
    try {
      const access = await requestLocationAccess();
      if (access !== 'granted') {
        setLocationStatus(access);
        return;
      }
      // طبق همان باگ شناخته‌شده‌ی expo-location که در app/(tabs)/listings.tsx مستند شده
      // (getCurrentPositionAsync گاهی روی برخی گوشی‌های اندرویدی برای همیشه معلق می‌ماند).
      const position = await withTimeout(Location.getCurrentPositionAsync({}), LOCATION_TIMEOUT_MS);
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      setCoordsSource('gps');
    } catch {
      // مجوز داده شده بود ولی گرفتن مختصات خودش (یا همان تایم‌اوت ۸ ثانیه‌ای) شکست خورد — این
      // یک خطای موقتی شبکه/سخت‌افزار است، نه یک مسئله‌ی مجوز؛ همان پیام «دوباره امتحان کنید»یِ
      // قابل رفعِ فوری (deniedRetry) مناسب‌ترین گزینه است، نه پیام راهنمای تنظیمات.
      setLocationStatus('deniedRetry');
    } finally {
      setLocating(false);
    }
  };

  // تسک ۷ — جستجوی دستی شهر/منطقه به‌جای GPS. Location.geocodeAsync هیچ مجوز موقعیت مکانی لازم
  // ندارد (فقط اتصال اینترنت)؛ نتیجه‌اش دقیقاً همان شکل coords را پر می‌کند که دکمه‌ی GPS بالا پر
  // می‌کند — صفر تغییر در fetchPage/get_active_drivers. جزئیات کامل در کامنت بالای فایل.
  const searchByCityName = async () => {
    const trimmed = cityQuery.trim();
    if (trimmed.length === 0) return;

    setSearching(true);
    setSearchNotFound(false);
    setLocationStatus(null); // کاربر از مسیر جستجوی دستی استفاده کرد؛ هر پیام قبلی GPS دیگر بی‌ربط است.
    try {
      const results = await Location.geocodeAsync(trimmed);
      if (results.length === 0) {
        setSearchNotFound(true);
        return;
      }
      setCoords({ lat: results[0].latitude, lng: results[0].longitude });
      setCoordsSource('search');
      setSearchedQueryLabel(trimmed);
    } catch {
      // شبکه قطع بود یا سرویس Geocoder دستگاه در دسترس نبود — از دید کاربر تفاوتی با «نام
      // واردشده تشخیص داده نشد» ندارد؛ همان پیام searchNotFoundNotice کافی است.
      setSearchNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    if (meters >= 1000) {
      return dict.transport.list.distanceKm.replace('{distance}', (meters / 1000).toFixed(1));
    }
    return dict.transport.list.distanceM.replace('{distance}', String(Math.round(meters)));
  };

  const vehicleLabel = (id: VehicleTypeId) => dict.transport.vehicleTypes[id];

  const hasMore = drivers.length < totalCount;

  // 🆕 فاز M09 — تا وقتی وضعیتِ ماژول معلوم نشده، چیزی نشان نده (نه فهرست، نه اخطار) — از یک
  // ورودِ بصریِ ناگهانی (اول فهرست، بعد جایگزینیِ ناگهانی با اخطار) جلوگیری می‌کند؛ این تاخیر
  // در عمل نامحسوس است چون خودِ Route فقط یک select ساده از platform_settings است.
  if (moduleEnabled === undefined) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (!moduleEnabled) {
    return <TransportDisabledNotice dict={dict.transport.disabledNotice} />;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={drivers}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.pageTitle}>{dict.transport.list.title}</Text>
          <Text style={styles.pageSubtitle}>{dict.transport.list.subtitle}</Text>

          <Button
            title={dict.transport.list.becomeDriverButton}
            variant="secondary"
            onPress={() => router.push('/transport/driver')}
          />

          {/* 🆕 فیلترِ نوعِ وسیله — دقیقاً معادلِ ردیفِ فیلترِ وب
              (src/app/[lang]/transport/ActiveDriversList.tsx)، با آیکونِ هر نوع وسیله داخلِ یک
              دایره (نه فقط یک چیپِ متنی مثلِ فیلترِ خدمات) — چون خودِ VEHICLE_TYPES از قبل یک
              آیکونِ اختصاصی برای هر نوع دارد و همان ظاهرِ اپ‌های تاکسی‌یابی را می‌سازد. */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['all' as VehicleTypeFilter, ...VEHICLE_TYPES.map((v) => v.id)]}
            keyExtractor={(id) => id}
            contentContainerStyle={styles.vehicleChipsRow}
            renderItem={({ item }) => {
              const selected = item === selectedVehicleType;
              const VehicleIcon = item === 'all' ? Icons.Truck : vehicleIcon(item);
              const label =
                item === 'all' ? dict.transport.list.allVehicleTypesLabel : vehicleLabel(item);
              return (
                <Pressable
                  onPress={() => setSelectedVehicleType(item)}
                  style={styles.vehicleChip}>
                  <View
                    style={[styles.vehicleChipIcon, selected && styles.vehicleChipIconSelected]}>
                    <VehicleIcon size={20} color={selected ? Colors.primary : Colors.textMuted} />
                  </View>
                  <Text
                    style={[
                      styles.vehicleChipLabel,
                      selected && styles.vehicleChipLabelSelected,
                    ]}
                    numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              );
            }}
          />

          {/* تسک ۷ — جستجوی دستی شهر/منطقه به‌جای GPS؛ جزئیات کامل در کامنت بالای فایل. */}
          <Input
            placeholder={dict.transport.list.searchPlaceholder}
            value={cityQuery}
            onChangeText={setCityQuery}
            returnKeyType="search"
            onSubmitEditing={searchByCityName}
          />
          <Button
            title={searching ? dict.transport.list.searchingButton : dict.transport.list.searchButton}
            variant="secondary"
            onPress={searchByCityName}
            disabled={searching || cityQuery.trim().length === 0}
            style={[(searching || cityQuery.trim().length === 0) && styles.disabled]}
          />
          {searchNotFound && (
            <Text style={styles.notice}>{dict.transport.list.searchNotFoundNotice}</Text>
          )}

          <Button
            title={
              locating ? dict.transport.list.locatingButton : dict.transport.list.useMyLocationButton
            }
            variant="secondary"
            onPress={useMyLocation}
            disabled={locating}
            style={[locating && styles.disabled]}
          />

          {/* تسک ۶ — سه حالت جدا: رد قابل‌تکرار (پیام قبلی کافی است)، رد همیشگی، و GPS خاموش
              (این دو تای آخر هرکدام یک پیام راهنمای اختصاصی + دکمه‌ی «باز کردن تنظیمات» دارند). */}
          {locationStatus === 'deniedRetry' && (
            <Text style={styles.notice}>{dict.transport.list.locationDeniedNotice}</Text>
          )}
          {(locationStatus === 'deniedBlocked' || locationStatus === 'servicesDisabled') && (
            <View style={styles.blockedNoticeWrap}>
              <Text style={styles.notice}>
                {locationStatus === 'deniedBlocked'
                  ? dict.transport.list.locationBlockedNotice
                  : dict.transport.list.locationServicesDisabledNotice}
              </Text>
              <Button
                title={dict.common.openSettingsButton}
                variant="secondary"
                onPress={() => Linking.openSettings()}
              />
            </View>
          )}

          {!loading && drivers.length > 0 && (
            <Text style={styles.sortNotice}>
              {coords
                ? coordsSource === 'search'
                  ? dict.transport.list.sortedBySearchNotice.replace('{query}', searchedQueryLabel)
                  : dict.transport.list.sortedByDistanceNotice
                : dict.transport.list.sortedByNewestNotice}
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const VehicleIcon = vehicleIcon(item.vehicleType);
        // **رفع خطای واقعی:** آرایه‌ی عمومیِ قبلیِ images با دو ستونِ اختصاصی جایگزین شده
        // (رجوع کنید به یادداشتِ کاملِ بالای lib/transport/api.ts)؛ برای آواتار، عکسِ شخصیِ
        // خودِ راننده طبیعی‌ترین انتخاب است، با بازگشت به عکسِ وسیله اگر عکسِ شخصی نداشت.
        const avatarPhoto = item.personalPhotoUrl ?? item.vehiclePhotoUrl ?? null;
        const distanceText = formatDistance(item.distanceMeters);
        return (
          <Card style={styles.driverCard}>
            <View style={styles.driverRow}>
              <View style={styles.avatar}>
                {avatarPhoto ? (
                  <Image source={{ uri: avatarPhoto }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <VehicleIcon size={24} />
                )}
              </View>
              <View style={styles.driverInfo}>
                <View style={styles.driverVehicleRow}>
                  <Text style={styles.driverVehicle}>{vehicleLabel(item.vehicleType)}</Text>
                  {/* **افزوده‌شده (اکنون که ownerIsVip در دسترس است):** تیکِ VIP. */}
                  {item.ownerIsVip && <VipBadge label={dict.vip.badgeLabel} />}
                </View>
                {item.vehicleDetails && (
                  <Text style={styles.driverDetails} numberOfLines={1}>
                    {item.vehicleDetails}
                  </Text>
                )}
                {distanceText && <Text style={styles.driverDistance}>{distanceText}</Text>}
              </View>
            </View>
            {/* تسک ۲ فاز M03 — دکمه‌ی تماس یک‌لمسی، تمام‌عرض زیر مشخصات راننده؛ کاربر هرگز نیازی
                به کپی/تایپ شماره ندارد. */}
            <Button
              title={dict.transport.list.callButton}
              onPress={() => Linking.openURL(`tel:${item.contactPhone}`)}
            />
            {/* **افزوده‌شده (قابلیت چت — سیم‌کشی):** دکمه‌ی «چت با راننده». */}
            <ChatButton
              viewerId={user?.id ?? null}
              contextType="driver"
              contextId={item.id}
              ownerId={item.ownerId}
              dict={dict.chat.button}
            />
            {/* فاز M06، تسک ۱ — کامپوننت مشترک «گزارش تخلف» (آیکونی)، جایگزین دکمه‌ی موقتِ فاز
                M03. رانندگان برخلاف کالا صفحه‌ی جزئیات مستقل ندارند، پس این کامپوننت هم مستقیماً
                روی همین کارت فهرست قرار گرفت، نه در یک صفحه‌ی جدا. */}
            <ReportButton targetType="driver" targetId={item.id} />
          </Card>
        );
      }}
      ListEmptyComponent={
        loading ? (
          <View style={styles.centered}>
            <Spinner size="large" />
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{dict.transport.list.emptyTitle}</Text>
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{dict.transport.list.emptyTitle}</Text>
            <Text style={styles.emptyDesc}>{dict.transport.list.emptyDesc}</Text>
          </View>
        )
      }
      ListFooterComponent={
        !loading && hasMore ? (
          <Button
            title={loadingMore ? dict.transport.list.loadingButton : dict.transport.list.loadMoreButton}
            variant="secondary"
            onPress={() => fetchPage(drivers.length, true)}
            disabled={loadingMore}
            style={styles.loadMoreButton}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  // 🆕 فیلترِ نوعِ وسیله — رجوع کنید به یادداشتِ کنارِ استفاده‌شان در JSX بالا.
  vehicleChipsRow: {
    gap: 10,
    paddingVertical: Spacing.xs,
  },
  vehicleChip: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  vehicleChipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleChipIconSelected: {
    borderColor: Colors.primary,
  },
  vehicleChipLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  vehicleChipLabelSelected: {
    color: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  notice: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.danger,
    textAlign: 'center',
  },
  // تسک ۶ — پوشش پیام راهنما + دکمه‌ی «باز کردن تنظیمات» برای دو حالت رد همیشگی/GPS خاموش.
  blockedNoticeWrap: {
    gap: Spacing.xs,
  },
  sortNotice: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  driverCard: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  driverRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  driverInfo: {
    flex: 1,
    gap: 4,
  },
  driverVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverVehicle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  driverDetails: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  driverDistance: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.accentDark,
  },
  centered: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loadMoreButton: {
    marginTop: Spacing.sm,
  },
});