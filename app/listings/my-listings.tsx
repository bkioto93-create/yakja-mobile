// مسیر فایل: app/listings/my-listings.tsx — فاز M02، تسک ۷ (نسخه‌ی واقعی)
//
// این صفحه در جدول نگاشت صفحات سند راهبردی (بند ۳) نیامده — چون معادل مستقیم یک صفحه‌ی وب
// مجزا نیست، اما خودِ نقشه‌راه (فاز M02) صراحتاً آن را به‌عنوان تسک ۷ خواسته: «از طریق پل موبایل
// — شامل وضعیت‌های غیر-approved». طبق RLS جدول listings (auth.uid() = owner_id، که با نشست
// سفارشی OTP این پروژه یکی نیست)، تنها راه امن دیدن آگهی‌های pending/deleted خودِ کاربر، یک
// Route با Service Role در سرور است — دقیقاً همان که در web-repo-routes/marketplace/my-listings
// ساخته شد (lib/marketplace/mutations.ts → getMyListings).
//
// گیت ورود دقیقاً هم‌الگو با app/listings/new.tsx: خودِ صفحه برای مهمان هم باز می‌ماند (طبق تسک
// ۱۱ فاز M01)، فقط به‌جای فهرست واقعی، LoginRequiredCard نشان داده می‌شود — بدون حتی یک تماس
// شبکه‌ی اضافه (چون useAuth().user از قبل در دسترس است، نیازی به فراخوانی خودِ Route نیست).
import { LoginRequiredCard } from '@/components/LoginRequiredCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getMyListings, MyListing } from '@/lib/marketplace/mutations';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyListingsScreen() {
  const dict = useDictionary();
  const router = useRouter();
  const { user, isReady } = useAuth();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ آخرین آیتمِ فهرست زیرِ نوار ناوبریِ سیستمیِ اندروید.
  const insets = useSafeAreaInsets();

  const [listings, setListings] = useState<MyListing[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyListings()
      .then((result) => {
        if (!cancelled) setListings(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: dict.marketplace.myListings.title }} />
        <LoginRequiredCard
          title={dict.marketplace.myListings.loginRequiredTitle}
          description={dict.marketplace.myListings.loginRequiredDesc}
          buttonLabel={dict.marketplace.myListings.loginRequiredButton}
        />
      </>
    );
  }

  const statusLabel = (status: MyListing['status']) => {
    if (status === 'approved') return dict.marketplace.myListings.statusApproved;
    if (status === 'deleted') return dict.marketplace.myListings.statusDeleted;
    return dict.marketplace.myListings.statusPending;
  };

  const statusColor = (status: MyListing['status']) => {
    if (status === 'approved') return Colors.success;
    if (status === 'deleted') return Colors.danger;
    return Colors.accent;
  };

  return (
    <>
      <Stack.Screen options={{ title: dict.marketplace.myListings.title }} />
      <FlatList
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}
        data={listings ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Button
            title={dict.marketplace.myListings.postAdButton}
            onPress={() => router.push('/listings/new')}
            style={styles.postButton}
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/listings/${item.id}`)}>
            <Card style={styles.card}>
              {item.images[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.price}>
                  {item.price.toLocaleString()} {dict.marketplace.detail.currencyLabel}
                </Text>
                <Text style={[styles.status, { color: statusColor(item.status) }]}>
                  {statusLabel(item.status)}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          listings === null && !error ? (
            <View style={styles.centered}>
              <Spinner size="large" />
            </View>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>
                {error ? dict.marketplace.myListings.dbError : dict.marketplace.myListings.emptyTitle}
              </Text>
              {!error && <Text style={styles.emptyDesc}>{dict.marketplace.myListings.emptyDesc}</Text>}
            </View>
          )
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
    gap: Spacing.md,
  },
  postButton: {
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  price: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
  },
  status: {
    fontSize: 12,
    fontFamily: Fonts.bold,
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
});