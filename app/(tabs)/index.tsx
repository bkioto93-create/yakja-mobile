// مسیر فایل: app/(tabs)/index.tsx
//
// 🛠️ بازطراحی کامل (گزارش کاربر: «زیر دسترسی عاجل صفحه یک باکس بزرگ آبی/قهوه‌ای گرفته، لمسِ
// هرجای آن به /listings می‌رود») — با Element Inspector خودِ Expo Go تایید شد که کل آن ناحیه
// دقیقاً همان اولین CategoryBanner («کالا») بوده که به‌جای اندازه‌ی طبیعی‌اش، تمام فضای باقی‌مانده
// تا پایین صفحه را گرفته بود. طبق تصمیم صریح کارفرما («وب را فراموش کن، از نو و مثل یک اپ حرفه‌ای
// بچین»)، به‌جای رفع نقطه‌ای همان باگ، کل صفحه بازطراحی شد:
//
//   ۱) بخش «بنرهای تبلیغاتیِ ۴ ماژول» (CategoryBanner) به‌طور کامل حذف شد — هم چون منبع باگ بود،
//      هم چون از اول هم عمداً تکراریِ همان گرید «دسترسی عاجل» بالای آن بود (دو راه بصری برای
//      رسیدن به همان ۴ ماژول، بدون هیچ محتوای اضافه). حذفش هم باگ را ریشه‌ای برطرف کرد هم صفحه
//      را سبک‌تر و مستقیم‌تر به محتوای واقعی (آگهی‌ها/رانندگان/متخصصین/املاک) رساند.
//   ۲) بخش‌های «چرا یکجا» (۶ کارت ویژگی) و «پرسش‌های پرتکرار» (آکاردئون FAQ) هم حذف شدند —
//      محتوای بازاریابیِ سنگین که در صفحه‌ی اصلیِ یک اپ خرید/خدمات استاندارد (مثل دیجی‌کالا،
//      که کارفرما صریحاً به آن اشاره کرد) معمولاً جایی ندارد؛ صفحه‌ی اصلی باید مستقیم به محتوا
//      برسد. ۳ نشان اعتماد (trustBadgesRow) که از قبل داخل بنر بالای صفحه هستند برای پیام
//      «چرا یکجا» کافی‌اند.
//   ۳) ترتیب نهایی، دقیقاً هم‌الگو با اپ‌های خرید استاندارد: بنرِ برند → دسترسی سریع به ۴ ماژول →
//      استوری‌ها (اگر باشد) → ردیف‌های افقیِ محتوای واقعی (رانندگان تازه، متخصصین تازه، آگهی‌های
//      تازه‌ی کالا، آگهی‌های تازه‌ی ملک) — بدون هیچ بنر یا بخش تزئینیِ اضافه بین این‌ها.
//
// چهار کامپوننت محلیِ DriversShowcase/ProvidersShowcase/ListingsShowcase/RealEstateShowcase
// (پایین همین فایل) دست‌نخورده ماندند — این‌ها از اول هم دقیقاً همان الگوی «ردیف افقیِ کارت» ی
// بودند که یک اپ حرفه‌ای نیاز دارد، و هیچ نشانه‌ای از باگ نداشتند.
//
// **آیکون‌های سفارشی:** آیکون‌های دسترسی سریع و آیکون بنر Hero از تصاویر PNG سفارشی‌ای خوانده
// می‌شوند که کارفرما مستقیماً در پوشه‌ی public/ پروژه‌ی وب گذاشته (lib/webAssets.ts). اگر لود این
// تصاویر شکست بخورد، هر دو جا بی‌صدا به همان آیکون‌های Ionicons/Icons.Grid قبلی برمی‌گردند.
//
// **معماری داده:** یک تابع واحد (lib/home/api.ts::getHomeShowcase) هر ۴ بخشِ «تازه‌ها» را موازی
// می‌گیرد (با Promise.allSettled — رجوع کنید به کامنت بالای همان فایل برای یک باگِ جدیِ دیگر که
// همان‌جا رفع شد) — دو مورد (کالا/ملک) مستقیم با Anon Key از توابع RPC عمومیِ از-قبل-موجود، دو
// مورد دیگر (راننده/متخصص) از Route پل موبایل.
//
// 🛠️ فاز M09 — همگام‌سازی با وب (طبق درخواستِ صریحِ کارفرما، فقط دو بخشِ تازه‌ی زیر؛ بقیه‌ی
// صفحه — هیرو، ردیفِ استوری، بنرِ VIP، «چرا یکجا»، FAQ، «یکجا چیست؟» — عمداً دست‌نخورده ماندند،
// چون این‌ها قبلاً طیِ چند دورِ بازخوردِ جداگانه به‌طور آگاهانه از طراحیِ وب فاصله گرفته بودند):
//   ۱) «دسترسی عاجل»: MODULE_COLORS قبلی (gradient/glow برایِ کارتِ تیره‌ی نسخه‌ی دوم) با
//      MODULE_ACCENTS جایگزین شد — فقط یک accentColor به‌ازای هر ماژول، عیناً همان مقادیرِ
//      categories[].accentHex در src/app/[lang]/page.tsx وب. خودِ کارت هم بازطراحی شد؛ رجوع
//      کنید به کامنتِ کاملِ بالای components/ModuleCard.tsx.
//   ۲) بخشِ «اسعار» — تنها فیچرِ محتواییِ واقعاً جامانده‌ی صفحه‌ی اصلی — بلافاصله بعد از «دسترسی
//      عاجل» اضافه شد (components/ExchangeRatesSection.tsx)، دقیقاً همان جایگاهی که وب هم برایش
//      انتخاب کرده («در قسمت‌های بالایی پروژه»، طبق کامنتِ بالای page.tsx وب).
import { AboutYakja } from '@/components/AboutYakja';
import { ExchangeRatesSection } from '@/components/ExchangeRatesSection';
import { ModuleCard } from '@/components/ModuleCard';
import { StoryRing } from '@/components/stories/StoryRing';
import { StoryViewer } from '@/components/stories/StoryViewer';
import { Card } from '@/components/ui/Card';
import { IconComponent, Icons } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { VipHomeBanner } from '@/components/vip/VipHomeBanner';
import { VipPitchSection } from '@/components/vip/VipPitchSection';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useProvince } from '@/context/ProvinceContext';
import { useDictionary } from '@/hooks/useDictionary';
import {
  getHomeShowcase,
  HomeDriverPreview,
  HomeProviderPreview,
  HomeShowcase,
} from '@/lib/home/api';
import { ListingSummary } from '@/lib/marketplace/api';
import { LISTING_CATEGORIES } from '@/lib/marketplace/categories';
import { RealEstateSummary } from '@/lib/realEstate/api';
import { DEAL_TYPES } from '@/lib/realEstate/dealTypes';
import { PROPERTY_TYPES } from '@/lib/realEstate/propertyTypes';
import { getBuiltinIconComponent } from '@/lib/services/categoryIcons';
import { ActiveStory, getActiveStoriesForUser } from '@/lib/stories/api';
import { VEHICLE_TYPES } from '@/lib/transport/vehicleTypes';
import { WebAssetIcons } from '@/lib/webAssets';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Fragment, useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SHOWCASE_ITEM_LIMIT = 10;

// 🛠️ فاز M09 — همگام‌سازی با وب: جایگزینِ MODULE_COLORS قبلی (gradient/glow، مخصوصِ کارتِ
// تیره‌ی بازطراحیِ دومِ ModuleCard). بازطراحیِ سومِ ModuleCard دیگر هیچ گرادیان/هاله‌ای ندارد —
// فقط یک accentColor به‌ازای هر ماژول لازم است، عیناً همان مقادیرِ hex در categories[].accentHex
// (src/app/[lang]/page.tsx وب، بخشِ «بازطراحیِ ششم — دسترسی عاجل»): «رنگِ هر حلقه‌ی فلش دقیقاً از
// روی خودِ عکسِ طرح نمونه‌برداری شد، نه یک رنگِ نزدیکِ تقریبی». iconColor هم نگه داشته شد — فقط
// برایِ حالتِ نادرِ شکستِ لودِ تصویر (رجوع کنید به fallbackِ داخلِ ModuleCard.tsx).
const MODULE_ACCENTS = {
  listings: { accentColor: '#8269e7', iconColor: '#8269e7' },
  transport: { accentColor: '#2f9df6', iconColor: '#2f9df6' },
  services: { accentColor: '#8269e7', iconColor: '#8269e7' },
  realEstate: { accentColor: '#fb9624', iconColor: '#fb9624' },
};

export default function HomeScreen() {
  const dict = useDictionary();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  // فاز ۱۰ موبایل — قابلیت «ولایت»: صفحه‌ی اصلی حالا دقیقاً هم‌رفتار با وب، بر اساس ولایتِ
  // انتخابیِ سراسری کاربر (ProvinceContext) فیلتر می‌شود؛ province=null یعنی «همه‌ی افغانستان».
  const { province } = useProvince();
  const router = useRouter();

  const [showcase, setShowcase] = useState<HomeShowcase | null>(null);
  // درخواست کارفرما: آیکون بنر Hero هم مثل آیکون‌های دسترسی سریع، حالا از تصویر سفارشی
  // (lib/webAssets.ts::heroIcon) خوانده می‌شود؛ اگر لود شکست خورد، بی‌صدا به Icons.Grid برمی‌گردد
  // — دقیقاً همان الگوی مقاوم‌سازی‌شده‌ی ModuleCard.tsx.
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  // بازگردانیِ بخش «چرا یکجا»/FAQ (طبق درخواست کارفرما: «در وب این بخش‌ها هست، در موبایل
  // نیست») — state باز/بسته‌بودنِ هر سوالِ FAQ، دقیقاً هم‌الگو با نسخه‌ی اصلیِ همین فایل.
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // **قابلیت استوری — وضعیت Viewer:** دقیقاً هم‌الگو با StoriesShowcase.tsx وب (ردیفِ استوری‌های
  // صفحه‌ی اصلی): کدام کاربرِ ردیف الان باز است (index داخل showcase.stories)، به‌همراه کشِ
  // سبکِ درون‌حافظه‌ای برای دسته‌ی هر کاربر (تا جابه‌جایی بین چند نفرِ ردیف بدون درخواست تکراری
  // به سرور باشد).
  const [openStoryIndex, setOpenStoryIndex] = useState<number | null>(null);
  const [openStories, setOpenStories] = useState<ActiveStory[] | null>(null);
  const [openStoryInitialIndex, setOpenStoryInitialIndex] = useState<number | 'last'>(0);
  const [isOpeningStory, setIsOpeningStory] = useState(false);
  const storyCacheRef = useRef<Record<string, ActiveStory[]>>({});

  useEffect(() => {
    // فاز ۱۰ موبایل — قابلیت «ولایت»: هر بار که ولایتِ انتخابی عوض شود (از ProvinceBar، بالای
    // تب‌ها)، این افکت دوباره اجرا می‌شود و پنج بخش صفحه‌ی اصلی را با فیلتر تازه می‌گیرد — دقیقاً
    // هم‌رفتار با router.refresh() وب بعد از setProvinceAction.
    getHomeShowcase(SHOWCASE_ITEM_LIMIT, SHOWCASE_ITEM_LIMIT, province)
      .then(setShowcase)
      .catch((err) => {
        // بعد از اصلاح lib/home/api.ts (Promise.allSettled)، این catch فقط برای خطاهای واقعاً
        // غیرمنتظره (نه شکستِ یکی از سه منبعِ داده، که خودِ getHomeShowcase دیگر آن را جداگانه
        // مدیریت می‌کند) به کار می‌آید — برای همین لاگ می‌شود، چون رسیدن به اینجا یعنی یک باگِ
        // واقعاً غیرمنتظره، نه یک خطای شبکه‌ی معمولی.
        console.error('[HomeScreen] getHomeShowcase failed unexpectedly:', err);
        setShowcase({ drivers: [], providers: [], listings: [], realEstate: [], stories: [] });
      });
  }, [province]);

  const trustBadges = [
    dict.home.trustBadges.allServices,
    dict.home.trustBadges.noMiddleman,
    dict.home.trustBadges.bilingual,
  ];

  // **قابلیت استوری — منطق Viewer:** دقیقاً هم‌الگو با StoriesShowcase.tsx وب.
  const storyItems = showcase?.stories ?? [];

  async function fetchStoriesFor(ownerId: string): Promise<ActiveStory[]> {
    if (storyCacheRef.current[ownerId]) return storyCacheRef.current[ownerId];
    const result = await getActiveStoriesForUser(ownerId);
    storyCacheRef.current[ownerId] = result;
    return result;
  }

  async function handleOpenStory(index: number) {
    setIsOpeningStory(true);
    try {
      const stories = await fetchStoriesFor(storyItems[index].ownerId);
      if (stories.length === 0) {
        showToast(dict.stories.loadErrorMessage, 'error');
        return;
      }
      setOpenStoryIndex(index);
      setOpenStories(stories);
      setOpenStoryInitialIndex(0);
    } catch {
      showToast(dict.stories.loadErrorMessage, 'error');
    } finally {
      setIsOpeningStory(false);
    }
  }

  async function handleRequestNextStoryUser() {
    if (openStoryIndex === null) return;
    for (let i = openStoryIndex + 1; i < storyItems.length; i++) {
      const stories = await fetchStoriesFor(storyItems[i].ownerId);
      if (stories.length > 0) {
        setOpenStoryIndex(i);
        setOpenStories(stories);
        setOpenStoryInitialIndex(0);
        return;
      }
    }
    handleCloseStoryViewer();
  }

  async function handleRequestPreviousStoryUser() {
    if (openStoryIndex === null) return;
    for (let i = openStoryIndex - 1; i >= 0; i--) {
      const stories = await fetchStoriesFor(storyItems[i].ownerId);
      if (stories.length > 0) {
        setOpenStoryIndex(i);
        setOpenStories(stories);
        setOpenStoryInitialIndex('last');
        return;
      }
    }
  }

  function handleCloseStoryViewer() {
    setOpenStoryIndex(null);
    setOpenStories(null);
  }

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* بنر اصلی — **بازطراحی کامل (هم‌سازی با وب — بند Dark Mode شرکتی/Premium Enterprise):**
          پیش از این یک گرادیانِ فیروزه‌ای (`[primary, primaryDark]`) با آیکون داخلِ یک کادرِ
          شیشه‌ایِ نیمه‌شفاف بود. حالا دقیقاً مثل src/app/[lang]/page.tsx وب: پس‌زمینه‌ی تیره‌ی
          ثابتِ #0B1121، دو هاله‌ی نوریِ محو (فیروزه‌ای + آبی — رجوع کنید به GlowBlob.tsx برای
          روشِ بدون‌وابستگیِ بازسازیِ blur)، و آیکون کاملاً آزاد/بدون‌کادر و ۲ برابرِ اندازه‌ی
          قبل، دقیقاً همان دستورِ کارفرما برای نسخه‌ی وب. */}
      {/* 🆕 بازطراحیِ کامل (تصمیمِ صریحِ کارفرما — نه یک وصله‌ی دیگر): دو تلاشِ رفعِ باگِ قبلی
          (overflow:hidden ساده، بعد جداسازیِ لایه‌ی سایه/برش) هردو روی گوشیِ واقعی شکست خوردند —
          یعنی خودِ اتکا به overflow:hidد برای بریدنِ محتوایی که عمداً از کادر بزرگ‌تر رسم شده،
          ذاتاً روی اندروید شکننده است (به گوشی/نسخه‌ی اندروید بستگی دارد). به‌جای وصله‌ی سوم،
          طراحی از پایه عوض شد: پس‌زمینه حالا یک LinearGradient سه‌مرحله‌ای است (خودِ گرادیان
          هرگز از کادرش بیرون نمی‌زند، چون دقیقاً هم‌اندازه‌ی همان کادر رسم می‌شود — بدون نیازِ
          overflow:hidden). دو لکه‌ی رنگیِ کوچک هم برای عمق اضافه شدند، ولی این‌بار با موقعیتِ
          مثبت (نه افستِ منفیِ بزرگ) — یعنی از قبل، هندسی، همیشه کاملاً داخلِ بنر می‌مانند. */}
      <LinearGradient
        colors={[Colors.heroDark, Colors.heroDarkElevated, Colors.heroDark]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroAccentTop} />
        <View style={styles.heroAccentBottom} />

        <View style={styles.heroContent}>
          {heroImageFailed ? (
            <Icons.Grid size={110} color={Colors.white} />
          ) : (
            <Image
              source={{ uri: WebAssetIcons.heroIcon }}
              style={styles.heroImage}
              contentFit="contain"
              onError={() => setHeroImageFailed(true)}
            />
          )}
          <Text style={styles.heroBadge}>{dict.home.heroBadge}</Text>
          <Text style={styles.heroTitle}>{dict.home.welcome}</Text>
          <Text style={styles.heroSlogan}>{dict.home.slogan}</Text>
          <View style={styles.trustBadgesRow}>
            {trustBadges.map((badge) => (
              <Text key={badge} style={styles.trustBadge}>
                {badge}
              </Text>
            ))}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* دسترسی عاجل به چهار ماژول — 🛠️ بازطراحیِ دوم (بازخوردِ کارفرما، بعد از دیدنِ نسخه‌ی
            اول): «پنلِ بیرونی رو سفید کن، کارت‌های داخلش رو تیره کن» — دقیقاً برعکسِ چیدمانِ
            قبلی (که پنل تیره بود و کارت‌ها سفید). پس این پنل حالا Colors.white است (نه
            Colors.heroDark)، بدون GlowBlob (آن هاله برای پس‌زمینه‌ی تیره طراحی شده بود؛ روی
            سفید فقط یک لکه‌ی کم‌رنگ می‌شد)؛ تیترِ «دسترسی عاجل» هم به رنگِ تیره‌ی اصلیِ متن
            برگشت. خودِ رنگِ تیره حالا داخلِ هر کارت است — رجوع کنید به کامنتِ بالای
            components/ModuleCard.tsx برای جزئیاتِ کامل. */}
        <View style={styles.quickAccessPanel}>
          <Text style={styles.quickAccessTitle}>{dict.dashboard.quickAccess}</Text>
          <View style={styles.moduleGrid}>
            <ModuleCard
              title={dict.dashboard.categories.listings}
              icon="cube"
              iconColor={MODULE_ACCENTS.listings.iconColor}
              accentColor={MODULE_ACCENTS.listings.accentColor}
              imageUri={WebAssetIcons.quickListings}
              onPress={() => router.push('/listings')}
            />
            <ModuleCard
              title={dict.dashboard.categories.transport}
              icon="car"
              iconColor={MODULE_ACCENTS.transport.iconColor}
              accentColor={MODULE_ACCENTS.transport.accentColor}
              imageUri={WebAssetIcons.quickTransport}
              onPress={() => router.push('/transport')}
            />
            <ModuleCard
              title={dict.dashboard.categories.services}
              icon="build"
              iconColor={MODULE_ACCENTS.services.iconColor}
              accentColor={MODULE_ACCENTS.services.accentColor}
              imageUri={WebAssetIcons.quickServices}
              onPress={() => router.push('/services')}
            />
            <ModuleCard
              title={dict.dashboard.categories.realEstate}
              icon="home"
              iconColor={MODULE_ACCENTS.realEstate.iconColor}
              accentColor={MODULE_ACCENTS.realEstate.accentColor}
              imageUri={WebAssetIcons.quickRealEstate}
              onPress={() => router.push('/real-estate')}
            />
          </View>
        </View>

        {/* 🆕 بخش «اسعار» (فاز M09 — همگام‌سازی با وب) — بلافاصله بعد از «دسترسی عاجل»، دقیقاً
            همان جایگاهی که وب انتخاب کرده. اگر داده هنوز نرسیده/خالی باشد، خودِ کامپوننت چیزی
            رندر نمی‌کند (rates === null || rates.length === 0)، پس هیچ فضای خالی/بخشِ شکسته‌ای
            دیده نمی‌شود. */}
        <ExchangeRatesSection dict={dict.exchangeRates} language={language} />

        {/* ردیف «تازه‌ترین استوری‌ها» — معادل دقیقِ StoriesShowcase.tsx وب.
            🛠️ اصلاح (گزارش کاربر: «بخش استوری در موبایل دیده نمی‌شود»): قبلاً وقتی هیچ استوری
            فعالی نبود، کل بخش با return null حذف می‌شد — دقیقاً همان تصمیمی که خودِ وب هم قبلاً
            داشت و بعداً (طبق کامنت بالای StoriesShowcase.tsx وب) عمداً برگرداند، چون برای یک
            اپِ تازه‌راه‌اندازی‌شده که هنوز محتوای کاربرها کم است، «ناپدیدشدنِ کامل» انتخاب درستی
            نیست — دقیقاً همان لحظه‌ای است که اپ باید کاربر را به ساختنِ اولین محتوا دعوت کند.
            حالا دقیقاً هم‌رفتار با وب: اگر هیچ استوری‌ای نباشد، یک کارتِ دعوت‌کننده («هنوز کسی
            استوری نگذاشته — اولین‌نفر باش») نشان داده می‌شود که با لمس به تب پروفایل می‌رود
            (همان‌جایی که افزودن استوری امکان‌پذیر است). */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>{dict.home.sections.stories.title}</Text>
          <Text style={styles.storiesSubtitle}>{dict.home.sections.stories.subtitle}</Text>
          {storyItems.length === 0 ? (
            <Pressable onPress={() => router.push('/profile')} style={styles.storiesEmptyCard}>
              <View style={styles.storiesEmptyIconWrap}>
                <Icons.Plus size={20} color={Colors.primary} />
              </View>
              <View style={styles.storiesEmptyTextCol}>
                <Text style={styles.storiesEmptyTitle}>{dict.home.sections.stories.emptyTitle}</Text>
                <Text style={styles.storiesEmptyDesc}>{dict.home.sections.stories.emptyDesc}</Text>
              </View>
              <View style={styles.storiesEmptyCta}>
                <Text style={styles.storiesEmptyCtaText}>{dict.home.sections.stories.emptyCta}</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.storiesRailWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesRow}>
                {storyItems.map((story, i) => {
                  const displayName = story.ownerName?.trim()
                    ? story.ownerName
                    : dict.home.sections.stories.ownerFallbackName;
                  return (
                    <Fragment key={story.storyId}>
                      <Pressable onPress={() => handleOpenStory(i)} style={styles.storyItem}>
                        <StoryRing
                          hasActiveStory
                          size={64}
                          variant={story.isOfficial ? 'official' : 'default'}
                          badge={
                            story.isOfficial ? (
                              <View style={styles.officialBadge}>
                                <Icons.CheckCircle size={12} color="#fff" />
                              </View>
                            ) : undefined
                          }>
                          {story.mediaType === 'image' ? (
                            <Image
                              source={{ uri: story.mediaUrl }}
                              style={styles.fill}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={styles.storyVideoFallback}>
                              <Icons.Grid size={20} color={Colors.primary} />
                            </View>
                          )}
                        </StoryRing>
                        <Text numberOfLines={1} style={styles.storyName}>
                          {displayName}
                        </Text>
                      </Pressable>

                      {/* جداکننده‌ی خاصِ استوریِ رسمی — فقط بعد از استوریِ سنجاق‌شده‌ی مدیریت
                          (که طبق backend همیشه اولین آیتم است، اگر وجود داشته باشد). */}
                      {story.isOfficial && i === 0 && storyItems.length > 1 && (
                        <View style={styles.storyDivider} />
                      )}
                    </Fragment>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* بنرهای پیش‌رونده‌ی افقی — رانندگان/متخصصین/کالا/ملک تازه.
            🛠️ بازآرایی (بازخورد کارفرما روی وب: «بخش VIP نباید بالای بالای صفحه باشد؛ بنرش یک
            جای میانی، مثلاً بعد از ۲ تا دسته‌بندی، و بخش مزایا بعد از تمام دسته‌بندی‌ها») — همان
            منطقِ جاگذاری این‌جا هم پیاده شد: VipHomeBanner بین دو گروهِ محتوا (بعد از
            رانندگان+متخصصین، قبل از کالا+ملک) و VipPitchSection بعد از هر ۴ ردیفِ محتوا. */}
        {!showcase ? (
          <View style={styles.showcaseLoading}>
            <Spinner size="large" />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <DriversShowcase items={showcase.drivers} dict={dict} router={router} />
              <ProvidersShowcase items={showcase.providers} dict={dict} language={language} router={router} />
            </View>

            <VipHomeBanner dict={dict.vip.homeBanner} />

            <View style={styles.section}>
              <ListingsShowcase items={showcase.listings} dict={dict} router={router} />
              <RealEstateShowcase items={showcase.realEstate} dict={dict} router={router} />
            </View>
          </>
        )}

        {/* بخشِ ترغیبیِ «چرا VIP نتیجه‌ی بهتری می‌آورد؟» — بعد از تمام دسته‌بندی‌ها، طبق همان
            بازخورد بالا. برخلاف VipHomeBanner، به showcase وابسته نیست، پس همیشه نشان داده
            می‌شود (حتی وقتی ردیف‌های بالا هنوز در حال لود هستند). */}
        <VipPitchSection dict={dict.vip.pitch} ctaHref="/vip" ctaLabel={dict.vip.upsell.button} />

        {/* 🛠️ بازگردانی (درخواست کارفرما: «در وب این بخش‌ها هست، در موبایل نیست») — «چرا یکجا؟»
            و «پرسش‌های پرتکرار» که در بازطراحیِ قبلی (طبق دستور صریح همان زمان: «وب را فراموش
            کن») از موبایل حذف شده بودند، حالا دقیقاً هم‌جای وب (بعد از همه‌ی دسته‌بندی‌ها/محتوای
            VIP، قبل از فوتر/بخش «یکجا چیست؟») برگشتند. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{dict.home.features.title}</Text>
          <Text style={styles.sectionSubtitle}>{dict.home.features.subtitle}</Text>
          <View style={styles.featuresGrid}>
            {FEATURE_ICONS.map((FeatureIcon, i) => {
              const n = i + 1;
              const featuresDict = dict.home.features as Record<string, string>;
              return (
                <Card key={n} style={styles.featureCard}>
                  <View style={styles.featureIconWrap}>
                    <FeatureIcon size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.featureTitle}>{featuresDict[`item${n}Title`]}</Text>
                  <Text style={styles.featureDesc}>{featuresDict[`item${n}Desc`]}</Text>
                </Card>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{dict.home.faq.title}</Text>
          <Text style={styles.sectionSubtitle}>{dict.home.faq.subtitle}</Text>
          <View style={styles.faqList}>
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const faqDict = dict.home.faq as Record<string, string>;
              const isOpen = openFaqIndex === n;
              return (
                <Card key={n} style={styles.faqCard}>
                  <Pressable
                    onPress={() => toggleFaq(n)}
                    style={styles.faqQuestionRow}
                    accessibilityRole="button">
                    <Text style={styles.faqQuestion}>{faqDict[`q${n}`]}</Text>
                    <Icons.ChevronDown
                      size={18}
                      color={Colors.textMuted}
                      style={isOpen ? styles.faqChevronOpen : undefined}
                    />
                  </Pressable>
                  {isOpen && <Text style={styles.faqAnswer}>{faqDict[`a${n}`]}</Text>}
                </Card>
              );
            })}
          </View>
        </View>

        {/* 🆕 «یکجا چیست؟» — پایین‌ترین بخش محتوای اپ، قبل از فوتر/ناوبار (طبق دستور صریح
            کارفرما): معرفیِ کاملِ خدماتِ یکجا. رجوع کنید به کامنت بالای components/AboutYakja.tsx. */}
        <AboutYakja dict={dict.home.about} />
      </View>
    </ScrollView>

      {/* اسپینر کوچکِ تمام‌صفحه فقط برای لحظه‌ی اول بازکردنِ استوری — دقیقاً هم‌الگو با وب. */}
      {isOpeningStory && openStoryIndex === null && (
        <View style={styles.storyLoadingOverlay}>
          <Spinner size="large" />
        </View>
      )}

      {openStories && openStoryIndex !== null && storyItems[openStoryIndex] && (
        <StoryViewer
          key={storyItems[openStoryIndex].ownerId}
          stories={openStories}
          ownerName={
            storyItems[openStoryIndex].ownerName?.trim()
              ? (storyItems[openStoryIndex].ownerName as string)
              : dict.home.sections.stories.ownerFallbackName
          }
          isOwnStories={user?.id === storyItems[openStoryIndex].ownerId}
          onClose={handleCloseStoryViewer}
          onDeleted={() => {
            getHomeShowcase(SHOWCASE_ITEM_LIMIT)
              .then(setShowcase)
              .catch(() => {});
          }}
          dict={dict.stories.viewer}
          initialIndex={openStoryInitialIndex}
          hasNextUser={openStoryIndex < storyItems.length - 1}
          hasPreviousUser={openStoryIndex > 0}
          onRequestNextUser={handleRequestNextStoryUser}
          onRequestPreviousUser={handleRequestPreviousStoryUser}
        />
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// چهار بنر پیش‌رونده — هرکدام یک کامپوننت محلیِ کوچک، دقیقاً هم‌الگو با چهار Export جدای
// HomeShowcaseBanners.tsx وب (DriversShowcase/ProvidersShowcase/ListingsShowcase/
// RealEstateShowcase)، فقط اینجا هر ۴ در همین یک فایل نگه داشته شدند تا این صفحه یک تحویل
// یک‌فایلی بماند (دقیقاً هم‌روش با بقیه‌ی صفحات بزرگ این پروژه، مثل driver.tsx/provider.tsx).
// -----------------------------------------------------------------------------

type ShowcaseSectionDict = { title: string; subtitle: string; viewAll: string; emptyText: string };

function SectionHeader({
  dict,
  onViewAll,
}: {
  dict: ShowcaseSectionDict;
  onViewAll: () => void;
}) {
  return (
    <View style={styles.showcaseHeader}>
      <View style={styles.showcaseHeaderText}>
        <Text style={styles.showcaseTitle}>{dict.title}</Text>
        <Text style={styles.showcaseSubtitle} numberOfLines={1}>
          {dict.subtitle}
        </Text>
      </View>
      <Pressable onPress={onViewAll} style={styles.viewAllButton} accessibilityRole="button">
        <Text style={styles.viewAllText}>{dict.viewAll}</Text>
        <Icons.ChevronBack size={16} color={Colors.primary} />
      </Pressable>
    </View>
  );
}

function EmptyShowcaseRow({ text, Icon }: { text: string; Icon: IconComponent }) {
  return (
    <Card style={styles.emptyRow}>
      <View style={styles.emptyRowIconWrap}>
        <Icon size={22} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyRowText}>{text}</Text>
    </Card>
  );
}

function PreviewAvatar({ uri, FallbackIcon }: { uri: string | undefined; FallbackIcon: IconComponent }) {
  return (
    <View style={styles.previewAvatar}>
      {uri ? (
        <Image source={{ uri }} style={styles.previewAvatarImage} contentFit="cover" />
      ) : (
        <FallbackIcon size={26} color={Colors.primary} />
      )}
    </View>
  );
}

function DriversShowcase({
  items,
  dict,
  router,
}: {
  items: HomeDriverPreview[];
  dict: ReturnType<typeof useDictionary>;
  router: ReturnType<typeof useRouter>;
}) {
  const sectionDict = dict.home.sections.drivers;
  const vehicleTypeLabels = dict.transport.vehicleTypes as Record<string, string>;

  return (
    <View style={styles.showcaseSection}>
      <SectionHeader dict={sectionDict} onViewAll={() => router.push('/transport')} />
      {items.length === 0 ? (
        <EmptyShowcaseRow text={sectionDict.emptyText} Icon={Icons.Truck} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseRow}>
          {items.map((driver) => {
            const vehicle = VEHICLE_TYPES.find((v) => v.id === driver.vehicleType);
            const VehicleIcon = vehicle?.icon ?? Icons.Truck;
            return (
              <Pressable key={driver.id} onPress={() => router.push('/transport')} style={styles.showcaseCardWrap}>
                <Card style={styles.showcaseCard}>
                  <PreviewAvatar uri={driver.images[0]} FallbackIcon={VehicleIcon} />
                  <Text style={styles.showcaseCardTitle} numberOfLines={1}>
                    {driver.ownerName || dict.home.memberFallbackLabel}
                  </Text>
                  <View style={styles.showcaseCardSubRow}>
                    <VehicleIcon size={12} color={Colors.textMuted} />
                    <Text style={styles.showcaseCardSub} numberOfLines={1}>
                      {vehicle ? vehicleTypeLabels[vehicle.dictKey] : driver.vehicleType}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function ProvidersShowcase({
  items,
  dict,
  language,
  router,
}: {
  items: HomeProviderPreview[];
  dict: ReturnType<typeof useDictionary>;
  language: string;
  router: ReturnType<typeof useRouter>;
}) {
  const sectionDict = dict.home.sections.providers;

  return (
    <View style={styles.showcaseSection}>
      <SectionHeader dict={sectionDict} onViewAll={() => router.push('/services')} />
      {items.length === 0 ? (
        <EmptyShowcaseRow text={sectionDict.emptyText} Icon={Icons.Wrench} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseRow}>
          {items.map((provider) => {
            const BuiltinIcon =
              provider.categoryIconSource === 'builtin' ? getBuiltinIconComponent(provider.categoryIconKey) : Icons.Wrench;
            const categoryName = language === 'ps' ? provider.categoryNamePs : provider.categoryNameFa;
            const showCustomIcon = provider.categoryIconSource === 'custom' && provider.categoryIconUrl && !provider.images[0];

            return (
              <Pressable key={provider.id} onPress={() => router.push('/services')} style={styles.showcaseCardWrap}>
                <Card style={styles.showcaseCard}>
                  {provider.images[0] ? (
                    <PreviewAvatar uri={provider.images[0]} FallbackIcon={Icons.Wrench} />
                  ) : showCustomIcon ? (
                    <View style={styles.previewAvatar}>
                      <Image source={{ uri: provider.categoryIconUrl! }} style={styles.previewAvatarIcon} contentFit="contain" />
                    </View>
                  ) : (
                    <PreviewAvatar uri={undefined} FallbackIcon={BuiltinIcon} />
                  )}
                  <Text style={styles.showcaseCardTitle} numberOfLines={1}>
                    {provider.ownerName || dict.home.memberFallbackLabel}
                  </Text>
                  <Text style={styles.showcaseCardSub} numberOfLines={1}>
                    {categoryName}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function ListingsShowcase({
  items,
  dict,
  router,
}: {
  items: ListingSummary[];
  dict: ReturnType<typeof useDictionary>;
  router: ReturnType<typeof useRouter>;
}) {
  const sectionDict = dict.home.sections.listings;
  const categoryLabels = dict.marketplace.categories as Record<string, string>;

  return (
    <View style={styles.showcaseSection}>
      <SectionHeader dict={sectionDict} onViewAll={() => router.push('/listings')} />
      {items.length === 0 ? (
        <EmptyShowcaseRow text={sectionDict.emptyText} Icon={Icons.Box} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseRow}>
          {items.map((listing) => {
            const category = LISTING_CATEGORIES.find((c) => c.id === listing.category);
            const CategoryIcon = category?.icon ?? Icons.CategoryOther;
            return (
              <Pressable
                key={listing.id}
                onPress={() => router.push(`/listings/${listing.id}`)}
                style={styles.showcaseCardWrap}>
                <Card style={styles.showcaseCard}>
                  <PreviewAvatar uri={listing.images[0]} FallbackIcon={CategoryIcon} />
                  <Text style={styles.showcaseCardTitle} numberOfLines={1}>
                    {listing.title}
                  </Text>
                  <Text style={styles.showcaseCardSub} numberOfLines={1}>
                    {category ? categoryLabels[category.dictKey] : listing.category}
                  </Text>
                  <Text style={styles.showcaseCardPrice}>
                    {listing.price.toLocaleString()}{' '}
                    <Text style={styles.showcaseCardCurrency}>{dict.marketplace.detail.currencyLabel}</Text>
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function RealEstateShowcase({
  items,
  dict,
  router,
}: {
  items: RealEstateSummary[];
  dict: ReturnType<typeof useDictionary>;
  router: ReturnType<typeof useRouter>;
}) {
  const sectionDict = dict.home.sections.realEstate;
  const propertyTypeLabels = dict.realEstate.propertyTypes as Record<string, string>;
  const dealTypeLabels = dict.realEstate.dealTypes as Record<string, string>;

  return (
    <View style={styles.showcaseSection}>
      <SectionHeader dict={sectionDict} onViewAll={() => router.push('/real-estate')} />
      {items.length === 0 ? (
        <EmptyShowcaseRow text={sectionDict.emptyText} Icon={Icons.PropertyHouseSale} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.showcaseRow}>
          {items.map((property) => {
            const propertyType = PROPERTY_TYPES.find((p) => p.id === property.propertyType);
            const dealType = DEAL_TYPES.find((d) => d.id === property.dealType);
            const PropertyIcon = propertyType?.icon ?? Icons.PropertyHouseSale;
            return (
              <Pressable
                key={property.id}
                onPress={() => router.push(`/real-estate/${property.id}`)}
                style={styles.showcaseCardWrap}>
                <Card style={styles.showcaseCard}>
                  <PreviewAvatar uri={property.images[0]} FallbackIcon={PropertyIcon} />
                  <Text style={styles.showcaseCardTitle} numberOfLines={1}>
                    {propertyType ? propertyTypeLabels[propertyType.dictKey] : property.propertyType}
                  </Text>
                  <Text style={styles.showcaseCardSub} numberOfLines={1}>
                    {dealType ? dealTypeLabels[dealType.dictKey] : property.dealType}
                  </Text>
                  <Text style={styles.showcaseCardPrice}>
                    {property.price.toLocaleString()}{' '}
                    <Text style={styles.showcaseCardCurrency}>{dict.realEstate.detail.currencyLabel}</Text>
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const FEATURE_ICONS = [Icons.Grid, Icons.Phone, Icons.Lock, Icons.MessageSquare, Icons.CheckCircle, Icons.Flag];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  // پس‌زمینه یک LinearGradient است (رجوع کنید به JSX بالا) — این شیء استایل فقط شکل/چیدمانِ
  // کادر را می‌دهد؛ رنگ‌ها خودشان مستقیم روی <LinearGradient> پاس داده می‌شوند.
  hero: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  // دو لکه‌ی رنگیِ کوچک برای عمق — بر خلافِ نسخه‌ی قبلی، اینجا موقعیت‌ها *مثبت* و کاملاً داخلِ
  // ناحیه‌ی قابل‌مشاهده‌ی بنر هستند (نه افستِ منفیِ بزرگی که عمداً از لبه بیرون می‌زد)؛ یعنی حتی
  // بدونِ هیچ برشی هم، این دو دایره هرگز از کادر بیرون نمی‌روند — رجوع کنید به یادداشتِ طراحیِ
  // تازه کنارِ JSX بالا.
  heroAccentTop: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(6,182,212,0.14)',
  },
  heroAccentBottom: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  heroContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroImage: {
    // **۲ برابرِ اندازه‌ی قبل، بدون کادر/بک‌گراند شیشه‌ای** — دقیقاً همان دستورِ کارفرما برای
    // نسخه‌ی وب. قبلاً تصویر داخل یک کادرِ ۹۶×۹۶ با ۶۸٪ عرض/ارتفاع بود (یعنی واقعاً ~۶۵dp)؛ حالا
    // آزاد و مستقیماً ۱۹۰dp — تقریباً ۲ برابر، و کاملاً شناور روی بک‌گراند تیره.
    width: 190,
    height: 190,
    marginBottom: Spacing.xs,
  },
  heroBadge: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.white,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  heroSlogan: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 20,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  trustBadge: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.white,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.md,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  // --- ردیف «تازه‌ترین استوری‌ها» ---
  sectionHeaderTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  storiesSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: -4,
  },
  // کارتِ دعوت‌کننده‌ی حالتِ خالی («هنوز کسی استوری نگذاشته») — معادلِ دقیقِ کارتِ خط‌چینِ وب.
  storiesEmptyCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(6,182,212,0.25)',
    backgroundColor: 'rgba(6,182,212,0.04)',
    padding: Spacing.md,
  },
  storiesEmptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(6,182,212,0.4)',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesEmptyTextCol: {
    flex: 1,
    gap: 2,
  },
  storiesEmptyTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  storiesEmptyDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  storiesEmptyCta: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  storiesEmptyCtaText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  // نوارِ پس‌زمینه‌ی هایلایت‌شده‌ی دورِ ردیف — معادلِ همان بازطراحیِ «بک‌گراند نوارطور» وب.
  storiesRailWrap: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.12)',
    backgroundColor: 'rgba(6,182,212,0.04)',
    padding: Spacing.sm,
  },
  storiesRow: {
    gap: Spacing.md,
  },
  storyItem: {
    width: 72,
    alignItems: 'center',
    gap: 4,
  },
  storyVideoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,182,212,0.1)',
  },
  officialBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 8,
    backgroundColor: 'rgba(100,116,139,0.25)',
  },
  storyName: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    maxWidth: 72,
  },
  storyLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  quickAccessPanel: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  quickAccessTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    // برگشت به Colors.textMain — پنل دوباره روشن است، دیگر نیازی به Colors.onDark نیست.
    color: Colors.textMain,
    // 🛠️ رفعِ باگ (بازخوردِ کارفرما — «خط کنارِ عنوان می‌ره ته بلاک، جداست»): علتش خودِ
    // borderRightWidth/paddingRight بود — این‌ها ویژگی‌های *فیزیکی*‌اند (همیشه یعنی «سمتِ راستِ
    // واقعیِ صفحه»)؛ وقتی I18nManager.forceRTL(true) فعال است (app/_layout.tsx)، React Native
    // خودش این ویژگی‌های فیزیکی را خودکار آینه می‌کند (برای این‌که کدهای معمولیِ چپ‌به‌راست بدونِ
    // تغییر، در اپ‌های راست‌به‌چپ هم درست دیده شوند) — یعنی «راست» ما در کد، عملاً روی صفحه
    // «چپ» رسم می‌شد: دقیقاً همان چیزی که «رفتنِ خط به تهِ بلاک» توصیف شد. راه‌حل: بجای
    // ویژگی‌های فیزیکی (Right/Left)، از ویژگی‌های *منطقی* (Start/End) استفاده شد — این‌ها از
    // اول جهت‌آگاه‌اند، پس React Native دیگر مجبور نیست حدس بزند و دوباره آینه‌شان کند؛
    // borderStartWidth همیشه یعنی «همان سمتی که خواندن از آن شروع می‌شود» — در راست‌به‌چپ یعنی
    // درست کنارِ خودِ متن، قبل از آن.
    borderStartWidth: 4,
    borderStartColor: Colors.accent,
    paddingStart: Spacing.sm,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // 🛠️ بازخوردِ کارفرما («فضا رو برای کارت‌ها بیشتر کن»): فاصله‌ی بینِ کارت‌ها از
    // Spacing.md (۱۶) به Spacing.sm (۸) کم شد — همراه با افزایشِ flexBasisِ خودِ کارت در
    // ModuleCard.tsx، این فضای آزادشده مستقیم به خودِ کارت‌ها اضافه می‌شود.
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  showcaseLoading: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  // --- بنرهای پیش‌رونده‌ی افقی ---
  showcaseSection: {
    gap: Spacing.sm,
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  showcaseHeaderText: {
    flex: 1,
    gap: 2,
  },
  showcaseTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  showcaseSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  showcaseRow: {
    gap: Spacing.sm,
  },
  showcaseCardWrap: {
    width: 128,
  },
  showcaseCard: {
    padding: Spacing.sm,
    gap: 4,
  },
  previewAvatar: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radii.lg,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewAvatarImage: {
    width: '100%',
    height: '100%',
  },
  previewAvatarIcon: {
    width: 32,
    height: 32,
  },
  showcaseCardTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginTop: 2,
  },
  showcaseCardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showcaseCardSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  showcaseCardPrice: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
  },
  showcaseCardCurrency: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  emptyRow: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  emptyRowIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRowText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // --- سرتیترِ مشترکِ بخش‌های «چرا یکجا؟» و «پرسش‌های پرتکرار» ---
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  // --- چرا یکجا؟ ---
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  featureCard: {
    flexBasis: '48%',
    gap: 6,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  // --- پرسش‌های پرتکرار ---
  faqList: {
    gap: Spacing.sm,
  },
  faqCard: {
    gap: Spacing.xs,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  faqChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});