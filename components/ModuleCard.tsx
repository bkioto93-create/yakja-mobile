// مسیر فایل: components/ModuleCard.tsx
// کارت دسترسی عاجل به هر ماژول — استفاده‌شده در صفحه‌ی خانه (فاز M00B، تسک ۵).
//
// 🆕 بازطراحیِ کاملِ دوم — نه یک تنظیمِ دیگر، یک UI/UX کاملاً متفاوت (تصمیمِ صریحِ کارفرما):
// نسخه‌ی قبلی («آیکونِ کوچک داخلِ یک دایره‌ی رنگی») با این‌که از نظرِ فنی سالم بود، از نظرِ
// طراحی رضایت‌بخش نبود. کارفرما دقیقاً مشخص کرد چه می‌خواهد: «آبجکتِ عکس‌ها باید بزرگ باشه،
// اندازه‌ی همون محصولات» — یعنی الگوی یک کارتِ محصولِ فروشگاهی (عکس، بزرگ و غالب بر کارت، نه
// یک آیکونِ کوچکِ تزیینی داخلِ یک بَج).
//
// **طراحیِ تازه:** هر کارت حالا دو بخشِ روشن دارد:
//   ۱) ناحیه‌ی تصویر — تقریباً تمامِ عرض و بیشترِ ارتفاعِ کارت را می‌گیرد؛ خودِ تصویرِ اختصاصیِ
//      سه‌بعدیِ هر دسته (که قبلاً هم برای هر ماژول وجود داشت، فقط کوچک و داخلِ یک دایره محدود
//      شده بود) حالا واقعاً دیده می‌شود، نه فقط یک نشانه‌ی کوچک.
//   ۲) نوارِ عنوان — یک نوارِ کوتاه و ساده زیرِ تصویر، فقط متنِ عنوان، بدون هیچ تزیینِ اضافه.
// هیچ دایره/هاله‌ی تزیینیِ جداگانه‌ای دیگر نیست — چون خودِ تصویر (که رنگی و پر از جزئیات است)
// کاملاً کافی است تا کارت زنده و جذاب دیده شود؛ اضافه‌کردنِ یک هاله‌ی رنگیِ دیگر رویش فقط
// شلوغ و پرت‌کننده می‌شد. تنها ردِ باقی‌مانده‌ی رنگِ اختصاصیِ هر دسته (glowColor) یک ته‌رنگِ
// بسیار ملایم و کاملاً مستطیلی/محصور پشتِ خودِ ناحیه‌ی تصویر است — یک بک‌گراند ساده، نه یک شکلِ
// شناور که نیاز به بریدنِ دقیق داشته باشد؛ پس هیچ‌کدام از ریسک‌های نسخه‌های قبلی اینجا وجود ندارد.
//
// پراپ‌های کامپوننت عمداً دست‌نخورده مانده‌اند (title/icon/onPress/iconColor/gradientColors/
// glowColor/imageUri) — یعنی app/(tabs)/index.tsx حتی یک خط هم نیاز به تغییر ندارد؛ فقط ظاهرِ
// داخلیِ خودِ کارت عوض شده.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ModuleCardProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  iconColor?: string;
  // دیگر مستقیم مصرف نمی‌شود (ناحیه‌ی تصویر دیگر گرادیانِ جداگانه ندارد)؛ پراپ برای سازگاریِ
  // عقب‌رو با فراخوانی‌های فعلی در index.tsx نگه داشته شده — حذفِ بی‌دلیلِ یک پراپِ عمومی از
  // نوعِ کامپوننت، بدون نیاز واقعی، فقط ریسکِ بی‌جا اضافه می‌کند.
  gradientColors?: [string, string];
  // رنگِ پایه‌ی ته‌رنگِ ملایمِ پشتِ تصویر و رنگِ Ripple لمس.
  glowColor?: string;
  imageUri?: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ModuleCard({
  title,
  icon,
  onPress,
  iconColor = Colors.primary,
  glowColor = Colors.primary,
  imageUri,
}: ModuleCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!imageUri && !imageFailed;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: hexToRgba(glowColor, 0.2) }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* ناحیه‌ی تصویر — بخشِ اصلیِ کارت. ته‌رنگش یک بک‌گراندِ ساده و کاملاً مستطیلی است (نه یک
          شکلِ شناور)، پس هیچ‌وقت نیازی به «بریدنِ دقیق» ندارد — این دقیقاً همان درسی است که از
          دو تلاشِ قبلی گرفته شد. */}
      <View style={[styles.imageArea, { backgroundColor: hexToRgba(glowColor, 0.16) }]}>
        {showImage ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Ionicons name={icon} size={56} color={iconColor} />
        )}
      </View>

      <View style={styles.titleBar}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48.5%',
    aspectRatio: 0.92,
    backgroundColor: Colors.heroDark,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.onDarkBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: {
    opacity: 0.9,
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  titleBar: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.onDark,
    textAlign: 'center',
  },
});