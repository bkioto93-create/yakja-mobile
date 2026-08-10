// مسیر فایل: app/(tabs)/_layout.tsx
// اصلاح ممیزی تسک ۹ فاز M00B: عنوان هر ۵ تب قبلاً مستقیم فارسی هاردکد بود (از تسک ۷ فاز M00،
// پیش از کپی دیکشنری‌ها)؛ حالا از dict.nav خوانده می‌شود تا با انتخاب زبان پشتو (تسک ۸ همین
// فاز) هم درست عوض شود. این title همچنان روی برچسبِ نوارِ پایینِ تب‌ها (tabBarLabel) اثر دارد،
// حتی بعد از حذفِ هدرِ بومی پایین‌تر — چون title همان مقداریست که هم هدر هم tabBarLabel به‌صورت
// پیش‌فرض از آن استفاده می‌کنند.
//
// 🛠️ اصلاح (فاز ۱۰ موبایل — قابلیت «ولایت» — بعد از تست واقعی در Expo Go): هدرِ بومیِ سفیدِ هر
// تب (headerShown: true + headerRight: NotificationBell) کاملاً حذف شد. قبل از افزودنِ
// <ProvinceBar /> (پایین‌تر)، این هدر تنها نوار بالای صفحه بود و طبیعی به نظر می‌رسید؛ اما بعد
// از اضافه‌شدنِ ProvinceBar، دو نوار جدا روی هم می‌افتادند (نوارِ تیره‌ی ولایت، بلافاصله یک نوارِ
// سفیدِ خالی با فقط متنِ عنوانِ تب) — یک نوارِ سفیدِ زائد و بی‌ربط دقیقاً زیرِ نوارِ ولایت. چون
// هر ۵ صفحه‌ی تب از قبل عنوان/محتوای مخصوصِ خودشان را در همان اسکرول محتوا نشان می‌دهند (مثلاً
// بنرِ صفحه‌ی خانه، یا `dict.profile.title` در بالای تبِ پروفایل)، این هدرِ بومی عملاً تکراری
// بود. NotificationBell (تنها چیزِ واقعاً کاربردی در آن هدر) به components/province/
// ProvinceBar.tsx منتقل شد — همان‌جا که حالا تنها نوارِ بالای صفحه است.
//
// 🛠️ برگرداندنِ نوارِ تب‌ها به حالتِ روشنِ قبلی (بازخوردِ کارفرما): نسخه‌ی تیره‌ی این نوار (که در
// یک تسکِ جانبی امتحان شده بود) برداشته شد — طبق دستور صریح: «هدر و فوتر رو برگردون به حالتِ
// قبل، فقط دسترسی عاجل رو تیره کن». رنگِ تیره حالا فقط داخلِ همان یک بخش (دسترسی عاجل، در
// app/(tabs)/index.tsx) است، نه در چارچوبِ بیرونیِ اپ.
//
// 🆕 به‌روزرسانی (رفع باگِ سراسری — «برچسبِ نوارِ پایین فونتِ برند نمی‌گیرد»): دقیقاً همان مشکلِ
// هدرهای Stack (رجوع کنید به یادداشتِ کاملِ app/_layout.tsx)، اینجا هم وجود داشت — tabBarLabel
// هیچ‌وقت fontFamily صریح نداشت، پس با فونتِ سیستم‌عاملِ گوشی رندر می‌شد. tabBarLabelStyle تازه
// در screenOptions همین مشکل را برای هر ۵ برچسبِ پایین یک‌جا حل می‌کند.
//
// 🆕 به‌روزرسانی (رفع باگِ StatusBar — قسمتِ تب‌ها): پیش‌فرضِ سراسریِ app/_layout.tsx حالا
// style="dark" است (برای اکثریتِ صفحاتِ روشن)؛ ولی همین ۵ صفحه‌ی تب، درست پشتِ ProvinceBarِ
// تیره (Colors.heroDark) قرار دارند — آیکون‌های تیره‌ی نوار وضعیت روی آن پس‌زمینه‌ی تیره کاملاً
// نامرئی می‌شدند. این <StatusBar style="light" /> محلی، فقط وقتی یکی از این ۵ تب روی صفحه است
// (یعنی همین کامپوننت mount است)، پیش‌فرضِ سراسری را به آیکون‌های روشن/سفید override می‌کند؛
// به‌محضِ خروج از این گروه (رفتن به هر صفحه‌ی دیگری)، unmount می‌شود و پیش‌فرضِ سراسری خودکار
// دوباره برمی‌گردد — دقیقاً رفتاری که expo-status-bar برای همین سناریو (چند ناحیه‌ی رنگیِ متفاوت
// در یک اپ) طراحی شده.
import { ProvinceBar } from '@/components/province/ProvinceBar';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 🛠️ اصلاح UX (بازخورد کاربر — «نوار تب پایین به دکمه‌های اندروید خیلی نزدیک است»): تا پیش از
// این تغییر، screenOptions هیچ tabBarStyle صریحی نداشت — یعنی ارتفاع/padding نوار تب کاملاً به
// پیش‌فرض @react-navigation/bottom-tabs واگذار می‌شد. آن پیش‌فرض insets.bottom را برای عدم
// همپوشانی با نوار سیستم حساب می‌کند، ولی هیچ فاصله‌ی اضافه‌ای بعد از آن نمی‌گذارد — روی
// گوشی‌هایی با ناوبری سه‌دکمه‌ای (این‌جا هم دقیقاً همین حالت)، برچسب‌های تب درست بالای همان
// insets.bottom می‌نشینند و بصری خیلی فشرده/چسبیده به نظر می‌رسند. راه‌حل: یک tabBarStyle صریح
// با height/paddingBottom/paddingTop مشخص — insets.bottom + یک فاصله‌ی اضافه‌ی ثابت (Spacing.sm)
// تا نوار تب همیشه یک نفسِ بصری روشن از نوار سیستم داشته باشد، صرف‌نظر از این‌که گوشی ناوبریِ
// سه‌دکمه‌ای دارد یا ژست‌محور. border/elevation ظریف هم برای ظاهر حرفه‌ای‌تر و جداییِ بصریِ
// روشن‌تر از محتوای صفحه اضافه شد.
const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabLayout() {
  const dict = useDictionary();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <ProvinceBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: { fontFamily: Fonts.bold, fontSize: 11 },
          tabBarItemStyle: { paddingTop: 4 },
          tabBarStyle: {
            height: TAB_BAR_CONTENT_HEIGHT + insets.bottom + Spacing.sm,
            paddingBottom: insets.bottom + Spacing.sm,
            paddingTop: Spacing.sm,
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            elevation: 8,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: -2 },
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: dict.nav.home,
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="listings"
          options={{
            title: dict.nav.listings,
            tabBarIcon: ({ color, size }) => <Ionicons name="pricetags" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="transport"
          options={{
            title: dict.nav.transport,
            tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: dict.nav.services,
            tabBarIcon: ({ color, size }) => <Ionicons name="construct" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: dict.nav.profile,
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}