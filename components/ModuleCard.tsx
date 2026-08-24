// مسیر فایل: components/ModuleCard.tsx
// کارت دسترسی عاجل به هر ماژول — استفاده‌شده در صفحه‌ی خانه.
//
// 🆕 بازطراحیِ سوم (فاز M09 — همگام‌سازی با وب، درخواستِ صریحِ کارفرما: «همون دسترسی عاجل باید
// مثل وب بشه»): وب خودش از زمانِ بازطراحیِ دومِ این کامپوننت (کارتِ تیره با عکسِ بزرگ) تا امروز
// دو بازطراحیِ دیگر هم کرده (رجوع کنید به کامنتِ کاملِ بالای src/app/[lang]/page.tsx وب، بخشِ
// «بازطراحی سوم/چهارم/ششم»). این تسک همان آخرین نسخه‌ی وب را دقیقاً پیاده می‌کند:
//   ۱) کارتِ سفید (نه تیره) با حاشیه‌ی کم‌رنگ و سایه‌ی ملایم — نه پس‌زمینه‌ی heroDark قبلی.
//   ۲) تصویر کوچک‌تر و مربعی (نه تمام‌قدِ کارت) — همان الگوی object-contain وب، تا هیچ بخشی از
//      خودِ ایلوستریشن (دست‌ها، پینِ نقشه، سقفِ خانه) بریده نشود.
//   ۳) عنوان زیرِ تصویر، وسط‌چین، با ارتفاعِ ثابت برای دو خط — دقیقاً همان رفعِ باگِ هم‌ترازیِ وب
//      («چون طولِ عنوان‌ها فرق دارد... بدونِ این تثبیتِ ارتفاع، فلش‌های زیرشان هم‌تراز نمی‌ماندند»).
//   ۴) یک دایره‌ی توپرِ رنگی (accentColor، نمونه‌برداری‌شده از خودِ عکسِ طرحِ کارفرما — نه یک رنگِ
//      نزدیکِ تقریبی) با فلشِ سفید، زیرِ عنوان — جایگزینِ نوارِ عنوانِ ساده‌ی نسخه‌ی قبلی.
//
// **پراپ‌های تغییرکرده:** `glowColor`/`gradientColors` (که فقط برایِ ته‌رنگِ کارتِ تیره‌ی قبلی
// معنا داشتند) حذف شدند — نسخه‌ی تازه اصلاً ته‌رنگ ندارد (پس‌زمینه‌ی کارت همیشه سفیدِ ساده است،
// دقیقاً مثلِ وب). به‌جایش پراپِ تازه‌ی الزامیِ `accentColor` اضافه شد — رنگِ دقیقِ دایره‌ی فلش،
// عیناً همان مقادیرِ hex استفاده‌شده در categories[].accentHex وب (src/app/[lang]/page.tsx:
// کالا/خدمات=#8269e7، حمل‌ونقل=#2f9df6، املاک=#fb9624). این یک تغییرِ آگاهانه‌ی امضای کامپوننت
// است (نه صرفاً افزودنِ یک پراپِ اختیاری)، چون کلِ فلسفه‌ی بصریِ کارت با این بازطراحی عوض شده؛
// هر دو محلِ فراخوانی (app/(tabs)/index.tsx) هم‌زمان با همین تسک به‌روزرسانی شدند.
import { Colors, Fonts, Radii } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ModuleCardProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  iconColor?: string;
  /** رنگِ دقیقِ دایره‌ی فلشِ زیرِ عنوان — رجوع کنید به یادداشتِ بالای فایل برای مقادیرِ دقیق. */
  accentColor: string;
  imageUri?: string;
};

export function ModuleCard({ title, icon, onPress, iconColor = Colors.primary, accentColor, imageUri }: ModuleCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!imageUri && !imageFailed;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(15,23,42,0.06)' }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageArea}>
        {showImage ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.iconFallback, { backgroundColor: `${accentColor}1a` }]}>
            <Ionicons name={icon} size={28} color={iconColor} />
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      <View style={[styles.arrowCircle, { backgroundColor: accentColor }]}>
        {/* چون کلِ اپ راست‌به‌چپ است (I18nManager.forceRTL)، «جلو» بصریِ این فلش با معماریِ
            جهت‌آگاهِ خودِ اسمِ گلیف Ionicons به‌درستی آینه می‌شود، دقیقاً هم‌رفتار با فلشِ
            Icons.ArrowRight وب که در همین بافت استفاده شده. */}
        <Ionicons name="arrow-back" size={14} color="#fff" style={styles.arrowIcon} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 4,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  imageArea: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconFallback: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ارتفاعِ ثابت برای دقیقاً دو خط — رجوع کنید به یادداشتِ بالای فایل (رفعِ باگِ هم‌ترازیِ وب).
  title: {
    width: '100%',
    fontSize: 11.5,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
    textAlignVertical: 'center',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // گلیفِ arrow-back خودش کمی به سمتِ چپِ مرکزِ بصریِ خودش کشیده شده؛ ۱dp جابه‌جاییِ ظریف برای
  // هم‌مرکزیِ دقیق‌تر داخلِ دایره.
  arrowIcon: {
    marginLeft: -1,
  },
});