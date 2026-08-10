// مسیر فایل: components/AboutYakja.tsx
// معادل موبایلیِ src/app/[lang]/HomeAbout.tsx وب («یکجا چیست؟»). برخلاف وب، این بخش هیچ فایده‌ی
// SEO ندارد (اپ React Native توسط بات‌های گوگل ایندکس نمی‌شود) — فقط برای یکدستیِ تجربه‌ی
// کاربری با وب ساخته شده.
//
// جای‌گذاری: آخرین بخشِ محتوای صفحه‌ی اصلی (app/(tabs)/index.tsx)، بعد از همه‌چیزِ دیگر، درست
// قبل از پایان ScrollView.
//
// 🆕 بازطراحیِ کامل (تصمیمِ صریحِ کارفرما — نه یک وصله‌ی دیگر): دقیقاً هم‌دلیلِ بازطراحیِ کاملِ
// styles.hero در app/(tabs)/index.tsx و components/ModuleCard.tsx — اتکا به overflow:hidden
// برای بریدنِ محتوایی که عمداً از کادرش بزرگ‌تر رسم شده (چه GlowBlobِ پشتِ آیکون‌ها، چه سه
// لایه‌ی درصدیِ پشتِ تصویر)، روی اندروید ذاتاً شکننده بود و روی گوشیِ واقعیِ کارفرما شکست خورد.
// طراحیِ تازه از پایه به اصلِ «هرچیزِ تزیینی، همیشه کاملاً داخلِ کادر» پایبند است — رجوع کنید به
// یادداشتِ کاملِ همین اصل بالای components/ModuleCard.tsx.
//
// تغییرات مشخص نسبت به نسخه‌ی قبلی:
//   • پس‌زمینه‌ی کارت: از heroDarkِ صاف + GlowBlobِ سرریزکننده → یک LinearGradient سه‌مرحله‌ای
//     (دقیقاً هم‌الگو با styles.hero بازطراحی‌شده) که خودش هرگز از کادرش بیرون نمی‌زند.
//   • تصویر: سه لایه‌ی درصدیِ «هاله‌ی پشتِ عکس» (که با insetِ منفی عمداً از عکس بزرگ‌تر بودند،
//     یعنی همان دسته‌ریسک) کاملاً حذف شد؛ به‌جایش یک حاشیه‌ی ظریف و ثابت دورِ خودِ عکس — تمیز و
//     صد در صد بدون ریسکِ سرریز.
//   • آیکون‌های شش‌گانه: از «GlowBlob پشتِ بَجِ شیشه‌ای» → یک دایره‌ی گرادیانِ رنگیِ پاستلِ
//     کاملاً محصور (دقیقاً هم‌الگو با آیکونِ ModuleCard.tsx تازه) — رنگِ خودِ آیکون
//     (Colors.primaryDark، برای کنتراستِ کافی روی پاستلِ روشن) دیگر primary/سفید نیست؛ چون
//     پس‌زمینه‌ی بَج دیگر شیشه‌ای/تیره نیست، بلکه یک پاستلِ روشن است.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { WebAssetIcons } from '@/lib/webAssets';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconComponent, Icons } from './ui/Icons';

export type AboutYakjaDict = {
  title: string;
  subtitle: string;
  intro: string;
  items: { title: string; desc: string }[];
  closing: string;
  imageAlt: string;
};

const ITEM_ICONS: IconComponent[] = [
  Icons.Box,
  Icons.Truck,
  Icons.Wrench,
  Icons.PropertyHouseSale,
  Icons.MessageSquare,
  Icons.CheckCircle,
];

export function AboutYakja({ dict }: { dict: AboutYakjaDict }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{dict.title}</Text>
        <Text style={styles.subtitle}>{dict.subtitle}</Text>
      </View>

      <LinearGradient
        colors={[Colors.heroDark, Colors.heroDarkElevated, Colors.heroDark]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        {/* لکه‌ی رنگیِ کوچک برای عمق — موقعیتِ مثبت و کاملاً داخلِ کارت (نه افستِ منفیِ
            سرریزکننده‌ی نسخه‌ی قبلی) — رجوع کنید به یادداشتِ طراحیِ تازه بالای فایل. */}
        <View style={styles.cardAccent} />

        {!imageFailed && (
          <Image
            source={{ uri: WebAssetIcons.aboutIllustration }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={dict.imageAlt}
            onError={() => setImageFailed(true)}
          />
        )}

        <Text style={styles.intro}>{dict.intro}</Text>

        <View style={styles.itemsGrid}>
          {dict.items.map((item, i) => {
            const ItemIcon = ITEM_ICONS[i] ?? Icons.CheckCircle;
            return (
              <View key={item.title} style={styles.itemCard}>
                <LinearGradient
                  colors={['#ecfeff', '#cffafe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.itemIconWrap}>
                  <ItemIcon size={18} color={Colors.primaryDark} />
                </LinearGradient>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.closing}>{dict.closing}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardAccent: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(6,182,212,0.13)',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radii.lg,
    backgroundColor: Colors.heroDarkElevated,
    borderWidth: 1,
    borderColor: Colors.onDarkBorder,
  },
  intro: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.onDarkMuted,
    lineHeight: 21,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  itemCard: {
    flexBasis: '48%',
    gap: 4,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.onDark,
  },
  itemDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.onDarkMuted,
    lineHeight: 17,
  },
  closing: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.onDark,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});