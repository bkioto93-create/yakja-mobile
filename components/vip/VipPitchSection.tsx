// مسیر فایل: components/vip/VipPitchSection.tsx
// 🆕 فایل تازه — معادل موبایلیِ src/components/home/VipPitchSection.tsx وب. بخشِ ترغیبیِ «چرا
// VIP نتیجه‌ی بهتری می‌آورد؟» — سه امتیازِ واقعیِ VIP (نه وعده‌ی انتزاعی)، یک یادآوریِ مخصوصِ
// بخش املاک، و یک دکمه‌ی اختیاریِ «عضویت VIP». دیکشنری (dict.vip.pitch) از قبل در پروژه‌ی
// موبایل آماده بود (هم‌شکل با ProvinceDict-مانندِ وب)؛ فقط خودِ کامپوننتِ نمایشی تا امروز ساخته
// نشده بود.
//
// ctaHref/ctaLabel اختیاری‌اند — دقیقاً هم‌الگو با وب: صفحه‌ی VIP خودش این بخش را بدون CTA
// نشان می‌دهد (چون خودِ کاربر همان‌جاست)، صفحه‌ی اصلی با CTA.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../ui/Icons';

const AMBER_50 = '#fffbeb';
const AMBER_100 = '#fef3c7';
const AMBER_500 = '#f59e0b';
const AMBER_600 = '#d97706';

export type VipPitchDict = {
  title: string;
  items: { title: string; desc: string }[];
  realEstateNoteLabel: string;
  realEstateNote: string;
};

const PITCH_ICONS = [Icons.Users, Icons.Search, Icons.CheckCircle, Icons.Clock];

export function VipPitchSection({
  dict,
  ctaHref,
  ctaLabel,
}: {
  dict: VipPitchDict;
  ctaHref?: '/vip';
  ctaLabel?: string;
}) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{dict.title}</Text>

      <View style={styles.itemsCol}>
        {dict.items.map((item, index) => {
          const PitchIcon = PITCH_ICONS[index] ?? Icons.CheckCircle;
          return (
            <View key={item.title} style={styles.itemRow}>
              <View style={styles.itemIconWrap}>
                <PitchIcon size={16} color="#fff" />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* یادآوریِ مخصوصِ بخش املاک — عیناً هم‌الگو با وب. */}
      <View style={styles.noteBox}>
        <View style={styles.noteIconWrap}>
          <Icons.PropertyHouseSale size={16} color={Colors.primary} />
        </View>
        <View style={styles.itemTextCol}>
          <Text style={styles.noteLabel}>{dict.realEstateNoteLabel}</Text>
          <Text style={styles.noteText}>{dict.realEstateNote}</Text>
        </View>
      </View>

      {ctaHref && ctaLabel && (
        <Pressable
          onPress={() => router.push(ctaHref)}
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}>
          <Text style={styles.ctaButtonText}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl + 2,
    borderWidth: 1,
    borderColor: AMBER_100,
    backgroundColor: AMBER_50,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  itemsCol: {
    gap: Spacing.sm + 2,
  },
  itemRow: {
    // 🛠️ رفعِ باگِ RTL — دقیقاً همان علتِ رفعِ باگِ benefitRow در VipHomeBanner.tsx (که خودش
    // همان علتِ borderStartWidth در app/(tabs)/index.tsx است). 'row-reverse' دستی، روی خودکارِ
    // RTLِ خودِ React Native دوباره می‌چرخاند و نتیجه را برمی‌گرداند به چپ‌به‌راست.
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: AMBER_500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  itemDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  noteBox: {
    // 🛠️ رفعِ باگِ RTL — دقیقاً هم‌دلیلِ itemRow بالا.
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: AMBER_100,
    backgroundColor: '#fff',
    padding: Spacing.sm + 2,
  },
  noteIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteLabel: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  noteText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  ctaButton: {
    height: 44,
    borderRadius: Radii.lg,
    backgroundColor: AMBER_500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonPressed: {
    backgroundColor: AMBER_600,
  },
  ctaButtonText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#fff',
  },
});