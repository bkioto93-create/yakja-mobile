// مسیر فایل: app/listings/[id].tsx — معادل /listings/[id] وب — فاز M02، تسک ۲ (نسخه‌ی واقعی)
//
// طبق جدول بند ۳ سند راهبردی، این صفحه هم مستقیماً Supabase را (get_listing_detail +
// get_similar_listings، از lib/marketplace/api.ts) صدا می‌زند — بدون Route تازه.
//
// «کارت فروشنده با لینک به پروفایل عمومی (فاز M06)»: همین‌جا لینک به app/users/[id].tsx ساخته
// شد — آن صفحه فعلاً PlaceholderScreen است (فاز M06 هنوز نساخته)، دقیقاً طبق متن تسک؛ سیم‌کشی
// این لینک همین الان کامل است و وقتی M06 آن صفحه را می‌سازد، بدون هیچ تغییری در همین فایل کار
// خواهد کرد.
import { ReportButton } from '@/components/ReportButton';
import { ChatButton } from '@/components/chat/ChatButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getListingDetail, getSimilarListings, ListingDetail, ListingSummary } from '@/lib/marketplace/api';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const dict = useDictionary();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  // 🛠️ اصلاح UX (نوار ناوبری اندروید روی محتوای صفحه می‌افتد): چون app.json حالت
  // edgeToEdgeEnabled دارد، محتوای این ScrollView بدون این padding تا زیرِ نوار سیستمی
  // (دکمه‌های خانه/بازگشت) ادامه پیدا می‌کرد و آخرین آیتم (دکمه‌ی «مشاهده پروفایل فروشنده» یا
  // «بازگشت به فهرست») زیرِ آن نوار پنهان می‌شد. insets.bottom دقیقاً ارتفاع همان نوار سیستمی
  // است؛ Spacing.lg هم یک فاصله‌ی بصریِ اضافه تا محتوا کاملاً از نوار سیستم جدا به‌نظر برسد.
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<ListingDetail | null | undefined>(undefined); // undefined = در حال بارگذاری
  const [similar, setSimilar] = useState<ListingSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    (async () => {
      try {
        const detail = await getListingDetail(id);
        if (cancelled) return;
        setListing(detail);

        if (detail) {
          const similarItems = await getSimilarListings({
            category: detail.category,
            excludeId: detail.id,
            lat: detail.latitude,
            lng: detail.longitude,
          });
          if (!cancelled) setSimilar(similarItems);
        }
      } catch {
        if (!cancelled) setListing(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (listing === undefined) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (listing === null) {
    return (
      <>
        <Stack.Screen options={{ title: dict.marketplace.index.title }} />
        <View style={styles.centered}>
          <Text style={styles.notFoundTitle}>{dict.marketplace.detail.notFoundTitle}</Text>
          <Text style={styles.notFoundDesc}>{dict.marketplace.detail.notFoundDesc}</Text>
          <Button
            title={dict.marketplace.detail.backToListingsButton}
            onPress={() => router.replace('/(tabs)/listings')}
            style={styles.notFoundButton}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: listing.title }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {listing.images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {listing.images.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.mainImage} contentFit="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.mainImage, styles.imagePlaceholder]} />
        )}

        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>
          {listing.price.toLocaleString()} {dict.marketplace.detail.currencyLabel}
        </Text>

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>{dict.marketplace.detail.addressLabel}</Text>
          <Text style={styles.sectionValue}>{listing.address}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>{dict.marketplace.detail.descriptionTitle}</Text>
          <Text style={styles.sectionValue}>
            {listing.description && listing.description.trim().length > 0
              ? listing.description
              : dict.marketplace.detail.noDescription}
          </Text>
        </Card>

        <Button
          title={dict.marketplace.detail.callButton}
          onPress={() => Linking.openURL(`tel:${listing.contactPhone}`)}
        />

        {/* **افزوده‌شده (قابلیت چت — سیم‌کشی):** دکمه‌ی «چت با فروشنده». */}
        <ChatButton
          viewerId={user?.id ?? null}
          contextType="listing"
          contextId={listing.id}
          ownerId={listing.ownerId}
          dict={dict.chat.button}
        />

        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>{dict.marketplace.detail.sellerSectionTitle}</Text>
          <Button
            title={dict.marketplace.detail.viewSellerProfileButton}
            variant="secondary"
            onPress={() => router.push(`/users/${listing.ownerId}`)}
          />
        </Card>

        {/* فاز M06، تسک ۱ — کامپوننت مشترک «گزارش تخلف» (آیکونی)، جایگزین دکمه‌ی موقتِ فاز M02. */}
        <ReportButton targetType="listing" targetId={listing.id} />

        <Text style={styles.similarTitle}>{dict.marketplace.detail.similarTitle}</Text>
        {similar.length === 0 ? (
          <Text style={styles.similarEmpty}>{dict.marketplace.detail.similarEmpty}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarRow}>
            {similar.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(`/listings/${item.id}`)}>
                <Card style={styles.similarCard}>
                  {item.images[0] ? (
                    <Image source={{ uri: item.images[0] }} style={styles.similarImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.similarImage, styles.imagePlaceholder]} />
                  )}
                  <Text style={styles.similarItemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.similarItemPrice}>
                    {item.price.toLocaleString()} {dict.marketplace.detail.currencyLabel}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Button
          title={dict.marketplace.detail.backButton}
          variant="secondary"
          onPress={() => router.replace('/(tabs)/listings')}
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
    // 🛠️ سخت‌سازیِ اضافه (بازخوردِ کارفرما — «عکسِ محصول از کارت بیرون می‌زنه»): این ابعاد از
    // قبل صریح تعریف شده بودن، ولی overflow:hidden صریح نبود — رجوع کنید به رفعِ باگِ اصلی و
    // ریشه‌ای در components/ui/Card.tsx برای جزئیاتِ کامل.
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
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
  similarItemTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  similarItemPrice: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
  },
});