// مسیر فایل: app/real-estate/index.tsx — معادل /real-estate وب — فاز M05، تسک ۱
//
// طبق بند ۲ و جدول بند ۳ سند راهبردی موبایل، این صفحه مستقیماً `search_real_estate` را (با Anon
// Key، از lib/realEstate/api.ts) صدا می‌زند — بدون هیچ Route تازه در پل موبایل. دقیقاً هم‌الگو با
// app/(tabs)/listings.tsx (فاز M02) و app/(tabs)/services.tsx (فاز M04)، با دو تفاوت آگاهانه:
//
//   ۱) دو ردیف چیپ به‌جای یک ردیف: چون real_estate برخلاف کالا/خدمات دو ستون فیلترِ مستقل دارد —
//      property_type و deal_type (docs/YAKJA_DATABASE_LOG.md، تسک ۲ فاز ۰۵) — دقیقاً هم‌الگو با
//      RealEstateSearch.tsx وب. ردیف نوع معامله («همه»/«فروش»/«اجاره») سه دکمه‌ی هم‌عرضِ
//      بدون‌اسکرول است (فقط ۳ گزینه، جا در یک سطر می‌شود)؛ ردیف نوع ملک («همه» + ۷ نوع، هرکدام با
//      آیکون) دقیقاً هم‌الگو با ردیف چیپ‌های دسته‌ی listings.tsx، افقی و قابل‌اسکرول.
//   ۲) گرید دو‌ستونه به‌جای فهرست تک‌ستونه: چون هر آگهی ملک ستون «عنوان» ندارد (برخلاف کالا)،
//      کارت هر آگهی صرفاً یک عکس مربعی + نوع ملک·نوع معامله + قیمت است — دقیقاً هم‌الگو با گرید
//      ۲/۳‌ستونه‌ی RealEstateSearch.tsx وب (`grid-cols-2 md:grid-cols-3`؛ روی موبایل ۲ ستون کافی
//      است). FlatList با numColumns={2} به‌کار رفت (نه ScrollView+map)، دقیقاً همان دلیل
//      Virtualization که در کامنت بالای listings.tsx هم آمده — تسک ۷ همین فاز صریحاً «تست روی
//      گوشی رده‌پایین» را می‌خواهد.
//
// جستجوی دستی شهر/منطقه (بخشی از همین تسک ۱): دقیقاً هم‌الگو با تسک ۴ فاز M04
// (app/(tabs)/services.tsx) — چون search_real_estate هم پارامتر p_query دارد که با ILIKE روی
// ستون real_estate.address جستجو می‌کند (real_estate هم مثل service_providers ستون title ندارد).
// یک Input ساده + جستجوی متنی با تاخیر ۴۰۰ میلی‌ثانیه‌ای؛ بدون دکمه‌ی جستجوی جدا — دقیقاً همان
// نشانه‌ای که کلیدهای دیکشنری (فقط searchPlaceholder، بدون searchButton/searchNotFoundNotice)
// از قبل تایید می‌کنند.
//
// «مرتب‌سازی GPS» و locationDenied: دقیقاً هم‌الگو با listings.tsx (نه transport.tsx/services.tsx
// که از lib/location.ts سه‌حالته استفاده می‌کنند) — چون dict.realEstate.index هم فقط یک کلید
// locationDeniedNotice دارد (نه locationBlockedNotice/locationServicesDisabledNotice جداگانه)،
// دقیقاً هم‌امضا با دیکشنری marketplace.index، نه services.list.
//
// بدون دکمه‌ی «آگهی‌های من»: برخلاف marketplace (که app/listings/my-listings.tsx دارد)، نه متن
// دقیق تسک‌های فاز M05 و نه دیکشنری (dict.realEstate.index بدون myListingsButton) چنین صفحه‌ای
// نمی‌خواهند — خارج از دامنه‌ی این فاز.
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useProvince } from '@/context/ProvinceContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getCached, setCached } from '@/lib/cache';
import { useAutoRetryOnReconnect } from '@/lib/network';
import { RealEstateSummary, searchRealEstate } from '@/lib/realEstate/api';
import { DEAL_TYPES, DealTypeId } from '@/lib/realEstate/dealTypes';
import { PROPERTY_TYPES, PropertyTypeId } from '@/lib/realEstate/propertyTypes';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_SIZE = 20;
const LOCATION_TIMEOUT_MS = 8000;
const DEBOUNCE_MS = 400;
// فاز M07، تسک ۱ — کلید کش محلی «آخرین فهرست» این ماژول (فقط حالت پیش‌فرض، بدون فیلتر/جستجو).
const LIST_CACHE_KEY = 'realEstate:list';

type PropertyTypeFilter = PropertyTypeId | 'all';
type DealTypeFilter = DealTypeId | 'all';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function RealEstateScreen() {
  const dict = useDictionary();
  const indexDict = dict.realEstate.index;
  const router = useRouter();
  // فاز ۱۰ موبایل — قابلیت «ولایت».
  const { province } = useProvince();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ آخرین آیتمِ فهرست زیرِ نوار ناوبریِ سیستمیِ اندروید.
  const insets = useSafeAreaInsets();

  const [propertyType, setPropertyType] = useState<PropertyTypeFilter>('all');
  const [dealType, setDealType] = useState<DealTypeFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const [items, setItems] = useState<RealEstateSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // فاز M07، تسک ۱ — «نمایش فوری در باز شدن مجدد اپ»؛ جزئیات کامل استدلال در کامنت مشابه بالای
  // app/(tabs)/listings.tsx.
  useEffect(() => {
    getCached<{ items: RealEstateSummary[]; totalCount: number }>(LIST_CACHE_KEY).then((cached) => {
      if (cached) {
        setItems(cached.items);
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
        const result = await searchRealEstate({
          propertyType: propertyType === 'all' ? null : propertyType,
          dealType: dealType === 'all' ? null : dealType,
          province,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          query: debouncedQuery.length > 0 ? debouncedQuery : null,
          limit: PAGE_SIZE,
          offset,
        });
        setTotalCount(result.totalCount);
        setItems((prev) => (append ? [...prev, ...result.items] : result.items));

        if (
          offset === 0 &&
          propertyType === 'all' &&
          dealType === 'all' &&
          !province &&
          !coords &&
          debouncedQuery.length === 0
        ) {
          setCached(LIST_CACHE_KEY, { items: result.items, totalCount: result.totalCount });
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [propertyType, dealType, province, coords, debouncedQuery]
  );

  useEffect(() => {
    fetchPage(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyType, dealType, province, coords, debouncedQuery]);

  // فاز M07، تسک ۲ — «تلاش خودکار مجدد» پس از قطعی اینترنت؛ جزئیات کامل در کامنت مشابه بالای
  // app/(tabs)/listings.tsx.
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
    if (meters >= 1000) return indexDict.distanceKm.replace('{distance}', (meters / 1000).toFixed(1));
    return indexDict.distanceM.replace('{distance}', String(Math.round(meters)));
  };

  const hasMore = items.length < totalCount;

  const propertyTypeLabel = (id: PropertyTypeId) => {
    const pt = PROPERTY_TYPES.find((p) => p.id === id);
    return pt ? (dict.realEstate.propertyTypes as Record<string, string>)[pt.dictKey] : id;
  };
  const dealTypeLabel = (id: DealTypeId) => (dict.realEstate.dealTypes as Record<string, string>)[id];

  return (
    <>
      <Stack.Screen options={{ title: indexDict.title }} />
      <FlatList
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button
              title={indexDict.postAdButton}
              onPress={() => router.push('/real-estate/new')}
            />

            {/* چیپ نوع معامله — فروش/اجاره/همه (فیلتر دومِ اختصاصی ماژول املاک) */}
            <View style={styles.dealTypeRow}>
              {(['all', ...DEAL_TYPES.map((d) => d.id)] as DealTypeFilter[]).map((id) => {
                const selected = id === dealType;
                const label = id === 'all' ? indexDict.allDealTypesLabel : dealTypeLabel(id);
                return (
                  <Pressable
                    key={id}
                    onPress={() => setDealType(id)}
                    style={[styles.dealTypeChip, selected && styles.chipSelected]}>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* چیپ نوع ملک — همه + ۷ نوع، هرکدام با آیکون */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={['all' as PropertyTypeFilter, ...PROPERTY_TYPES.map((p) => p.id)]}
              keyExtractor={(id) => id}
              contentContainerStyle={styles.chipsRow}
              renderItem={({ item: id }) => {
                const selected = id === propertyType;
                if (id === 'all') {
                  return (
                    <Pressable
                      onPress={() => setPropertyType('all')}
                      style={[styles.chip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {indexDict.allPropertyTypesLabel}
                      </Text>
                    </Pressable>
                  );
                }
                const meta = PROPERTY_TYPES.find((p) => p.id === id)!;
                const PropertyIcon = meta.icon;
                return (
                  <Pressable
                    onPress={() => setPropertyType(id)}
                    style={[styles.chip, styles.chipWithIcon, selected && styles.chipSelected]}>
                    <PropertyIcon size={16} color={selected ? Colors.white : Colors.primary} />
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {propertyTypeLabel(id)}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <Input
              placeholder={indexDict.searchPlaceholder}
              value={searchInput}
              onChangeText={setSearchInput}
            />

            <Button
              title={locating ? indexDict.locatingButton : indexDict.useMyLocationButton}
              variant="secondary"
              onPress={useMyLocation}
              disabled={locating}
              style={locating ? styles.disabled : undefined}
            />

            {locationDenied && <Text style={styles.notice}>{indexDict.locationDeniedNotice}</Text>}

            {!loading && items.length > 0 && (
              <Text style={styles.sortNotice}>
                {coords ? indexDict.sortedByDistanceNotice : indexDict.sortedByNewestNotice}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const distanceText = formatDistance(item.distanceMeters);
          return (
            <Pressable
              style={styles.gridItem}
              onPress={() => router.push(`/real-estate/${item.id}`)}>
              <Card style={styles.propertyCard}>
                {item.images[0] ? (
                  <Image source={{ uri: item.images[0] }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTypeText} numberOfLines={1}>
                    {propertyTypeLabel(item.propertyType)} · {dealTypeLabel(item.dealType)}
                  </Text>
                  <Text style={styles.propertyPrice}>
                    {item.price.toLocaleString()} {dict.realEstate.detail.currencyLabel}
                  </Text>
                  {distanceText && (
                    <Text style={styles.propertyDistance} numberOfLines={1}>
                      {distanceText}
                    </Text>
                  )}
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
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>{indexDict.emptyTitle}</Text>
              <Text style={styles.emptyDesc}>{indexDict.emptyDesc}</Text>
            </View>
          )
        }
        ListFooterComponent={
          !loading && hasMore ? (
            <Button
              title={loadingMore ? indexDict.loadingButton : indexDict.loadMoreButton}
              variant="secondary"
              onPress={() => fetchPage(items.length, true)}
              disabled={loadingMore}
              style={styles.loadMoreButton}
            />
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dealTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dealTypeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
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
  chipWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  columnWrapper: {
    gap: Spacing.sm,
  },
  gridItem: {
    flex: 1,
    maxWidth: '50%',
  },
  propertyCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  thumb: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    padding: Spacing.sm,
    gap: 4,
  },
  propertyTypeText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  propertyPrice: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
  },
  propertyDistance: {
    fontSize: 11,
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