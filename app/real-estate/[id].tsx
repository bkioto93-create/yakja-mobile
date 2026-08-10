// مسیر فایل: app/real-estate/[id].tsx — معادل /real-estate/[id] وب — فاز M05، تسک ۲ + ۵ + ۶
//
// طبق جدول بند ۳ سند راهبردی، این صفحه هم مستقیماً Supabase را (get_real_estate_detail +
// get_similar_real_estate، از lib/realEstate/api.ts) صدا می‌زند — بدون Route تازه. دقیقاً هم‌الگو
// با app/listings/[id].tsx (فاز M02، تسک ۲) و app/services/... (فاز M04)، با یک تفاوت: چون
// real_estate ستون title ندارد، عنوان صفحه و «آگهی‌های مشابه» به‌جای عنوان از روی «نوع ملک ·
// نوع معامله» ساخته می‌شوند (دقیقاً هم‌الگو با src/app/[lang]/real-estate/[id]/page.tsx وب).
//
// «فیلتر مضاعف نوع ملک و معامله» (تسک ۲): getSimilarRealEstate هر دو propertyType و dealType
// آگهی جاری را می‌فرستد — تابع Postgres get_similar_real_estate خودش هر دو را در where فیلتر
// می‌کند (docs/YAKJA_DATABASE_LOG.md)، نه فقط یکی — دقیقاً طبق متن دقیق تسک.
//
// «کارت آگهی‌دهنده با لینک به پروفایل عمومی کاربر» (تسک ۵): لینکی به app/users/[id].tsx ساخته
// شد — آن صفحه فعلاً PlaceholderScreen است (فاز M06 هنوز نساخته)، دقیقاً طبق همان الگوی «کارت
// فروشنده» در app/listings/[id].tsx؛ سیم‌کشی این لینک همین الان کامل است و وقتی M06 آن صفحه را
// می‌سازد، بدون هیچ تغییری در همین فایل کار خواهد کرد.
//
// «دکمه‌ی گزارش تخلف» (تسک ۶): targetType='real_estate' — دقیقاً همان مقداری که در
// lib/reports/reportTargets.ts (REPORT_TARGET_TYPES) از فاز M06 (تسک ۱) تعریف شده.
import { ReportButton } from '@/components/ReportButton';
import { ChatButton } from '@/components/chat/ChatButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getRealEstateDetail, getSimilarRealEstate, RealEstateDetail, RealEstateSummary } from '@/lib/realEstate/api';
import { PROPERTY_TYPES } from '@/lib/realEstate/propertyTypes';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RealEstateDetailScreen() {
  const dict = useDictionary();
  const detailDict = dict.realEstate.detail;
  const propertyTypesDict = dict.realEstate.propertyTypes as Record<string, string>;
  const dealTypesDict = dict.realEstate.dealTypes as Record<string, string>;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  // 🛠️ اصلاح UX (دقیقاً هم‌الگو با app/listings/[id].tsx): جلوگیری از پنهان‌شدنِ آخرین آیتمِ
  // صفحه زیرِ نوار ناوبریِ سیستمیِ اندروید (حالت edgeToEdgeEnabled در app.json).
  const insets = useSafeAreaInsets();

  const [property, setProperty] = useState<RealEstateDetail | null | undefined>(undefined); // undefined = در حال بارگذاری
  const [similar, setSimilar] = useState<RealEstateSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    (async () => {
      try {
        const detail = await getRealEstateDetail(id);
        if (cancelled) return;
        setProperty(detail);

        if (detail) {
          const similarItems = await getSimilarRealEstate({
            propertyType: detail.propertyType,
            dealType: detail.dealType,
            excludeId: detail.id,
            lat: detail.latitude,
            lng: detail.longitude,
          });
          if (!cancelled) setSimilar(similarItems);
        }
      } catch {
        if (!cancelled) setProperty(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const propertyTypeLabel = (propertyType: string) => {
    const meta = PROPERTY_TYPES.find((p) => p.id === propertyType);
    return meta ? propertyTypesDict[meta.dictKey] : propertyType;
  };
  const dealTypeLabel = (dealType: string) => dealTypesDict[dealType] ?? dealType;

  if (property === undefined) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (property === null) {
    return (
      <>
        <Stack.Screen options={{ title: detailDict.notFoundTitle }} />
        <View style={styles.centered}>
          <Text style={styles.notFoundTitle}>{detailDict.notFoundTitle}</Text>
          <Text style={styles.notFoundDesc}>{detailDict.notFoundDesc}</Text>
          <Button
            title={detailDict.backToListingsButton}
            onPress={() => router.replace('/real-estate')}
            style={styles.notFoundButton}
          />
        </View>
      </>
    );
  }

  const heading = `${propertyTypeLabel(property.propertyType)} · ${dealTypeLabel(property.dealType)}`;
  const PropertyIcon = PROPERTY_TYPES.find((p) => p.id === property.propertyType)?.icon;

  return (
    <>
      <Stack.Screen options={{ title: heading }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {property.images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {property.images.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.mainImage} contentFit="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.mainImage, styles.imagePlaceholder]} />
        )}

        <View style={styles.headingRow}>
          {PropertyIcon && <PropertyIcon size={18} color={Colors.primary} />}
          <Text style={styles.heading}>{heading}</Text>
        </View>
        <Text style={styles.price}>
          {property.price.toLocaleString()} {detailDict.currencyLabel}
        </Text>

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>{detailDict.addressLabel}</Text>
          <Text style={styles.sectionValue}>{property.address}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>{detailDict.descriptionTitle}</Text>
          <Text style={styles.sectionValue}>
            {property.description && property.description.trim().length > 0
              ? property.description
              : detailDict.noDescription}
          </Text>
        </Card>

        {/* تسک ۵ — کارت «آگهی‌دهنده» با لینک به پروفایل عمومی کاربر. */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>{detailDict.ownerSectionTitle}</Text>
          <Button
            title={detailDict.viewOwnerProfileButton}
            variant="secondary"
            onPress={() => router.push(`/users/${property.ownerId}`)}
          />
        </Card>

        <Button
          title={detailDict.callButton}
          onPress={() => Linking.openURL(`tel:${property.contactPhone}`)}
        />

        {/* **افزوده‌شده (قابلیت چت — سیم‌کشی):** دکمه‌ی «چت با آگهی‌دهنده». */}
        <ChatButton
          viewerId={user?.id ?? null}
          contextType="real_estate"
          contextId={property.id}
          ownerId={property.ownerId}
          dict={dict.chat.button}
        />

        {/* فاز M06، تسک ۱ — کامپوننت مشترک «گزارش تخلف» (آیکونی)، جایگزین Button ثانویه‌ی موقتِ
            تسک ۶ فاز M05. */}
        <ReportButton targetType="real_estate" targetId={property.id} />

        <Text style={styles.similarTitle}>{detailDict.similarTitle}</Text>
        {similar.length === 0 ? (
          <Text style={styles.similarEmpty}>{detailDict.similarEmpty}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
            {similar.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/real-estate/${item.id}`)}>
                <Card style={styles.similarCard}>
                  {item.images[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.similarImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.similarImage, styles.imagePlaceholder]} />
                  )}
                  <Text style={styles.similarItemPrice}>
                    {item.price.toLocaleString()} {detailDict.currencyLabel}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Button
          title={detailDict.backButton}
          variant="secondary"
          onPress={() => router.replace('/real-estate')}
        />
      </ScrollView>
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
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  notFoundTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  notFoundDesc: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  notFoundButton: {
    marginTop: Spacing.md,
  },
  mainImage: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    height: 240,
    borderRadius: Radii.lg,
    backgroundColor: Colors.border,
    // 🛠️ سخت‌سازیِ اضافه — رجوع کنید به یادداشتِ کاملِ کنارِ همین تغییر در
    // app/listings/[id].tsx و رفعِ باگِ اصلی در components/ui/Card.tsx.
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heading: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  price: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  sectionValue: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textMain,
    lineHeight: 22,
  },
  similarTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginTop: Spacing.sm,
  },
  similarEmpty: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  similarRow: {
    gap: Spacing.sm,
  },
  similarCard: {
    width: 140,
    gap: 4,
  },
  similarImage: {
    width: '100%',
    height: 90,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  similarItemPrice: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
  },
});