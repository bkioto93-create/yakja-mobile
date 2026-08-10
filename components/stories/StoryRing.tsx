// مسیر فایل: components/stories/StoryRing.tsx
// معادل موبایلِ src/components/stories/StoryRing.tsx وب — کامپوننت خالصِ نمایشی (بدون هیچ
// منطق دیتا/فچ) که یک حلقه‌ی رنگی گرادیانی (دقیقاً به الگوی استوری اینستاگرام) دور هر محتوایی
// (آواتار/آیکون) می‌کشد، فقط اگر hasActiveStory=true باشد.
//
// **معادل‌سازیِ گرادیان:** وب از یک گرادیانِ CSS سه‌رنگه (`from-amber-400 via-pink-500
// to-fuchsia-600`, جهتِ `to top right`) استفاده کرده؛ اینجا با `expo-linear-gradient` (از قبل
// نصب‌شده، بدون وابستگی تازه) همان سه رنگ و همان جهت بازسازی شد.
//
// اندازه با یک عدد پیکسلی (size) کنترل می‌شود، دقیقاً هم‌الگو با نسخه‌ی وب — چون جاهای مختلف
// اپ آواتارهایی با اندازه‌ی متفاوت خواهند داشت (ردیف صفحه‌ی اصلی، صفحه‌ی «همه استوری‌ها»، و...).
//
// **افزوده‌شده (سنجاق‌شدنِ استوریِ مدیریت):** یک variant تازه («official») + یک badge اختیاری،
// دقیقاً هم‌الگو با به‌روزرسانیِ معادلِ وب (src/components/stories/StoryRing.tsx) — این کامپوننت
// همچنان هیچ منطق تجاری‌ای درباره‌ی «کیست ادمین» نمی‌داند، فقط رنگ/نشانِ متفاوت رندر می‌کند.
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const RING_COLORS = ['#fbbf24', '#ec4899', '#c026d3'] as const; // amber-400 → pink-500 → fuchsia-600
// طلایی → زمردی → سبزآبی — دقیقاً هم‌رنگِ variant="official" وب.
const OFFICIAL_RING_COLORS = ['#fbbf24', '#10b981', '#0d9488'] as const;

export function StoryRing({
  hasActiveStory,
  onPress,
  size = 64,
  children,
  ariaLabel,
  variant = 'default',
  badge,
}: {
  hasActiveStory: boolean;
  onPress?: () => void;
  size?: number;
  children: ReactNode;
  ariaLabel?: string;
  // "official" فقط برای سنجاق‌شدنِ استوریِ حساب رسمی مدیریت یکجا استفاده می‌شود.
  variant?: 'default' | 'official';
  // یک نشانِ کوچکِ اختیاری (مثلاً تیکِ سبز) که گوشه‌ی پایین‌چپِ حلقه رندر می‌شود.
  badge?: ReactNode;
}) {
  // ضخامت حلقه‌ی گرادیانی و فاصله‌ی سفید بین حلقه و آواتار، هردو نسبت به اندازه‌ی کلی محاسبه
  // می‌شوند — دقیقاً همان فرمول وب — تا در اندازه‌های مختلف همیشه تناسب بصری درستی داشته باشد.
  const ringThickness = Math.max(2, Math.round(size * 0.045));
  const gapThickness = Math.max(2, Math.round(size * 0.035));
  const ringColors = variant === 'official' ? OFFICIAL_RING_COLORS : RING_COLORS;

  const avatar = (
    <View style={[styles.fill, { borderRadius: size / 2, overflow: 'hidden' }]}>{children}</View>
  );

  const content = hasActiveStory ? (
    <LinearGradient
      colors={ringColors}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        padding: ringThickness,
      }}>
      <View
        style={{
          flex: 1,
          borderRadius: size / 2,
          backgroundColor: '#fff',
          padding: gapThickness,
          overflow: 'hidden',
        }}>
        {avatar}
      </View>
    </LinearGradient>
  ) : (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      {avatar}
    </View>
  );

  const wrappedContent = badge ? (
    <View style={{ width: size, height: size }}>
      {content}
      <View style={styles.badgeWrap} pointerEvents="none">
        {badge}
      </View>
    </View>
  ) : (
    content
  );

  if (!onPress) return wrappedContent;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      style={({ pressed }) => [{ width: size, height: size }, pressed && styles.pressed]}>
      {content}
      {badge && (
        <View style={styles.badgeWrap} pointerEvents="none">
          {badge}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  badgeWrap: {
    position: 'absolute',
    bottom: -2,
    left: -2,
  },
});