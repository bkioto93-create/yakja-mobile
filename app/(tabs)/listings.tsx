// مسیر فایل: app/(tabs)/listings.tsx — معادل /listings وب — فاز M02، تسک ۱ (نسخه‌ی واقعی)
//
// طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل، این صفحه مستقیماً `search_listings` را (با Anon Key،
// از lib/marketplace/api.ts) صدا می‌زند — بدون هیچ Route تازه در پل موبایل.
//
// از FlatList استفاده شده (نه ScrollView+map) چون تعداد آگهی‌ها می‌تواند زیاد شود و
// تسک ۹ همین فاز صراحتاً «تست کامل روی گوشی رده‌پایین» را می‌خواهد — FlatList فقط ردیف‌های
// در دید را رندر می‌کند (virtualization)، برخلاف ScrollView که همه را یک‌جا می‌سازد.
//
// «مرتب‌سازی GPS»: طبق باگ شناخته‌شده‌ی expo-location روی برخی گوشی‌های اندرویدی (که
// getCurrentPositionAsync گاهی برای همیشه معلق می‌ماند)، یک timeout ۸ ثانیه‌ای اضافه شد — اگر
// موقعیت مکانی به‌موقع نرسد، دقیقاً مثل رد کردن دسترسی رفتار می‌شود (locationDeniedNotice) به‌جای
// قفل‌شدن صفحه.
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useProvince } from '@/context/ProvinceContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getCached, setCached } from '@/lib/cache';
import { ListingSummary, searchListings } from '@/lib/marketplace/api';
import { LISTING_CATEGORIES, ListingCategoryId } from '@/lib/marketplace/categories';
import { useAutoRetryOnReconnect } from '@/lib/network';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PAGE_SIZE = 20;
const LOCATION_TIMEOUT_MS = 8000;
const DEBOUNCE_MS = 400;
// فاز M07، تسک ۱ — کلید کش محلی «آخرین فهرست» این ماژول (فقط حالت پیش‌فرض، بدون فیلتر/جستجو؛
// جزئیات کامل در کامنت پایین‌تر، کنار افکت بارگذاری کش).
const LIST_CACHE_KEY = 'listings:list';

type CategoryFilter = ListingCategoryId | 'all';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function ListingsScreen() {
  const dict = useDictionary();
  const router = useRouter();
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فهرست کالا هم، دقیقاً مثل صفحه‌ی اصلی، بر اساس ولایتِ
  // انتخابیِ سراسری کاربر فیلتر می‌شود؛ province=null یعنی «همه‌ی افغانستان».
  const { province } = useProvince();

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // جستجوی متنی با تاخیر ۴۰۰ میلی‌ثانیه‌ای — از یک درخواست شبکه به‌ازای هر حرف تایپ‌شده جلوگیری می‌کند.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // فاز M07، تسک ۱ — «کش محلی نتایج آخرین فهرست» (متن دقیق تسک): فقط یک‌بار، در mount، پیش از
  // این‌که درخواست شبکه‌ی واقعی (افکت پایین‌تر) کامل شود، اگر نتیجه‌ی ذخیره‌شده‌ای از بازدید قبلی
  // وجود داشت بلافاصله نمایش داده می‌شود — «نمایش فوری در باز شدن مجدد اپ». چون در همین لحظه‌ی
  // mount مقدار category/searchInput/coords همیشه هنوز روی پیش‌فرض‌شان هستند (بالا مقداردهی
  // اولیه شدند)، این کش همیشه دقیقاً با همان حالت پیش‌فرضی که این افکت آن را نشان می‌دهد هم‌خوان
  // است — بدون نیاز به هیچ بررسی شرطی اضافه. FlatList چون listings را مستقیم از state می‌خواند،
  // به‌محض ست‌شدن این مقدار، ListEmptyComponent (اسپینر) خودکار جایش را به فهرست واقعی می‌دهد؛
  // چند لحظه بعد، افکت fetchPage زیر همین نتیجه را با نسخه‌ی تازه‌ی شبکه بی‌صدا جایگزین می‌کند.
  useEffect(() => {
    getCached<{ items: ListingSummary[]; totalCount: number }>(LIST_CACHE_KEY).then((cached) => {
      if (cached) {
        setListings(cached.items);
        setTotalCount(cached.totalCount);
      }
    });
  }, []);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setLoadError(false);

      try {
        const result = await searchListings({
          category: category === 'all' ? null : category,
          province,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          query: debouncedQuery.length > 0 ? debouncedQuery : null,
          limit: PAGE_SIZE,
          offset,
        });
        setTotalCount(result.totalCount);
        setListings((prev) => (append ? [...prev, ...result.listings] : result.listings));

        // فقط حالت پیش‌فرض (بدون فیلتر/جستجو/GPS) و فقط صفحه‌ی اول کش می‌شود — دقیقاً همان
        // حالتی که افکت بالا روی mount بعدی می‌خواند؛ کش‌کردن نتایج فیلترشده باعث می‌شد دفعه‌ی
        // بعد که کاربر با حالت پیش‌فرض صفحه را باز می‌کند، یک لحظه نتایج فیلترشده‌ی قبلی را ببیند.
        if (offset === 0 && category === 'all' && !province && !coords && debouncedQuery.length === 0) {
          setCached(LIST_CACHE_KEY, { items: result.listings, totalCount: result.totalCount });
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

  // هر بار دسته/ولایت/جستجو/مختصات عوض شود، از صفحه‌ی صفر دوباره شروع کن.
  useEffect(() => {
    fetchPage(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, province, coords, debouncedQuery]);

  // فاز M07، تسک ۲ — «تلاش خودکار مجدد»: وقتی اتصال از قطع به وصل برگردد، همان صفحه‌ی جاری
  // (با فیلترهای فعلی) دوباره خوانده می‌شود؛ بدون نیاز به لمس دستیِ کاربر.
  useAutoRetryOnReconnect(() => fetchPage(0, false));

  const useMyLocation = async () => {
    setLocating(true);
    setLocationDenied(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      const position = await withTimeout(Location.getCurrentPositionAsync({}), LOCATION_TIMEOUT_MS);
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      setLocationDenied(true);
    } finally {
      setLocating(false);
    }
  };

  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    if (meters >= 1000) {
      return dict.marketplace.index.distanceKm.replace('{distance}', (meters / 1000).toFixed(1));
    }
    return dict.marketplace.index.distanceM.replace('{distance}', String(Math.round(meters)));
  };

  const hasMore = listings.length < totalCount;

  const categoryLabel = (id: ListingCategoryId) => {
    const found = LISTING_CATEGORIES.find((c) => c.id === id);
    return found ? (dict.marketplace.categories as Record<string, string>)[found.dictKey] : id;
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={listings}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{dict.marketplace.index.title}</Text>
          </View>

          <View style={styles.actionsRow}>
            <Button
              title={dict.marketplace.index.postAdButton}
              onPress={() => router.push('/listings/new')}
              style={styles.actionButton}
            />
            <Button
              title={dict.marketplace.index.myListingsButton}
              variant="secondary"
              onPress={() => router.push('/listings/my-listings')}
              style={styles.actionButton}
            />
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['all' as CategoryFilter, ...LISTING_CATEGORIES.map((c) => c.id)]}
            keyExtractor={(id) => id}
            contentContainerStyle={styles.chipsRow}
            renderItem={({ item }) => {
              const selected = item === category;
              const label =
                item === 'all' ? dict.marketplace.index.allCategoriesLabel : categoryLabel(item);
              return (
                <Pressable
                  onPress={() => setCategory(item)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                </Pressable>
              );
            }}
          />

          <Input
            placeholder={dict.marketplace.index.searchPlaceholder}
            value={searchInput}
            onChangeText={setSearchInput}
          />

          <Button
            title={locating ? dict.marketplace.index.locatingButton : dict.marketplace.index.useMyLocationButton}
            variant="secondary"
            onPress={useMyLocation}
            disabled={locating}
            style={[locating && styles.disabled]}
          />

          {locationDenied && (
            <Text style={styles.notice}>{dict.marketplace.index.locationDeniedNotice}</Text>
          )}

          {!loading && listings.length > 0 && (
            <Text style={styles.sortNotice}>
              {coords ? dict.marketplace.index.sortedByDistanceNotice : dict.marketplace.index.sortedByNewestNotice}
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const distanceText = formatDistance(item.distanceMeters);
        return (
          <Pressable onPress={() => router.push(`/listings/${item.id}`)}>
            <Card style={styles.listingCard}>
              {item.images[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.listingPrice}>
                  {item.price.toLocaleString()} {dict.marketplace.detail.currencyLabel}
                </Text>
                <Text style={styles.listingAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                {distanceText && <Text style={styles.listingDistance}>{distanceText}</Text>}
              </View>
            </Card>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        loading ? (
          <View style={styles.centered}>
            <Spinner size="large" />
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{dict.marketplace.index.emptyTitle}</Text>
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{dict.marketplace.index.emptyTitle}</Text>
            <Text style={styles.emptyDesc}>{dict.marketplace.index.emptyDesc}</Text>
          </View>
        )
      }
      ListFooterComponent={
        !loading && hasMore ? (
          <Button
            title={loadingMore ? dict.marketplace.index.loadingButton : dict.marketplace.index.loadMoreButton}
            variant="secondary"
            onPress={() => fetchPage(listings.length, true)}
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
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  titleRow: {
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
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
  sortNotice: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  listingCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
    gap: 4,
  },
  listingTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  listingPrice: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
  },
  listingAddress: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  listingDistance: {
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