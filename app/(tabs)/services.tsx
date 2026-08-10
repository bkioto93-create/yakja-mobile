// مسیر فایل: app/(tabs)/services.tsx — معادل /services وب — فاز M04، تسک ۱
//
// طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل («مسیر اول: خواندن عمومی — مستقیماً از اپ با Anon Key»)،
// این صفحه مستقیماً تابع Postgres get_active_service_providers را (با Anon Key، از
// lib/services/api.ts) صدا می‌زند — بدون هیچ Route تازه در پل موبایل؛ دقیقاً هم‌الگو با
// app/(tabs)/transport.tsx (فاز M03، تسک ۱) و app/(tabs)/listings.tsx (فاز M02، تسک ۱).
//
// این تسک دقیقاً معادل تسک ۷ فاز ۰۴ وب است («فهرست/جستجوی عمومی متخصصین»). طبق متن دقیق خودِ تسک
// («فهرست/جستجوی متخصصین + چیپ‌های فیلتر تخصص»)، نسخه‌ی اولیه (تسک ۱) عمداً بدون فرم پروفایل
// متخصص (تسک ۳)، کادر جستجوی دستی شهر/منطقه (تسک ۴)، اعلان «پروفایل پنهان‌شده» (تسک ۵) و دکمه‌ی
// «گزارش تخلف» (تسک ۶) بود — هرکدام موضوع یک تسک جداگانه‌ی همین فاز خواهند بود. دکمه‌ی «من
// متخصصم» فقط به مسیر از‌پیش‌ساخته‌شده‌ی app/services/provider.tsx لینک می‌شود (که تا تسک ۳ همچنان
// PlaceholderScreen می‌ماند) — دقیقاً هم‌الگو با دکمه‌ی «من راننده‌ام» در transport.tsx (تسک ۱ فاز
// M03).
//
// **به‌روزرسانی تسک ۲ فاز M04:** دکمه‌ی تماس یک‌لمسی با پروتکل tel: زیر مشخصات هر متخصص اضافه
// شد — دقیقاً همان الگوی دکمه‌ی تماس در app/(tabs)/transport.tsx (تسک ۲ فاز M03) و
// app/listings/[id].tsx (فاز M02): یک Button ساده با onPress={() => Linking.openURL(`tel:...`)}،
// بدون هیچ کامپوننت یا کتابخانه‌ی تازه. هیچ تغییری در lib/services/api.ts یا دیکشنری لازم نبود —
// contactPhone از همان تسک ۱ در ActiveServiceProviderSummary موجود بود و کلید
// dict.services.list.callButton هم از قبل (فاز M00، هم‌زمان با بقیه‌ی کلیدهای callButton چهار
// ماژول) نوشته و ترجمه شده بود.
//
// چیپ‌های فیلتر تخصص: برخلاف چیپ‌های دسته‌بندی کالا در listings.tsx (که از یک آرایه‌ی کد ثابت،
// LISTING_CATEGORIES، ساخته می‌شوند)، اینجا از یک select مستقیم روی جدول پویای service_categories
// خوانده می‌شود (lib/services/categories.ts؛ دلیل کامل معماری در همان فایل مستند شده) — دقیقاً
// همان متن تسک: «چیپ‌های فیلتر تخصص (select مستقیم service_categories)». چون نام هر تخصص از
// دیتابیس می‌آید (نه دیکشنری)، بین name_fa/name_ps با همان زبان جاری اپ (LanguageContext) انتخاب
// می‌شود — دقیقاً هم‌الگو با هر جای دیگر این پروژه که یک مقدار دوزبانه‌ی دیتابیسی دارد.
//
// GPS «نمایش نزدیک‌ترین‌ها»: برخلاف transport.tsx (که تسک ۱ آن ساده شروع شد و مدیریت کامل مجوز
// اندروید در یک تسک جداگانه‌ی بعدی، تسک ۶ فاز M03، اضافه شد)، فاز M04 هیچ تسک جداگانه‌ای برای این
// موضوع در نقشه‌راه ندارد — پس همان کتابخانه‌ی مشترکِ از-قبل-ساخته‌شده lib/location.ts
// (requestLocationAccess، محصول همان تسک ۶ فاز M03) از همینجا، از همین تسک ۱، استفاده می‌شود؛ هر
// سه حالتِ رد (deniedRetry/deniedBlocked/servicesDisabled) از روز اول پوشش داده شده‌اند — نیازی به
// یک تسک/فایل جداگانه نبود چون خودِ کتابخانه از قبل عمومی/مستقل از ماژول transport نوشته شده بود.
//
// ⚠️ یادداشت جزئی (از تسک ۱): متن services.list.locationDeniedNotice (عیناً از دیکشنری بالغِ وب
// کپی شده بود) به «کادر جستجو» اشاره می‌کرد، در حالی که آن کادر تا همین تسک هنوز ساخته نشده بود؛
// با افزودن کادر جستجوی دستی در همین تسک (۴)، آن جمله اکنون کاملاً درست است — نیازی به تغییر متن
// نبود.
//
// بدون اشتراک Realtime: برخلاف transport.tsx، متن دقیق تسک ۱ همین فاز هیچ اشاره‌ای به Realtime
// ندارد (برخلاف تسک ۱ فاز M03 که صریحاً «اشتراک Realtime» را در همان یک خط تسک آورده بود) — پس
// عمداً اضافه نشد؛ اگر کارفرما بعداً آن را لازم بداند، افزودنش (دقیقاً هم‌الگو با transport.tsx)
// یک تغییر مستقل و کوچک به همین فایل خواهد بود.
//
// **به‌روزرسانی تسک ۴ فاز M04 (جستجوی دستی شهر/منطقه):** برخلاف app/(tabs)/transport.tsx (تسک ۷
// فاز M03، که به Location.geocodeAsync/Forward Geocoding نیاز داشت چون جدول drivers هیچ ستون
// آدرس متنی ندارد)، جدول service_providers از همان تسک ۳ همین فاز یک ستون address واقعی دارد و
// خودِ تابع Postgres get_active_service_providers از قبل یک پارامتر p_query می‌پذیرد که با ILIKE
// روی همان ستون جستجو می‌کند (lib/services/api.ts، تسک ۱ همین فاز، از همان ابتدا این پارامتر را
// در امضای تابع داشت). پس اینجا دقیقاً هم‌الگو با app/(tabs)/listings.tsx (فاز M02) عمل شد: یک
// Input ساده + جستجوی متنی با تاخیر ۴۰۰ میلی‌ثانیه‌ای (debounce، از یک درخواست شبکه به‌ازای هر
// حرف تایپ‌شده جلوگیری می‌کند) که مستقیماً به پارامتر query در getActiveServiceProviders می‌رود —
// نه یک دکمه‌ی جستجوی جدا و نه تبدیل به مختصات. هیچ کلید دیکشنری تازه‌ای لازم نبود:
// services.list.searchPlaceholder از قبل (فاز M00) دقیقاً برای همین منظور نوشته شده بود ولی تا
// این تسک هرگز واقعاً مصرف نشده بود؛ برخلاف transport.list، اینجا کلیدهای
// searchButton/searchingButton/searchNotFoundNotice/sortedBySearchNotice از ابتدا در دیکشنری
// نبودند — دقیقاً همان نشانه‌ای که تایید می‌کند این جستجو باید هم‌الگو با listings.tsx (بدون دکمه‌ی
// جدا) پیاده شود، نه هم‌الگو با transport.tsx.
//
// **به‌روزرسانی تسک ۶ فاز M04 (دکمه‌ی «گزارش تخلف»):** دقیقاً هم‌الگو با app/(tabs)/transport.tsx
// (تسک ۸ فاز M03): یک Button ثانویه زیر دکمه‌ی تماس هر متخصص اضافه شد که با
// router.push({ pathname: '/report/new', params: { targetType: 'service_provider', targetId: item.id } })
// به فرم گزارش (فعلاً همچنان PlaceholderScreen، فاز M06) می‌رود؛ 'service_provider' دقیقاً همان
// مقداری است که در lib/reports/reportTargets.ts (REPORT_TARGET_TYPES) تعریف شده. هیچ کلید
// دیکشنری تازه‌ای لازم نبود — dict.reports.reportButtonLabel از قبل (فاز M00) برای همین منظور
// نوشته شده بود و در M02/M03 هم عیناً همین متن استفاده شد. متخصصان، مثل رانندگان، صفحه‌ی جزئیات
// مستقل ندارند؛ پس دکمه هم مستقیماً روی همان کارت فهرست قرار گرفت.
import { ReportButton } from '@/components/ReportButton';
import { ChatButton } from '@/components/chat/ChatButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { VipBadge } from '@/components/vip/VipBadge';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useProvince } from '@/context/ProvinceContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getCached, setCached } from '@/lib/cache';
import { LocationAccessStatus, requestLocationAccess } from '@/lib/location';
import { useAutoRetryOnReconnect } from '@/lib/network';
import { ActiveServiceProviderSummary, getActiveServiceProviders } from '@/lib/services/api';
import { getActiveServiceCategories, ServiceCategory } from '@/lib/services/categories';
import { getBuiltinIconComponent } from '@/lib/services/categoryIcons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const PAGE_SIZE = 20;
const LOCATION_TIMEOUT_MS = 8000;
// تسک ۴ — دقیقاً همان مقدار debounce که app/(tabs)/listings.tsx استفاده می‌کند.
const DEBOUNCE_MS = 400;
// فاز M07، تسک ۱ — کلید کش محلی «آخرین فهرست» این ماژول (فقط حالت پیش‌فرض، بدون فیلتر/جستجو).
const LIST_CACHE_KEY = 'services:list';

type CategoryFilter = string | 'all';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function ServicesScreen() {
  const dict = useDictionary();
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  // فاز ۱۰ موبایل — قابلیت «ولایت».
  const { province } = useProvince();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [category, setCategory] = useState<CategoryFilter>('all');

  // تسک ۴ — جستجوی دستی شهر/منطقه، مستقیماً روی ستون service_providers.address (ILIKE سمت
  // سرور، از طریق پارامتر query در getActiveServiceProviders)؛ دقیقاً هم‌الگو با
  // app/(tabs)/listings.tsx. جزئیات کامل در کامنت بالای فایل.
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationAccessStatus | null>(null);

  const [providers, setProviders] = useState<ActiveServiceProviderSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // چیپ‌های تخصص فقط یک‌بار، هنگام mount، خوانده می‌شوند (select مستقیم، بدون Realtime/رفرش
  // خودکار) — دقیقاً مطابق متن تسک: فهرست تخصص‌های فعال به‌ندرت تغییر می‌کند و تغییرش (توسط ادمین
  // در پنل وب) نیازمند بازکردن دوباره‌ی این تب است، نه یک اشتراک زنده.
  useEffect(() => {
    getActiveServiceCategories().then(setCategories);
  }, []);

  // تسک ۴ — جستجوی متنی با تاخیر ۴۰۰ میلی‌ثانیه‌ای؛ دقیقاً همان الگوی app/(tabs)/listings.tsx.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // فاز M07، تسک ۱ — «نمایش فوری در باز شدن مجدد اپ»؛ جزئیات کامل استدلال در کامنت مشابه بالای
  // app/(tabs)/listings.tsx.
  useEffect(() => {
    getCached<{ items: ActiveServiceProviderSummary[]; totalCount: number }>(LIST_CACHE_KEY).then(
      (cached) => {
        if (cached) {
          setProviders(cached.items);
          setTotalCount(cached.totalCount);
        }
      }
    );
  }, []);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setLoadError(false);

      try {
        const result = await getActiveServiceProviders({
          category: category === 'all' ? null : category,
          province,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          query: debouncedQuery.length > 0 ? debouncedQuery : null,
          limit: PAGE_SIZE,
          offset,
        });
        setTotalCount(result.totalCount);
        setProviders((prev) => (append ? [...prev, ...result.providers] : result.providers));

        if (offset === 0 && category === 'all' && !province && !coords && debouncedQuery.length === 0) {
          setCached(LIST_CACHE_KEY, { items: result.providers, totalCount: result.totalCount });
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, province, coords, debouncedQuery]
  );

  // هر بار دسته/ولایت/مختصات/جستجو عوض شود، از صفحه‌ی صفر دوباره شروع کن — دقیقاً هم‌الگو با
  // app/(tabs)/listings.tsx و app/(tabs)/transport.tsx. این افکت همان بار اول (mount) هم اجرا
  // می‌شود، پس نیازی به فراخوانی جداگانه‌ی fetchPage در mount نیست.
  useEffect(() => {
    fetchPage(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, province, coords, debouncedQuery]);

  // فاز M07، تسک ۲ — «تلاش خودکار مجدد» پس از قطعی اینترنت؛ جزئیات کامل در کامنت مشابه بالای
  // app/(tabs)/listings.tsx.
  useAutoRetryOnReconnect(() => fetchPage(0, false));

  const useMyLocation = async () => {
    setLocating(true);
    setLocationStatus(null);
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
    } catch {
      setLocationStatus('deniedRetry');
    } finally {
      setLocating(false);
    }
  };

  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    if (meters >= 1000) {
      return dict.services.list.distanceKm.replace('{distance}', (meters / 1000).toFixed(1));
    }
    return dict.services.list.distanceM.replace('{distance}', String(Math.round(meters)));
  };

  const categoryLabel = (id: string) => {
    const found = categories.find((c) => c.id === id);
    if (!found) return '';
    return language === 'ps' ? found.namePs : found.nameFa;
  };

  const hasMore = providers.length < totalCount;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={providers}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.pageTitle}>{dict.services.list.title}</Text>
          <Text style={styles.pageSubtitle}>{dict.services.list.subtitle}</Text>

          <Button
            title={dict.services.list.becomeProviderButton}
            variant="secondary"
            onPress={() => router.push('/services/provider')}
          />

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['all' as CategoryFilter, ...categories.map((c) => c.id)]}
            keyExtractor={(id) => id}
            contentContainerStyle={styles.chipsRow}
            renderItem={({ item }) => {
              const selected = item === category;
              const label =
                item === 'all' ? dict.services.list.allCategoriesLabel : categoryLabel(item);
              return (
                <Pressable
                  onPress={() => setCategory(item)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                </Pressable>
              );
            }}
          />

          {/* تسک ۴ — جستجوی دستی شهر/منطقه؛ جزئیات کامل در کامنت بالای فایل. */}
          <Input
            placeholder={dict.services.list.searchPlaceholder}
            value={searchInput}
            onChangeText={setSearchInput}
          />

          <Button
            title={
              locating ? dict.services.list.locatingButton : dict.services.list.useMyLocationButton
            }
            variant="secondary"
            onPress={useMyLocation}
            disabled={locating}
            style={[locating && styles.disabled]}
          />

          {/* سه حالت جدا: رد قابل‌تکرار (پیام قبلی کافی است)، رد همیشگی، و GPS خاموش (این دو تای
              آخر هرکدام یک پیام راهنمای اختصاصی + دکمه‌ی «باز کردن تنظیمات» دارند) — دقیقاً هم‌الگو
              با تسک ۶ فاز M03. */}
          {locationStatus === 'deniedRetry' && (
            <Text style={styles.notice}>{dict.services.list.locationDeniedNotice}</Text>
          )}
          {(locationStatus === 'deniedBlocked' || locationStatus === 'servicesDisabled') && (
            <View style={styles.blockedNoticeWrap}>
              <Text style={styles.notice}>
                {locationStatus === 'deniedBlocked'
                  ? dict.services.list.locationBlockedNotice
                  : dict.services.list.locationServicesDisabledNotice}
              </Text>
              <Button
                title={dict.common.openSettingsButton}
                variant="secondary"
                onPress={() => Linking.openSettings()}
              />
            </View>
          )}

          {!loading && providers.length > 0 && (
            <Text style={styles.sortNotice}>
              {coords ? dict.services.list.sortedByDistanceNotice : dict.services.list.sortedByNewestNotice}
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const CategoryIcon = getBuiltinIconComponent(item.categoryIconKey);
        const avatarPhoto = item.images[0] ?? null;
        const distanceText = formatDistance(item.distanceMeters);
        const categoryName = language === 'ps' ? item.categoryNamePs : item.categoryNameFa;
        return (
          <Card style={styles.providerCard}>
            <View style={styles.providerRow}>
              <View style={styles.avatar}>
                {avatarPhoto ? (
                  <Image source={{ uri: avatarPhoto }} style={styles.avatarImage} contentFit="cover" />
                ) : item.categoryIconSource === 'custom' && item.categoryIconUrl ? (
                  <Image
                    source={{ uri: item.categoryIconUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <CategoryIcon size={24} />
                )}
              </View>
              <View style={styles.providerInfo}>
                <View style={styles.providerCategoryRow}>
                  <Text style={styles.providerCategory}>{categoryName}</Text>
                  {/* **افزوده‌شده (اکنون که ownerIsVip در دسترس است):** تیکِ VIP. */}
                  {item.ownerIsVip && <VipBadge label={dict.vip.badgeLabel} />}
                </View>
                <Text style={styles.providerAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                {item.description && (
                  <Text style={styles.providerDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                {distanceText && <Text style={styles.providerDistance}>{distanceText}</Text>}
              </View>
            </View>
            {/* تسک ۲ فاز M04 — دکمه‌ی تماس یک‌لمسی، تمام‌عرض زیر مشخصات متخصص؛ کاربر هرگز نیازی
                به کپی/تایپ شماره ندارد — دقیقاً هم‌الگو با تسک ۲ فاز M03 (transport.tsx) و دکمه‌ی
                تماس در app/listings/[id].tsx (فاز M02). هیچ تغییری در lib/services/api.ts لازم
                نبود چون contactPhone از همان تسک ۱ در ActiveServiceProviderSummary موجود بود؛ این
                تسک صرفاً یک دکمه‌ی رابط کاربری اضافه کرد. */}
            <Button
              title={dict.services.list.callButton}
              onPress={() => Linking.openURL(`tel:${item.contactPhone}`)}
            />
            {/* **افزوده‌شده (قابلیت چت — سیم‌کشی):** دکمه‌ی «چت با متخصص». */}
            <ChatButton
              viewerId={user?.id ?? null}
              contextType="service_provider"
              contextId={item.id}
              ownerId={item.ownerId}
              dict={dict.chat.button}
            />
            {/* فاز M06، تسک ۱ — کامپوننت مشترک «گزارش تخلف» (آیکونی)، جایگزین Button ثانویه‌ی
                موقتِ تسک ۶ فاز M04. */}
            <ReportButton targetType="service_provider" targetId={item.id} />
            {item.images.length > 0 && (
              <View style={styles.photosRow}>
                {item.images.slice(0, 3).map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                ))}
              </View>
            )}
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
            <Text style={styles.emptyTitle}>{dict.services.list.emptyTitle}</Text>
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{dict.services.list.emptyTitle}</Text>
            <Text style={styles.emptyDesc}>{dict.services.list.emptyDesc}</Text>
          </View>
        )
      }
      ListFooterComponent={
        !loading && hasMore ? (
          <Button
            title={loadingMore ? dict.services.list.loadingButton : dict.services.list.loadMoreButton}
            variant="secondary"
            onPress={() => fetchPage(providers.length, true)}
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
  chipsRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  chipTextSelected: {
    color: Colors.white,
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
  blockedNoticeWrap: {
    gap: Spacing.xs,
  },
  sortNotice: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  providerCard: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  providerRow: {
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
  providerInfo: {
    flex: 1,
    gap: 4,
  },
  providerCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  providerCategory: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  providerAddress: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  providerDescription: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  providerDistance: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.accentDark,
  },
  photosRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
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