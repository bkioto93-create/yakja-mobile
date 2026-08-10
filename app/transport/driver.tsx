// مسیر فایل: app/transport/driver.tsx — معادل /transport/driver وب — فاز M03، تسک ۳ + تسک ۴ + تسک ۵ + تسک ۶
// ⚠️ باگ جداگانه‌ی شناخته‌شده (ربطی به قابلیت «ولایت» ندارد — کشف‌شده حین همین بررسی):
// saveDriverProfile (lib/transport/mutations.ts) هنوز یک فیلد imagePaths: string[] می‌فرستد،
// اما Route واقعیِ وب (src/app/api/mobile/v1/transport/driver/route.ts) از فاز VIP به بعد به‌جای
// آن دو فیلد جداگانه می‌خواهد: personalPhotoPath (الزامی) و vehiclePhotoPath (اختیاری) — دقیقاً
// هم‌الگو با DriverProfileClient.tsx وب که این فرم را به دو بخشِ «عکس خودتان» / «عکس وسیله»
// جدا کرده. یعنی این صفحه، مستقل از رفع مشکل ولایت پایین، همچنان هنگام ذخیره خطا خواهد داد —
// چون سرور دیگر imagePaths را نمی‌شناسد. رفع این مورد نیازمند بازطراحی بخش «عکس‌ها»ی همین فرم
// (دو دکمه‌ی انتخاب عکس جدا به‌جای گالری واحد) است و عمداً در همین تحویل انجام نشده (خارج از
// دامنه‌ی درخواستِ «تعریف ولایت»)؛ توصیه می‌شود به‌عنوان یک تسک جداگانه پیگیری شود.
//
// فرم ثبت/ویرایش پروفایل راننده: نوع وسیله (الزامی) → مشخصات وسیله (اختیاری) → شماره تماس
// (الزامی) → عکس‌ها (اختیاری، حداکثر ۵) → سوییچ فعال/غیرفعال (فقط در حالت ویرایش) → به‌روزرسانی
// خودکار موقعیت مکانی (فقط وقتی سوییچ روشن است). دقیقاً معادل موبایلِ DriverProfileClient.tsx وب
// (src/app/[lang]/transport/driver/DriverProfileClient.tsx).
//
// برخلاف ویزارد ثبت آگهی کالا (app/listings/new.tsx)، این یک فرم تک‌صفحه‌ای است (Wizard.tsx
// عمداً استفاده نشده) — دقیقاً هم‌الگو با نسخه‌ی وب که خودش هم یک فرم تک‌صفحه با چند بخش است، نه
// یک ویزارد چندمرحله‌ای؛ کلیدهای دیکشنری dict.transport.driverProfile هم فاقد
// step1Title..step4Title اند (برخلاف dict.marketplace.wizard)، که همین انتخاب طراحی را تایید
// می‌کند. هیچ کلید دیکشنری تازه‌ای برای تسک‌های ۳/۴/۵ لازم نبود — dict.transport.driverProfile از
// قبل، از فاز M00 (تسک ۵، کپی مستقیم از وب)، کامل بود؛ کلیدهای مربوط به همان تسک‌ها
// (locationTrackingActiveNotice/DeniedNotice/UnsupportedNotice، errors.invalidLocation) هم از
// همان کپی اولیه از قبل موجود بودند و تا آن‌موقع هرگز واقعاً مصرف نشده بودند.
//
// جریان عکس دقیقاً هم‌الگو با app/listings/new.tsx (گام ۲ ویزارد کالا): انتخاب از گالری →
// فشرده‌سازی فوری سمت کلاینت (lib/imageCompression.ts) → پیش‌نمایش محلی؛ آپلود واقعی
// (lib/transport/mutations.ts :: uploadDriverImages) فقط لحظه‌ی ذخیره‌ی نهایی فرم انجام می‌شود.
// تفاوت با کالا: اینجا هم عکس‌های «از قبل موجود» (حالت ویرایش، مسیر خامِ Storage) و هم عکس‌های
// «تازه‌ی همین جلسه» (URI محلی) باید هم‌زمان مدیریت شوند — دقیقاً همان دو-آرایه‌ای که
// DriverProfileClient.tsx وب هم دارد (existingImages/newImages)، چون فقط عکس‌های تازه نیاز به
// فشرده‌سازی/آپلود دارند؛ عکس‌های قبلی همان مسیر خامشان مستقیماً دوباره ارسال می‌شود.
//
// بخش سوییچ فعال/غیرفعال (تسک ۴): دقیقاً هم‌الگو با بخش متناظر در DriverProfileClient.tsx
// وب — فقط در «حالت ویرایش» نمایش داده می‌شود (راننده‌ای که هنوز پروفایلی نساخته چیزی برای
// فعال/غیرفعال‌کردن ندارد؛ به‌جایش همان کارت inactiveByDefaultNotice قبلی نمایش داده می‌شود).
// به‌روزرسانی «خوش‌بینانه» (optimistic): مقدار سوییچ فوراً روی صفحه تغییر می‌کند، سپس درخواست به
// سرور می‌رود؛ در صورت شکست، مقدار قبلی برگردانده می‌شود و پیام خطا نشان داده می‌شود — دقیقاً
// همان الگوی handleToggleActive وب. این عملیات یک اکشن کاملاً مجزا از ذخیره‌ی فرم است
// (setDriverActiveStatus، نه saveDriverProfile) — طبق کامنت بالای همان تابع در mutations.ts.
//
// به‌روزرسانی خودکار موقعیت مکانی (تسک ۵): دقیقاً هم‌الگو با useEffect ردیابی موقعیت در
// DriverProfileClient.tsx وب — تا وقتی سوییچ بالا «فعال» است، هر ۳۰ تا ۶۰ ثانیه‌ی *تصادفی*
// (`30 + Math.random() * 30`، همان بازه‌ی دقیقِ وب — تصادفی بودن عمداً است تا اگر چند راننده
// هم‌زمان فعال شوند، درخواست‌هایشان روی سرور یکجا خرد نشوند) مختصات فعلی گرفته و از طریق
// updateDriverLocation (lib/transport/mutations.ts) ارسال می‌شود. تفاوت با وب فقط در دو API
// سطح پلتفرم است:
//   ۱) به‌جای navigator.geolocation.getCurrentPosition از expo-location (Location.getCurrentPositionAsync
//      + مجوز از طریق requestLocationAccess مشترک، تسک ۶) استفاده شده — به‌همراه همان محافظ
//      withTimeout ۸ ثانیه‌ای (LOCATION_TIMEOUT_MS) در برابر باگ شناخته‌شده‌ی expo-location روی
//      برخی گوشی‌های اندرویدی (getCurrentPositionAsync گاهی برای همیشه معلق می‌ماند) — دقیقاً
//      همان الگوی app/(tabs)/listings.tsx و app/(tabs)/transport.tsx.
//   ۲) به‌جای document.visibilitychange (تشخیص «آیا تب مرورگر در دید کاربر است») از AppState
//      ری‌اکت‌نیتیو (تشخیص «آیا اپ در پیش‌زمینه است») استفاده شده — معادل دقیق native همان مفهوم.
// ردیابی دقیقاً به چرخه‌ی عمر همین کامپوننت/صفحه گره خورده (نه یک Task پس‌زمینه‌ی جدا از اپ) —
// وقتی کاربر از این صفحه خارج شود (مثلاً بعد از ثبت فرم، router.replace به تب حمل‌ونقل)، useEffect
// پاک‌سازی می‌شود و ارسال موقعیت متوقف می‌شود؛ این دقیقاً همان طراحی‌ای است که خودِ وب هم دارد
// (وابسته به باز بودن تب) و با Cron موجود سرور (`/api/cron/deactivate-stale-drivers`، هر ۵ دقیقه،
// غیرفعال‌سازی خودکار پس از ۱۰ دقیقه بدون به‌روزرسانی — تسک ۷ فاز ۰۳ وب) هماهنگ است.
//
// **به‌روزرسانی تسک ۶ فاز M03 (مدیریت مجوز GPS اندروید — درخواست صریح + پیام راهنما در صورت رد):**
// نسخه‌ی قبلی sendLocation دو تماس جدا داشت: یک بررسی دستی hasServicesEnabledAsync، سپس یک
// requestForegroundPermissionsAsync ساده که فقط status را می‌خواند و هر رد شدنی را یکسان
// LocationTrackingStatus='denied' می‌گذاشت — یعنی حتی اگر کاربر مجوز را با «دیگر نشان نده» برای
// همیشه رد کرده بود (canAskAgain=false)، اپ هر ۳۰ تا ۶۰ ثانیه بی‌صدا دوباره تلاش می‌کرد و همان
// پیام عمومی locationTrackingDeniedNotice (که حتی اشتباهاً از «تنظیمات مرورگر» وب کپی شده بود) را
// تکرار می‌کرد — راننده هیچ‌وقت واقعاً «دیده‌شدن» را دوباره به دست نمی‌آورد، بدون این‌که هیچ راهنمایی
// عملی ببیند. رفع شد: هر دو بررسی (سرویس GPS گوشی + مجوز اپ، با تفکیک deniedRetry/deniedBlocked)
// اکنون در یک تابع مشترک، requestLocationAccess (lib/location.ts، تازه — همان‌جایی که
// app/(tabs)/transport.tsx هم استفاده می‌کند)، متمرکز شده. LocationTrackingStatus یک عضو تازه
// گرفت: 'blocked' — فقط در همین حالت (که تلاش خودکار هرگز به نتیجه نمی‌رسد) یک دکمه‌ی «باز کردن
// تنظیمات گوشی» (Linking.openSettings()) کنار پیام راهنمای تازه (locationTrackingBlockedNotice)
// نمایش داده می‌شود؛ حالت 'denied' (رد قابل‌تکرار) هم‌چنان بدون دکمه می‌ماند، چون تلاش خودکار
// چرخه‌ی بعدی خودش دوباره پنجره‌ی سیستمی را باز می‌کند و نیازی به مداخله‌ی دستی کاربر نیست. متن
// locationTrackingDeniedNotice هم اصلاح شد تا دیگر به «تنظیمات مرورگر» اشاره نکند.
import { LoginRequiredCard } from '@/components/LoginRequiredCard';
import { ProvinceSelectField } from '@/components/province/ProvinceSelectField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { compressImage } from '@/lib/imageCompression';
import { requestLocationAccess } from '@/lib/location';
import { normalizeAfghanPhone } from '@/lib/phone';
import { getDriverImageUrl } from '@/lib/transport/images';
import {
  getMyDriverProfile,
  saveDriverProfile,
  setDriverActiveStatus,
  TransportApiError,
  updateDriverLocation,
  uploadDriverImages,
} from '@/lib/transport/mutations';
import { VEHICLE_TYPES, VehicleTypeId } from '@/lib/transport/vehicleTypes';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_PHOTOS = 5;

// دقیقاً همان محافظِ به‌کاررفته در app/(tabs)/listings.tsx و app/(tabs)/transport.tsx — طبق باگ
// شناخته‌شده‌ی expo-location روی برخی گوشی‌های اندرویدی (getCurrentPositionAsync گاهی برای همیشه
// معلق می‌ماند).
const LOCATION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

// تسک ۵ — پنج وضعیت ممکنِ ردیابی موقعیت (چهارتای قبلی + 'blocked' تازه‌ی تسک ۶):
//   'idle'        → سوییچ فعال/غیرفعال هنوز روشن نشده، ردیابی اصلاً شروع نشده.
//   'active'      → آخرین تلاش موفق بود؛ موقعیت با موفقیت ارسال شد.
//   'denied'      → کاربر مجوز را رد کرده ولی هنوز می‌توان دوباره از او پرسید (deniedRetry) —
//                   چرخه‌ی بعدی خودش دوباره پنجره‌ی سیستمی را نشان می‌دهد، نیازی به دکمه نیست.
//   'blocked'     → کاربر با «دیگر نشان نده» مجوز را برای همیشه رد کرده (deniedBlocked، تازه‌ی
//                   تسک ۶) — تلاش خودکار دیگر هیچ‌وقت به‌جایی نمی‌رسد؛ فقط دکمه‌ی «باز کردن
//                   تنظیمات گوشی» راه‌حل واقعی است.
//   'unsupported' → سرویس موقعیت مکانی (GPS) کلِ گوشی خاموش است.
type LocationTrackingStatus = 'idle' | 'active' | 'denied' | 'blocked' | 'unsupported';

export default function DriverProfileScreen() {
  const dict = useDictionary();
  const formDict = dict.transport.driverProfile;
  const errorsDict = formDict.errors as Record<string, string>;
  const vehicleTypesDict = dict.transport.vehicleTypes as Record<string, string>;
  const router = useRouter();
  const { user, isReady } = useAuth();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ آخرین آیتمِ صفحه زیرِ نوار ناوبریِ سیستمیِ اندروید.
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  // تا وقتی پروفایل فعلی (اگر باشد) خوانده نشده، فرم رندر نمی‌شود — تا فیلدها یک‌بار درست
  // پیش‌پر شوند، نه این‌که خالی نمایش داده شوند و بعد ناگهان مقداردهی شوند.
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [vehicleType, setVehicleType] = useState<VehicleTypeId | null>(null);
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فیلد الزامی تازه.
  const [province, setProvince] = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // عکس‌های از قبل ذخیره‌شده (حالت ویرایش) — مسیر خامِ Storage.
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // عکس‌های تازه‌ی انتخاب‌شده در همین جلسه — URI محلی؛ فقط هنگام ذخیره‌ی فرم آپلود می‌شوند.
  const [newImages, setNewImages] = useState<string[]>([]);
  const [compressingCount, setCompressingCount] = useState(0);

  // وضعیت فعال/غیرفعال — تسک ۴. فقط در حالت ویرایش معنا دارد (پیش‌فرض false بی‌اثر است، چون
  // بخش سوییچ فقط وقتی isEditMode=true رندر می‌شود).
  const [isActive, setIsActive] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  // ردیابی خودکار موقعیت مکانی — تسک ۵ (+ حالت 'blocked' تسک ۶). فقط وقتی isActive=true معنا دارد.
  const [locationTrackingStatus, setLocationTrackingStatus] =
    useState<LocationTrackingStatus>('idle');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalImages = existingImages.length + newImages.length;

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);

    getMyDriverProfile()
      .then((profile) => {
        if (cancelled) return;
        if (profile) {
          setIsEditMode(true);
          setVehicleType(profile.vehicleType);
          setProvince(profile.province);
          setVehicleDetails(profile.vehicleDetails ?? '');
          setContactPhone(profile.contactPhone);
          setExistingImages(profile.images);
          setIsActive(profile.isActive);
        } else {
          setContactPhone(user.phoneNumber);
        }
      })
      .catch(() => {
        // شبکه/سرور در دسترس نبود — فرم در «حالت ثبت» با شماره‌ی پیش‌فرض کاربر باز می‌ماند؛
        // کاربر همچنان می‌تواند فرم را پر و ارسال کند (خطای واقعی همان لحظه‌ی ارسال نشان داده
        // می‌شود، دقیقاً هم‌روحیه با رفتار تحمل‌گر AuthContext.refreshUser).
        if (!cancelled) setContactPhone(user.phoneNumber);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, user]);

  // تسک ۵ — تا وقتی سوییچ بالا «فعال» است، هر ۳۰ تا ۶۰ ثانیه‌ی تصادفی مختصات فعلی گرفته و ارسال
  // می‌شود؛ دقیقاً هم‌الگو با useEffect ردیابی موقعیت در DriverProfileClient.tsx وب (جزئیات کامل
  // در کامنت بالای فایل). تسک ۶ — بررسی سرویس GPS + مجوز اپ اکنون یک‌جا از طریق requestLocationAccess
  // مشترک انجام می‌شود، به‌جای دو تماس جداگانه‌ی قبلی.
  useEffect(() => {
    if (!isActive) {
      setLocationTrackingStatus('idle');
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function sendLocation() {
      const access = await requestLocationAccess();
      if (cancelled) return;

      if (access === 'servicesDisabled') {
        setLocationTrackingStatus('unsupported');
        scheduleNext();
        return;
      }
      if (access === 'deniedBlocked') {
        // تسک ۶ — رد همیشگی: تلاش خودکار بعدی هم بی‌فایده است، ولی چرخه هم‌چنان زمان‌بندی
        // می‌شود تا اگر کاربر خودش از تنظیمات گوشی مجوز را فعال کرد، بدون نیاز به خروج/ورود
        // دوباره از این صفحه، ردیابی خودش به‌طور طبیعی در چرخه‌ی بعدی از سر گرفته شود.
        setLocationTrackingStatus('blocked');
        scheduleNext();
        return;
      }
      if (access === 'deniedRetry') {
        setLocationTrackingStatus('denied');
        scheduleNext();
        return;
      }

      try {
        // فاز M07، تسک ۴ — بازبینی مصرف باتری: دقت صریحاً روی Balanced تنظیم شد (نه پیش‌فرض
        // ضمنی قبلی، که هم‌ارزِ همین مقدار بود، ولی صریح‌نویسی آن را از تغییر ناخواسته‌ی احتمالی
        // در نسخه‌های بعدیِ expo-location مصون نگه می‌دارد). برای این مورد استفاده — فقط نمایش
        // موقعیت تقریبیِ راننده روی فهرست، نه ناوبری نوبت‌به‌نوبت — دقت بالاتر (High/Highest،
        // ~۱۰ برابر مصرف باتری بیشتر روی GPS سخت‌افزاری) هیچ سودی برای کاربر ندارد؛ Balanced
        // (دقت ~۱۰۰ متر، معمولاً از رادیوی شبکه/Wi-Fi به‌جای GPS ماهواره‌ای استفاده می‌کند) دقیقاً
        // کافی است. این تنظیم، در کنار سه تصمیم معماریِ از قبلِ این فایل که مستقیماً به مصرف
        // باتری کمک می‌کنند، بازبینی و تایید شد: (۱) Polling با فاصله‌ی تصادفی ۳۰-۶۰ ثانیه، نه
        // watchPositionAsync پیوسته؛ (۲) توقف کامل هنگام پس‌زمینه‌بودن اپ (AppState)؛
        // (۳) توقف کامل وقتی سوییچ «فعال» خاموش است (کل این افکت فقط وقتی isActive===true
        // نصب می‌شود). اندازه‌گیری واقعی درصد افت باتری روی دستگاه فیزیکی، بخشی از تسک ۵ همین
        // فاز است.
        const position = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          LOCATION_TIMEOUT_MS
        );
        if (cancelled) return;
        setLocationTrackingStatus('active');
        // fire-and-forget — دقیقاً هم‌رفتار وب: یک شکست تکی نباید تجربه‌ی کاربر را با Toast خطا
        // مختل کند، چرخه‌ی بعدی خودش دوباره تلاش می‌کند (کامنت کامل بالای updateDriverLocation).
        updateDriverLocation(position.coords.latitude, position.coords.longitude).catch(() => {});
      } catch {
        if (cancelled) return;
        setLocationTrackingStatus('denied');
      }
      scheduleNext();
    }

    function sendIfForeground() {
      if (cancelled) return;
      if (AppState.currentState !== 'active') {
        // اپ در پس‌زمینه است — همین چرخه را رد کن و دوباره در نوبت بعدی امتحان کن؛ معادل دقیقِ
        // بررسی document.visibilityState === 'hidden' در وب.
        scheduleNext();
        return;
      }
      sendLocation();
    }

    function scheduleNext() {
      if (cancelled) return;
      const delayMs = (30 + Math.random() * 30) * 1000;
      timeoutId = setTimeout(sendIfForeground, delayMs);
    }

    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'active') {
        if (timeoutId) clearTimeout(timeoutId);
        sendLocation();
      }
    }

    sendLocation();
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.remove();
    };
  }, [isActive]);

  if (!isReady || (user && loadingProfile)) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: formDict.title }} />
        <LoginRequiredCard
          title={formDict.loginRequiredTitle}
          description={formDict.loginRequiredDesc}
          buttonLabel={formDict.loginRequiredButton}
        />
      </>
    );
  }

  const addPhotos = async () => {
    const remaining = MAX_PHOTOS - totalImages;
    if (remaining <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return; // رد دسترسی گالری بدون توضیح مسدودکننده؛ کاربر می‌تواند دوباره تلاش کند

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (result.canceled) return;

    setCompressingCount((c) => c + result.assets.length);
    for (const asset of result.assets) {
      try {
        const compressed = await compressImage(asset.uri);
        setNewImages((prev) =>
          existingImages.length + prev.length < MAX_PHOTOS ? [...prev, compressed.uri] : prev
        );
      } catch {
        showToast(errorsDict.compressionFailed, 'error');
      } finally {
        setCompressingCount((c) => c - 1);
      }
    }
  };

  const removeExistingImage = (path: string) =>
    setExistingImages((prev) => prev.filter((p) => p !== path));
  const removeNewImage = (uri: string) => setNewImages((prev) => prev.filter((u) => u !== uri));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vehicleType) errs.vehicleType = errorsDict.invalidVehicleType;
    // فاز ۱۰ موبایل — قابلیت «ولایت»: saveDriverProfileAction وب این فیلد را الزامی می‌داند
    // (رجوع کنید به کامنت بالای lib/transport/mutations.ts).
    if (!province) errs.province = dict.province.fieldError;
    if (!normalizeAfghanPhone(contactPhone)) errs.phone = errorsDict.invalidPhone;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !vehicleType || !province) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      const uploadedPaths = await uploadDriverImages(newImages);
      const normalizedPhone = normalizeAfghanPhone(contactPhone)!; // validate() همین را تضمین کرده

      await saveDriverProfile({
        vehicleType,
        province,
        vehicleDetails: vehicleDetails.trim(),
        contactPhone: normalizedPhone,
        imagePaths: [...existingImages, ...uploadedPaths],
      });

      showToast(isEditMode ? formDict.saveSuccessUpdate : formDict.saveSuccessCreate, 'success');
      router.replace('/(tabs)/transport');
    } catch (err) {
      const code = err instanceof TransportApiError ? err.code : 'generic';
      setSubmitError(errorsDict[code] ?? errorsDict.generic);
    } finally {
      setSubmitting(false);
    }
  };

  // سوییچ فعال/غیرفعال — تسک ۴. به‌روزرسانی خوش‌بینانه: مقدار فوراً روی صفحه عوض می‌شود؛ در
  // صورت شکست درخواست، به مقدار قبلی برمی‌گردد و پیام خطا نشان داده می‌شود — دقیقاً هم‌الگو با
  // handleToggleActive در DriverProfileClient.tsx وب.
  const handleToggleActive = async (nextValue: boolean) => {
    const previousValue = isActive;
    setIsActive(nextValue);
    setTogglingActive(true);
    try {
      await setDriverActiveStatus(nextValue);
      showToast(
        nextValue ? formDict.activeToggleSuccessOn : formDict.activeToggleSuccessOff,
        'success'
      );
    } catch (err) {
      setIsActive(previousValue);
      const code = err instanceof TransportApiError ? err.code : 'generic';
      showToast(errorsDict[code] ?? errorsDict.generic, 'error');
    } finally {
      setTogglingActive(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: formDict.title }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Text style={styles.subtitle}>{formDict.subtitle}</Text>

        <Text style={styles.sectionTitle}>{formDict.vehicleTypeSectionTitle}</Text>
        <CategoryPicker
          items={VEHICLE_TYPES}
          labels={vehicleTypesDict}
          value={vehicleType}
          onChange={setVehicleType}
        />
        {fieldErrors.vehicleType && <Text style={styles.fieldError}>{fieldErrors.vehicleType}</Text>}

        <Card style={styles.card}>
          <Input
            label={formDict.vehicleDetailsLabel}
            placeholder={formDict.vehicleDetailsPlaceholder}
            value={vehicleDetails}
            onChangeText={setVehicleDetails}
          />
          <ProvinceSelectField
            value={province}
            onChange={setProvince}
            dict={dict.province}
            label={dict.province.fieldLabel}
            error={fieldErrors.province}
          />
          <Input
            label={formDict.contactPhoneLabel}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            error={fieldErrors.phone}
          />
        </Card>

        <Text style={styles.sectionTitle}>{formDict.photosSectionTitle}</Text>
        <Text style={styles.stepHint}>{formDict.photosHint}</Text>
        <View style={styles.photoGrid}>
          {existingImages.map((path) => (
            <View key={`existing-${path}`} style={styles.photoWrap}>
              <Image source={{ uri: getDriverImageUrl(path) }} style={styles.photo} contentFit="cover" />
              <Pressable
                onPress={() => removeExistingImage(path)}
                accessibilityLabel={formDict.removePhotoLabel}
                style={styles.removeBadge}>
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            </View>
          ))}
          {newImages.map((uri) => (
            <View key={`new-${uri}`} style={styles.photoWrap}>
              <Image source={{ uri }} style={styles.photo} contentFit="cover" />
              <Pressable
                onPress={() => removeNewImage(uri)}
                accessibilityLabel={formDict.removePhotoLabel}
                style={styles.removeBadge}>
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            </View>
          ))}
          {compressingCount > 0 &&
            Array.from({ length: compressingCount }).map((_, i) => (
              <View key={`compressing-${i}`} style={[styles.photoWrap, styles.photoLoading]}>
                <Spinner size="small" />
              </View>
            ))}
        </View>
        {totalImages < MAX_PHOTOS && (
          <Button
            title={formDict.addPhotoButton}
            variant="secondary"
            onPress={addPhotos}
            style={styles.addPhotoButton}
          />
        )}

        {/* سوییچ فعال/غیرفعال (تسک ۴) + وضعیت ردیابی موقعیت (تسک ۵ + حالت 'blocked' تسک ۶) — فقط
            در حالت ویرایش (راننده‌ای که هنوز پروفایل نساخته چیزی برای فعال/غیرفعال‌کردن ندارد). */}
        {isEditMode && (
          <Card style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchLabel}>{formDict.activeToggleLabel}</Text>
                <Text style={styles.switchNotice}>
                  {isActive ? formDict.currentlyActiveNotice : formDict.currentlyInactiveNotice}
                </Text>
              </View>
              <Switch
                checked={isActive}
                onChange={handleToggleActive}
                disabled={togglingActive}
                accessibilityLabel={formDict.activeToggleLabel}
              />
            </View>

            {isActive && locationTrackingStatus === 'active' && (
              <Text style={styles.locationNotice}>{formDict.locationTrackingActiveNotice}</Text>
            )}
            {isActive && locationTrackingStatus === 'denied' && (
              <Text style={styles.locationNoticeDanger}>
                {formDict.locationTrackingDeniedNotice}
              </Text>
            )}
            {/* تسک ۶ — حالت تازه‌ی «رد همیشگی»: بدون دکمه‌ی راهنما، تلاش خودکار هرگز به نتیجه
                نمی‌رسد؛ برخلاف حالت بالا (denied)، اینجا یک دکمه‌ی عملی هم نمایش داده می‌شود. */}
            {isActive && locationTrackingStatus === 'blocked' && (
              <View style={styles.locationBlockedWrap}>
                <Text style={styles.locationNoticeDanger}>
                  {formDict.locationTrackingBlockedNotice}
                </Text>
                <Button
                  title={dict.common.openSettingsButton}
                  variant="secondary"
                  onPress={() => Linking.openSettings()}
                />
              </View>
            )}
            {isActive && locationTrackingStatus === 'unsupported' && (
              <Text style={styles.locationNoticeDanger}>
                {formDict.locationTrackingUnsupportedNotice}
              </Text>
            )}
          </Card>
        )}

        {!isEditMode && (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeText}>{formDict.inactiveByDefaultNotice}</Text>
          </Card>
        )}

        {submitError && <Text style={styles.submitError}>{submitError}</Text>}

        <Button
          title={
            submitting
              ? dict.common.loading
              : isEditMode
                ? formDict.submitButtonUpdate
                : formDict.submitButtonCreate
          }
          onPress={handleSubmit}
          disabled={submitting || compressingCount > 0}
          style={styles.submitButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  stepHint: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.danger,
    textAlign: 'center',
  },
  card: {
    gap: Spacing.md,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoWrap: {
    width: 88,
    height: 88,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoLoading: {
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 22,
    height: 22,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: Colors.white,
    fontSize: 16,
    lineHeight: 18,
  },
  addPhotoButton: {
    marginTop: -Spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  switchTextWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  switchNotice: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  // تسک ۵ — نمایش وضعیت ردیابی موقعیت زیر سوییچ، دقیقاً هم‌الگو با متن‌های مشابه بالا.
  locationNotice: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  locationNoticeDanger: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.danger,
    lineHeight: 18,
  },
  // تسک ۶ — پوشش پیام راهنما + دکمه‌ی «باز کردن تنظیمات» برای حالت «رد همیشگی».
  locationBlockedWrap: {
    gap: Spacing.xs,
  },
  noticeCard: {
    backgroundColor: Colors.bgBase,
  },
  noticeText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  submitError: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.danger,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
});