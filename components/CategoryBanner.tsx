// مسیر فایل: components/CategoryBanner.tsx
// **کامپوننتِ تازه (هم‌سازی با وب — درخواست صریح کارفرما: «مو به مو، بدون کوچک‌ترین اختلاف»):**
// معادل دقیقِ src/components/home/CategoryBanner.tsx وب — چهار بنرِ تبلیغاتیِ عریض (کالا،
// حمل‌ونقل، خدمات، املاک) با نشانِ آیکونی، عنوان، توضیح، و دعوت‌به‌اقدامِ «مشاهده ←». این بخش
// پیش از این در صفحه‌ی خانه‌ی موبایل اصلاً وجود نداشت — روی وب، صفحه‌ی اصلی هم گرید «دسترسی
// عاجل» (کارت‌های کوچکِ مربعی، معادلِ ModuleCard اینجا) دارد و هم این بنرهای عریض را، به‌عنوان
// دو راهِ بصریِ متفاوت برای رسیدن به همان ۴ ماژول — عمداً افزونه، نه اضافیِ بی‌دلیل، دقیقاً طبق
// همان معماریِ وب.
//
// معادل‌سازیِ گرادیان/هاله (بدون blur بومی) دقیقاً هم‌الگو با ModuleCard.tsx — رجوع کنید به
// توضیح کامل بالای components/ui/GlowBlob.tsx.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlowBlob } from './ui/GlowBlob';
import { IconComponent, Icons } from './ui/Icons';

export type CategoryBannerVariant = 'listings' | 'transport' | 'services' | 'realEstate';

const VARIANT_STYLES: Record<
  CategoryBannerVariant,
  {
    gradient: [string, string];
    textColor: string;
    badgeBg: string;
    glowColor: string;
    icon: IconComponent;
  }
> = {
  listings: {
    gradient: ['#eff6ff', '#ffffff'],
    textColor: '#1d4ed8',
    badgeBg: 'rgba(59,130,246,0.12)',
    glowColor: '#3b82f6',
    icon: Icons.Box,
  },
  transport: {
    gradient: ['#fff7ed', '#ffffff'],
    textColor: Colors.accentDark,
    badgeBg: 'rgba(249,115,22,0.12)',
    glowColor: Colors.accent,
    icon: Icons.Truck,
  },
  services: {
    gradient: ['#ecfdf5', '#ffffff'],
    textColor: '#047857',
    badgeBg: 'rgba(16,185,129,0.12)',
    glowColor: '#10b981',
    icon: Icons.Wrench,
  },
  realEstate: {
    gradient: ['#faf5ff', '#ffffff'],
    textColor: '#7e22ce',
    badgeBg: 'rgba(168,85,247,0.12)',
    glowColor: '#a855f7',
    icon: Icons.PropertyHouseSale,
  },
};

export function CategoryBanner({
  variant,
  title,
  description,
  ctaLabel,
  imageUri,
  onPress,
}: {
  variant: CategoryBannerVariant;
  title: string;
  description: string;
  ctaLabel: string;
  imageUri?: string;
  onPress: () => void;
}) {
  const style = VARIANT_STYLES[variant];
  const BadgeIcon = style.icon;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!imageUri && !imageFailed;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={style.gradient}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}>
        <View style={styles.glowLayer}>
          <GlowBlob size={140} color={style.glowColor} opacity={0.22} />
        </View>

        <View style={styles.textCol}>
          <View style={[styles.badge, { backgroundColor: style.badgeBg }]}>
            <BadgeIcon size={18} color={style.textColor} />
          </View>
          <Text style={[styles.title, { color: style.textColor }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {description}
          </Text>
          <View style={styles.ctaRow}>
            <Text style={[styles.ctaText, { color: style.textColor }]}>{ctaLabel}</Text>
            <Icons.ChevronBack size={14} color={style.textColor} />
          </View>
        </View>

        <View style={styles.imageCol}>
          {showImage ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <BadgeIcon size={48} color={style.glowColor} />
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'stretch',
    minHeight: 128,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    overflow: 'hidden',
  },
  glowLayer: {
    position: 'absolute',
    bottom: -40,
    left: -20,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    padding: Spacing.md,
    gap: 6,
    justifyContent: 'center',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  desc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  imageCol: {
    width: 118,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});