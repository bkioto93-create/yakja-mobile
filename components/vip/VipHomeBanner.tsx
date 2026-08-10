// مسیر فایل: components/vip/VipHomeBanner.tsx
// 🆕 فایل تازه — معادل موبایلیِ src/components/home/VipHomeBanner.tsx وب. همان بنرِ طلایی/
// کهربایی که در صفحه‌ی اصلی، کاربر را به سمت خرید عضویت VIP دعوت می‌کند — گرادیانِ کهربایی
// (به‌جای فیروزه‌ای اصلی) تا از هیرو اصلی متمایز باشد و حس «ویژه/پرمیوم» بدهد، عیناً هم‌الگو با
// وب: آیکون نشان، عنوان/زیرعنوان، سه ردیف مزیت، و دکمه‌ی سفید.
//
// هاله‌های نوری با GlowBlob (نه blur واقعی) — دقیقاً همان روش بدون‌وابستگیِ بقیه‌ی بنرهای این
// پروژه (بنر اصلیِ صفحه‌ی خانه، CategoryBanner). رنگ‌های کهربایی مستقیم hex هستند (نه یک توکنِ
// تازه در constants/theme.ts) — دقیقاً هم‌روش با VARIANT_STYLES در CategoryBanner.tsx که رنگ
// هر دسته را مستقیم hex نگه می‌دارد، نه یک توکنِ سراسری.
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlowBlob } from '../ui/GlowBlob';
import { Icons } from '../ui/Icons';

const AMBER_500 = '#f59e0b';
const AMBER_400 = '#fbbf24';
const AMBER_600 = '#d97706';

export type VipHomeBannerDict = {
  title: string;
  subtitle: string;
  videoLabel: string;
  postsLabel: string;
  chatLabel: string;
  storyLabel: string;
  button: string;
};

export function VipHomeBanner({ dict }: { dict: VipHomeBannerDict }) {
  const router = useRouter();

  const benefits = [
    { label: dict.videoLabel, Icon: Icons.Video },
    { label: dict.postsLabel, Icon: Icons.Box },
    { label: dict.chatLabel, Icon: Icons.MessageSquare },
    { label: dict.storyLabel, Icon: Icons.Clock },
  ];

  return (
    <Pressable onPress={() => router.push('/vip')} style={({ pressed }) => [pressed && styles.pressed]}>
      <LinearGradient
        colors={[AMBER_500, AMBER_400]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}>
        <GlowBlob size={180} color="#ffffff" opacity={0.16} style={styles.glowTopLeft} />
        <GlowBlob size={160} color="#ffffff" opacity={0.16} style={styles.glowBottomRight} />

        <View style={styles.content}>
          <View style={styles.badge}>
            <Icons.CheckCircle size={30} color="#fff" />
          </View>
          <Text style={styles.title}>{dict.title}</Text>
          <Text style={styles.subtitle}>{dict.subtitle}</Text>

          <View style={styles.benefitsCol}>
            {benefits.map((b) => (
              <View key={b.label} style={styles.benefitRow}>
                <b.Icon size={18} color="#fff" />
                <Text style={styles.benefitText}>{b.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.button}>
            <Text style={styles.buttonText}>{dict.button}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.94,
  },
  card: {
    borderRadius: Radii.xl + 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  glowTopLeft: {
    position: 'absolute',
    top: -60,
    left: -40,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -50,
    right: -30,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
  },
  benefitsCol: {
    width: '100%',
    gap: Spacing.xs + 2,
    marginTop: Spacing.xs,
  },
  benefitRow: {
    // 🛠️ رفعِ باگ (بازخوردِ کارفرما — «آیکون‌ها و نوشته‌ها از چپ به راستن»): دقیقاً همان علتِ
    // رفعِ باگِ borderStartWidth در app/(tabs)/index.tsx (رجوع کنید به یادداشتِ کاملِ آنجا)،
    // فقط این‌بار روی flexDirection: چون I18nManager.forceRTL(true) فعال است، React Native
    // خودش «row» را خودکار به راست‌به‌چپِ بصری تبدیل می‌کند؛ نوشتنِ دستیِ 'row-reverse' اینجا
    // یعنی این چرخش دوبار اتفاق بیفتد (خودکارِ RN + دستیِ ما) — نتیجه دوباره برمی‌گردد به
    // چپ‌به‌راست، دقیقاً همان چیزی که گزارش شد. با 'row' ساده (بدونِ reverse)، فقط همان چرخشِ
    // خودکارِ درستِ RN اعمال می‌شود.
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  benefitText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#fff',
    flexShrink: 1,
  },
  button: {
    marginTop: Spacing.xs,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: AMBER_600,
  },
});