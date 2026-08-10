// مسیر فایل: app/users/[id].tsx — معادل /users/[id] وب — فاز M06، تسک ۳
//
// صفحه‌ی عمومیِ «پروفایل کاربر»، جایگزینِ کاملِ PlaceholderScreen موقتِ (که از فاز M00 روی
// مسیرش قرار داشت؛ کارت «فروشنده»/«آگهی‌دهنده» در app/listings/[id].tsx (فاز M02) و
// app/real-estate/[id].tsx (فاز M05) از قبل به همین مسیر لینک می‌دادند). دقیقاً هم‌الگو با
// src/app/[lang]/users/[id]/page.tsx وب: بدون گالری تصویر یا دکمه‌ی تماس — شماره‌ی موبایل کاربر
// دیگر هرگز نمایش داده نمی‌شود (بند حریم خصوصی سند راهبردی؛ تماس همیشه از طریق خودِ آگهی/پروفایل
// راننده/متخصص انجام می‌شود، نه از این صفحه).
//
// طبق متن دقیق تسک («از طریق پل موبایل»): getPublicUserProfile (lib/users/publicProfile.ts) از
// Route تازه‌ی GET /api/mobile/v1/users/[id] می‌خواند — نه مستقیم با Anon Key — چون جدول users
// هیچ Policy عمومی/anon ندارد (دقیقاً مثل reports).
//
// «آیا این پروفایل خودِ من است؟»: کاملاً سمت موبایل، با مقایسه‌ی user?.id (از useAuth() محلی) با
// profile.id — بدون نیاز به فرستادن توکن به این Route عمومی. اگر پروفایل خودِ بازدیدکننده بود،
// دکمه‌ی «گزارش تخلف» پنهان می‌شود — دقیقاً هم‌الگو با isOwnProfile در صفحه‌ی وب (چون
// createReportAction هم‌اکنون خودش با خطای cannotReportSelf این حالت را رد می‌کند؛ این فقط یک
// بهبود تجربه‌ی کاربری هم‌راستا است).
import { ReportButton } from '@/components/ReportButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getPublicUserProfile, PublicUserProfile } from '@/lib/users/publicProfile';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function PublicUserProfileScreen() {
  const dict = useDictionary();
  const pageDict = dict.users.publicProfile;
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<PublicUserProfile | null | undefined>(undefined); // undefined = در حال بارگذاری

  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    getPublicUserProfile(id)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (profile === undefined) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (profile === null) {
    return (
      <>
        <Stack.Screen options={{ title: pageDict.notFoundTitle }} />
        <View style={styles.centered}>
          <Card style={styles.stateCard}>
            <View style={styles.stateIconWrap}>
              <Icons.AlertCircle size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.stateTitle}>{pageDict.notFoundTitle}</Text>
            <Text style={styles.stateDesc}>{pageDict.notFoundDesc}</Text>
            <Button
              title={pageDict.backToHomeButton}
              onPress={() => router.replace('/')}
              style={styles.stateButton}
            />
          </Card>
        </View>
      </>
    );
  }

  const displayName = profile.name?.trim() ? profile.name : pageDict.fallbackName;
  const isOwnProfile = user?.id === profile.id;

  return (
    <>
      <Stack.Screen options={{ title: displayName }} />
      <View style={styles.container}>
        <Card style={styles.identityCard}>
          <View style={styles.avatarWrap}>
            <Icons.User size={28} color={Colors.primary} />
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.memberSince}>
              {pageDict.memberSinceLabel.replace('{year}', String(profile.memberSinceYear))}
            </Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Icons.Box size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{profile.listingsCount}</Text>
            <Text style={styles.statLabel}>{pageDict.listingsCountLabel}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icons.PropertyHouseSale size={18} color={Colors.primary} />
            <Text style={styles.statValue}>{profile.realEstateCount}</Text>
            <Text style={styles.statLabel}>{pageDict.realEstateCountLabel}</Text>
          </Card>
        </View>

        {!isOwnProfile && (
          <ReportButton targetType="user" targetId={profile.id} style={styles.reportButton} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
  },
  stateCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: 360,
    width: '100%',
  },
  stateIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  memberSince: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  reportButton: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
});