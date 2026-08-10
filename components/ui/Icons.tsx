// مسیر فایل: components/ui/Icons.tsx
// تسک ۲ فاز M00B — «انتخابگر آیکونی دسته‌بندی»، بخش اول: تک‌نقطه‌ی حقیقتِ آیکون‌ها.
//
// این فایل همان وابستگیِ گمشده‌ای است که در تسک ۵ فاز M00 مستند شده بود: فایل‌های
// lib/marketplace/categories.ts, lib/transport/vehicleTypes.ts, lib/realEstate/propertyTypes.ts,
// lib/realEstate/dealTypes.ts, lib/reports/reasons.ts — همگی عیناً از ریپازیتوری وب کپی شده بودند
// و به `@/components/ui/Icons` اشاره می‌کردند، بدون این‌که این فایل ساخته شده باشد (import آن‌ها
// تا همین تسک می‌شکست). این فایل دقیقاً همان اسم‌های استفاده‌شده در آن ۵ فایل را صادر می‌کند.
//
// طبق الزام قطعی ۲ (برچسب متنی هرگز هاردکد نمی‌شود)، این فایل فقط آیکون تصویری هر شناسه را
// مشخص می‌کند، نه متن آن — متن همیشه از دیکشنری (dict.*) خوانده می‌شود.
//
// یادداشت فنی: چون Ionicons به‌تنهایی معادل دقیقی برای برخی مفاهیم بومی (زرنج، تراکتور، گاو/دام،
// وانت، کامیون) ندارد، از MaterialCommunityIcons هم استفاده شده — هر دو از قبل داخل بسته‌ی واحد
// @expo/vector-icons موجودند (وابستگی تازه‌ای اضافه نشد). انتخاب دقیق هر گلیف را یک‌بار روی
// دستگاه واقعی مرور کنید؛ تعویض بعدی هر آیکون فقط تغییر یک خط در همین فایل است.
//
// 🛠️ به‌روزرسانی فاز M04، تسک ۱ (فهرست/جستجوی متخصصین): برخلاف دسته‌های کالا/وسیله/ملک/گزارش
// (که همگی از تسک ۵ فاز M00 به‌صورت فایل کد ثابت کپی شده بودند و آیکون‌هایشان همان‌جا، تسک ۲ فاز
// M00B، یک‌جا و پیشاپیش اضافه شدند)، service_categories طبق تصمیم مصوب کارفرما (رجوع کنید به
// docs/YAKJA_DATABASE_LOG.md، فاز ۰۴ تسک ۱ در ریپازیتوری وب) یک جدول پویاست، نه فایل کد ثابت —
// پس هیچ فایلی برایش در تسک ۵ فاز M00 کپی نشد و این آیکون‌ها تا همین تسک اضافه نشده بودند. کلیدهای
// زیر دقیقاً همان اسم‌های SERVICE_CATEGORY_BUILTIN_ICONS در src/lib/services/serviceCategoryIcons.ts
// وب‌اند؛ چون آن فایل خودش آیکون‌های SVG سفارشی (نه اسم گلیف Ionicons/MDI) دارد، معادل‌سازی مستقیم
// اسم‌به‌اسم ممکن نبود — هر گلیف اینجا نزدیک‌ترین انتخاب معنایی از همان کتابخانه‌ی مشترک است،
// دقیقاً هم‌رویکرد با انتخاب‌های قبلی این فایل (زرنج/تراکتور/...)، و مثل آن‌ها نیازمند یک بار
// مرور روی دستگاه واقعی پیش از تایید نهایی.
import { Colors } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

export type IconProps = {
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export type IconComponent = (props: IconProps) => React.ReactElement;

function fromIonicons(glyph: React.ComponentProps<typeof Ionicons>['name']): IconComponent {
  return function Icon({ size = 28, color = Colors.primary, style }: IconProps) {
    return <Ionicons name={glyph} size={size} color={color} style={style} />;
  };
}

function fromMaterialCommunity(
  glyph: React.ComponentProps<typeof MaterialCommunityIcons>['name']
): IconComponent {
  return function Icon({ size = 28, color = Colors.primary, style }: IconProps) {
    return <MaterialCommunityIcons name={glyph} size={size} color={color} style={style} />;
  };
}

export const Icons = {
  // --- دسته‌بندی‌های «خرید و فروش کالا» (فاز ۰۲، lib/marketplace/categories.ts) ---
  CategoryFood: fromIonicons('fast-food'),
  CategoryBuildingMaterials: fromIonicons('construct'),
  CategoryClothing: fromIonicons('shirt'),
  CategoryHomeGoods: fromIonicons('home'),
  CategoryMotorcycle: fromMaterialCommunity('motorbike'),
  CategoryCar: fromIonicons('car'),
  CategoryLivestock: fromMaterialCommunity('cow'),
  CategoryAgriculture: fromIonicons('leaf'),
  CategoryOther: fromIonicons('ellipsis-horizontal'),

  // --- انواع ملک (فاز ۰۵، lib/realEstate/propertyTypes.ts) ---
  PropertyHouseSale: fromIonicons('home'),
  PropertyHouseRent: fromIonicons('key'),
  PropertyLand: fromIonicons('map'),
  PropertyGarden: fromMaterialCommunity('flower'),
  PropertyShop: fromIonicons('storefront'),
  PropertyWarehouse: fromIonicons('business'),

  // --- انواع وسیله نقلیه (فاز ۰۳، lib/transport/vehicleTypes.ts) ---
  VehicleTaxi: fromIonicons('car-sport'),
  VehicleZaranj: fromMaterialCommunity('rickshaw'),
  VehicleRickshaw: fromMaterialCommunity('rickshaw-electric'),
  VehicleTractor: fromMaterialCommunity('tractor'),
  // VehiclePickup حذف شد — هم‌سازی با وب: نوع «وانت» از کل اپ برداشته شد (رجوع کنید به
  // یادداشت بالای lib/transport/vehicleTypes.ts).
  Truck: fromMaterialCommunity('truck'),

  // --- دلایل گزارش تخلف (فاز ۰۶، lib/reports/reasons.ts) ---
  ReportScam: fromIonicons('warning'),
  ReportInappropriate: fromIonicons('eye-off'),
  ReportFakeListing: fromIonicons('alert-circle'),
  // آیکون خودِ دکمه‌ی مشترک «گزارش تخلف» (فاز M06، تسک ۱، components/ReportButton.tsx) — معادل
  // Icons.Flag وب (src/components/ui/Icons.tsx)؛ outline انتخاب شد تا با وزن بصری کم‌رنگ/ثانویه‌ی
  // این دکمه (نه دکمه‌ی اصلی صفحه) هم‌خوان باشد.
  Flag: fromIonicons('flag-outline'),

  // --- تخصص‌های خدماتی (فاز M04، تسک ۱، lib/services/categoryIcons.ts) ---
  // معادل SERVICE_CATEGORY_BUILTIN_ICONS در src/lib/services/serviceCategoryIcons.ts وب؛ چون آن
  // فایل خودش آیکون‌های SVG سفارشی دارد (نه اسم گلیف)، هر گلیف زیر نزدیک‌ترین انتخاب معنایی از
  // همین کتابخانه‌ی مشترک است — جزئیات کامل در یادداشت بالای فایل.
  ServiceBuilder: fromIonicons('hammer'),
  ServiceElectrician: fromIonicons('flash'),
  ServicePlumber: fromMaterialCommunity('pipe-wrench'),
  ServiceCarpenter: fromMaterialCommunity('saw-blade'),
  ServicePainter: fromIonicons('color-palette'),
  ServiceWelder: fromIonicons('bonfire'),
  ServiceMechanic: fromMaterialCommunity('car-wrench'),
  ServiceDailyWorker: fromMaterialCommunity('account-hard-hat'),
  ServiceTailor: fromMaterialCommunity('needle'),
  // سه آیکون عمومیِ غیرتخصص‌محور — دقیقاً هم‌الگو با چهار آیکون آخر SERVICE_CATEGORY_BUILTIN_ICONS
  // وب (Wrench/User/Box/Truck)؛ Truck از قبل بالاتر (بخش وسیله نقلیه) تعریف شده، همان‌جا هم اینجا
  // دوباره قابل استفاده است — نیازی به تعریف دوباره نبود.
  Wrench: fromIonicons('build'),
  User: fromIonicons('person'),
  // افزوده‌شده برای بخش ترغیبیِ «چرا VIP نتیجه‌ی بهتری می‌آورد؟» در app/vip.tsx.
  Users: fromIonicons('people'),
  Eye: fromIonicons('eye-outline'),
  Box: fromIonicons('cube'),

  // --- آیکون‌های عمومیِ حالت صفحه (فاز M06 — فرم ثبت گزارش/پروفایل عمومی کاربر) — دقیقاً معادل
  // Icons.CheckCircle/Info/AlertCircle وب (src/components/ui/Icons.tsx)؛ چون این سه مفهوم
  // (موفقیت/اطلاع/هشدار) در هیچ فایل کد ثابت دیگری استفاده نشده بودند، تا همین تسک لازم نبودند.
  CheckCircle: fromIonicons('checkmark-circle'),
  InfoCircle: fromIonicons('information-circle'),
  AlertCircle: fromIonicons('alert-circle'),

  // --- آیکون‌های صفحه‌ی اصلی (بازطراحی صفحه‌ی اصلی، هم‌ترازی با نسخه‌ی وب) ---
  // شش آیکون بخش «چرا یکجا؟» — معادل مستقیم آیکون‌های استفاده‌شده در HomeFeatures.tsx وب
  // (LayoutDashboard/Phone/Lock/MessageSquare/CheckCircle/Flag)؛ دو موردِ آخر همان
  // CheckCircle/Flag بالا هستند، نیازی به تعریف دوباره نبود.
  Grid: fromIonicons('grid'), // معادل Icons.LayoutDashboard وب (آیتم ۱: «چهار خدمت، یک اپ»)
  Phone: fromIonicons('call'), // آیتم ۲: «تماس مستقیم، بدون واسطه»
  Lock: fromIonicons('lock-closed'), // آیتم ۳: «بررسی‌شده و امن‌تر»
  MessageSquare: fromIonicons('chatbubble-outline'), // آیتم ۴: «به زبان دری و پشتو»
  // شورون بازشدن/بسته‌شدن آکاردئون «پرسش‌های پرتکرار».
  ChevronDown: fromIonicons('chevron-down'),
  // فلش «دیدن همه»ی هر بنر پیش‌رونده (بخش HomeShowcaseBanners) — چون اپ کاملاً راست‌به‌چپ است
  // (I18nManager.forceRTL)، «جلو» بصری هم‌جهت با متن یعنی به‌سمت چپ؛ معادل چرخش ۱۸۰ درجه‌ی
  // Icons.ArrowRight در نسخه‌ی وب، اینجا مستقیماً با گلیف رو‌به‌چپِ خودِ Ionicons انجام شد.
  ChevronBack: fromIonicons('chevron-back'),
  // **افزوده‌شده (قابلیت استوری):** جفتِ طبیعیِ ChevronBack بالا — برای دکمه‌ی «استوری بعدی»
  // در StoryViewer. برخلاف ChevronBack (که جهتِ RTL رابط کاربری را دنبال می‌کند)، این دو آیکون
  // در StoryViewer عمداً *بدون* منطقِ RTL و به‌صورت مستقیم مصرف می‌شوند — چون قرارداد جهانیِ
  // ناوبریِ استوری (راست=بعدی، چپ=قبلی) به «جهتِ زمان» گره خورده، نه به جهتِ متن؛ دقیقاً همان
  // یادداشتِ صریحِ بالای StoryViewer.tsx وب.
  ChevronForward: fromIonicons('chevron-forward'),
  // دکمه‌ی بستنِ Viewer تمام‌صفحه.
  X: fromIonicons('close'),
  // دکمه‌ی حذفِ زودهنگامِ استوریِ خودِ کاربر.
  Trash: fromIonicons('trash-outline'),
  // **افزوده‌شده (قابلیت استوری — بخش نوشتن):** دکمه‌ی «افزودن ویدئو» در AddStorySection.
  Video: fromIonicons('videocam-outline'),
  // **افزوده‌شده (قابلیت چت):** دکمه‌ی «ارسال» در نوار پیام.
  Send: fromIonicons('send'),
  // **افزوده‌شده (زنگوله‌ی اعلان):** دقیقاً هم‌الگو با BellOutline/BellSolid وب — دو حالتِ
  // «بدون خوانده‌نشده» و «حداقل یک خوانده‌نشده».
  BellOutline: fromIonicons('notifications-outline'),
  BellSolid: fromIonicons('notifications'),
  // **افزوده‌شده (پیامِ صوتیِ چت):** دکمه‌ی شروعِ ضبط.
  Mic: fromIonicons('mic-outline'),
  // **افزوده‌شده (پیامِ صوتیِ چت):** دکمه‌ی پخش/توقفِ VoicePlayer.
  Play: fromIonicons('play'),
  Pause: fromIonicons('pause'),
  // **افزوده‌شده (فاز ۱۰ موبایل — قابلیت «ولایت»):** آیکون سنجاق مکان و آیکون جستجو —
  // معادل مستقیمِ Icons.MapPin/Icons.Search وب (src/components/ui/Icons.tsx)، مصرف‌شده در
  // components/province/ProvinceBar.tsx، ProvincePickerModal.tsx و ProvinceSelectField.tsx.
  MapPin: fromIonicons('location'),
  Search: fromIonicons('search'),
  // **افزوده‌شده (بنر VIP صفحه‌ی اصلی + حالت خالیِ استوری):** معادل مستقیمِ Icons.Plus وب،
  // مصرف‌شده در کارتِ دعوت‌کننده‌ی «هنوز کسی استوری نگذاشته» (app/(tabs)/index.tsx).
  Plus: fromIonicons('add'),
  // **افزوده‌شده (شفافیتِ مزیتِ استوریِ VIP):** معادل مستقیمِ Icons.Clock وب — نمادِ ساعت برای
  // کارتِ/ردیفِ چهارمِ مزیتِ VIP («استوری اختصاصی تا ۳۰ ثانیه»)، در app/vip.tsx و
  // components/vip/VipHomeBanner.tsx.
  Clock: fromIonicons('time-outline'),
  // **افزوده‌شده (سیستمِ کنترلِ نسخه‌ی اپ):** برای دکمه‌ی «بروزرسانی» در
  // components/UpdateRequiredScreen.tsx، components/UpdateAvailableModal.tsx، و بخشِ «نسخه‌ی
  // برنامه» در تبِ پروفایل.
  Download: fromIonicons('cloud-download-outline'),
  // **افزوده‌شده (کارتِ اطلاعاتِ تماس در تبِ پروفایل):** برای ردیفِ وب‌سایتِ رسمی.
  Globe: fromIonicons('globe-outline'),
} as const;