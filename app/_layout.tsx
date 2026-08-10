// مسیر فایل: app/_layout.tsx
// به‌روزرسانی تسک ۷ فاز M00B: افزودن <DisclaimerModal /> سراسری — دقیقاً هم‌الگو با نحوه‌ی
// قرارگیری ToastProvider (تسک ۱ همین فاز): باید فقط یک‌بار، در ریشه‌ی اپ، داخل هر دو Provider
// قرار بگیرد تا هم به دیکشنری (LanguageProvider) و هم به Toast دسترسی داشته باشد.
//
// 🛠️ اصلاح جانبی (بین فاز M00B و فاز M01) — راه‌اندازی واقعی صفحه‌ی انتخاب زبان در اولین اجرا:
// معادل دقیق میان‌افزار `src/proxy.ts` وب (که بدون کوکی `yakja_lang` بی‌قیدوشرط به
// `/select-language` ریدایرکت می‌کند). app/select-language.tsx از تسک ۸ فاز M00B ساخته شده
// بود، اما هیچ‌جای کد به آن ریدایرکت نمی‌کرد — کاربر تازه‌وارد مستقیم وارد تب خانه می‌شد و
// زبان بی‌صدا روی 'fa' می‌ماند. راه‌حل: `Stack.Protected` (قابلیت رسمی expo-router از
// SDK 53/Router v5 به بعد — پروژه روی expo-router ~6.0.24 است؛ روش رسمی/توصیه‌شده‌ی فعلی
// برای مسیرهای شرطی، جایگزین الگوی قدیمی‌تر ریدایرکت دستی با useEffect). وقتی
// `hasChosenLanguage` (فیلد تازه‌ی LanguageContext) هنوز false است، گروه `(tabs)`
// غیرقابل‌دسترس می‌شود و Router خودکار به تنها صفحه‌ی دیگرِ ثبت‌شده — select-language —
// هدایت می‌کند؛ به محض انتخاب زبان، `(tabs)` دوباره در دسترس قرار می‌گیرد و
// app/select-language.tsx (با یک useEffect، نه هم‌زمان با خودِ انتخاب) کاربر را به خانه
// برمی‌گرداند — جزئیات کامل در کامنت بالای همان فایل.
//
// شرط تازه‌ی `if (!isLanguageReady) return null;` دقیقاً هم‌الگو با شرط `!fontsLoaded` پایین‌تر
// است: تا مشخص نشود کاربر قبلاً زبانی انتخاب کرده یا نه (خواندن SecureStore، چند میلی‌ثانیه)،
// هیچ Stack‌ای رندر نمی‌شود — این از یک فلاش لحظه‌ای نادرست (نشان‌دادن تب خانه و بلافاصله
// جابه‌جایی به select-language) جلوگیری می‌کند، دقیقاً همان مشکلی که برای فونت هم از قبل با
// همین الگو حل شده بود.
//
// select-language اکنون صریحاً با `headerShown: false` ثبت شده — قبلاً چون این صفحه هیچ‌وقت
// واقعاً باز نمی‌شد، این جزئیات نمایشی بررسی نشده بود؛ طراحی صفحه (کارت‌های تمام‌صفحه‌ی
// وسط‌چین، بدون نیاز به دکمه‌ی بازگشتِ هدر) با نوار هدر پیش‌فرض هم‌خوانی ندارد.
//
// 🛠️ اصلاح جانبی دوم (همان بازه) — ترتیب «اول زبان، بعد سلب مسئولیت»:
// <DisclaimerModal /> قبلاً بی‌قید و شرط، هم‌زمان با Stack، رندر می‌شد — یعنی حتی وقتی کاربر
// تازه‌وارد روی select-language بود (پیش از انتخاب زبان)، ممکن بود مودال سلب مسئولیت هم
// (به زبان پیش‌فرض 'fa') روی همان صفحه ظاهر شود و جلوی انتخاب زبان را بگیرد. حالا رندرِ
// خودِ <DisclaimerModal /> هم پشت همان `hasChosenLanguage` گیت شده: تا زبان انتخاب نشده،
// این کامپوننت اصلاً mount نمی‌شود (نه فقط مخفی — کلاً رندر نمی‌شود)، پس درخواست خواندن
// SecureStore و نمایش احتمالی‌اش هم به تعویق می‌افتد. به‌محض انتخاب زبان، در همان رندری که
// (tabs) در دسترس قرار می‌گیرد، DisclaimerModal هم mount می‌شود و بررسی خودش را (تاییدشده/
// نشده) انجام می‌دهد — این بار قطعاً به زبان درستِ کاربر. منطق داخلی خودِ DisclaimerModal.tsx
// دست‌نخورده مانده؛ فقط شرطِ mount شدنش در همین فایل اضافه شده.
//
// 🛠️ به‌روزرسانی فاز M01 (بخش ب، تسک‌های ۷/۸/۱۰) — افزودن <AuthProvider>:
// دقیقاً هم‌الگو با نحوه‌ی قرارگیری LanguageProvider/ToastProvider (یک Provider سراسری در
// ریشه‌ی اپ). برخلاف LanguageProvider، هیچ شرط `if (!isAuthReady) return null` اضافه نشده —
// طبق تصمیم مستندشده‌ی تسک ۱۱ («کاربر مهمان باید بتواند دقیقاً مثل وب، بدون هیچ معطلی، در هر
// ۴ ماژول بگردد»)، وضعیت نامشخص نشست هرگز نباید کل اپ را معطل نگه دارد؛ فقط همان صفحه‌ای که
// واقعاً به user نیاز دارد (تب پروفایل) خودش isReady را چک می‌کند و یک Spinner محلی نشان
// می‌دهد. ترتیب تودرتو (بیرون به درون: Toast ← Language ← Auth) دلخواه است — سه Context کاملاً
// مستقل از هم‌اند و به ترتیب قرارگیری یکدیگر وابسته نیستند.
// 🛠️ به‌روزرسانی فاز M07 (تسک ۲) — افزودن <OfflineBanner />:
// دقیقاً هم‌الگو با نحوه‌ی قرارگیری <DisclaimerModal /> (یک‌بار در ریشه‌ی اپ). برخلاف
// DisclaimerModal، پشت hasChosenLanguage گیت نشد — قطعی اینترنت حتی روی خودِ صفحه‌ی
// select-language هم باید اطلاع‌رسانی شود (آن صفحه هم به اینترنت نیاز دارد، برای ثبت انتخاب
// زبان در SecureStore محلی نه، ولی صفحات بعدی چرا)؛ چون AppNavigator از isLanguageReady پایین‌تر
// عبور کرده، useDictionary() (که OfflineBanner داخلی صدا می‌زند) در این نقطه همیشه ایمن است.
//
// **افزوده‌شده (قابلیت Push Notification):** یک useEffect تازه در AppNavigator، دقیقاً هم‌جا با
// بقیه‌ی Providerهای سراسری — چون هم به useRouter() نیاز دارد (برای هدایت به گفتگوی درست بعد از
// لمسِ اعلان) هم باید همیشه mount باشد، نه فقط داخل یک صفحه‌ی خاص. دو حالت پوشش داده می‌شود:
//   ۱) اپ باز است (پیش‌زمینه/پس‌زمینه) و کاربر روی اعلان لمس می‌کند — با
//      addNotificationResponseReceivedListener.
//   ۲) اپ کاملاً بسته بوده و کاربر با لمسِ اعلان آن را باز کرده (Cold Start) — با
//      getLastNotificationResponseAsync، یک‌بار در همان mount اول.
// فعلاً تنها نوعِ data.type پشتیبانی‌شده \"chat_message\" است (تنها چیزی که سرور در فاز الفِ Push
// ارسال می‌کند)؛ ساختار به‌گونه‌ای است که افزودنِ نوع‌های تازه در آینده فقط به یک شاخه‌ی تازه در
// همین switch نیاز دارد.
//
// 🆕 به‌روزرسانی (فاز ۱۰ موبایل — قابلیت «ولایت»): افزودن <ProvinceProvider> — دقیقاً هم‌الگو با
// نحوه‌ی قرارگیری AuthProvider (یک Provider سراسری، بدون گیت‌کردن رندر پشت آن؛ برخلاف
// LanguageProvider که هنوز فایل، مسیر URL، و صفحه‌ی اول اپ را تعیین می‌کند، ولایت هیچ اثری روی
// مسیر یا فایل‌های رندرشده ندارد، فقط روی فیلترِ داده — دقیقاً هم‌دلیلِ نبودِ گیت مشابه در
// AuthProvider). قرارگیری داخل LanguageProvider (نه بیرونش) عمدی است: ProvinceBar به
// useDictionary() (که خودش به LanguageContext وابسته است) نیاز دارد، پس باید Context زبان از قبل
// در دسترس باشد. ترتیب AuthProvider/ProvinceProvider نسبت به هم دلخواه است — دو Context کاملاً
// مستقل از هم‌اند.
//
// 🆕 به‌روزرسانی (سیستم تازه‌ی مودالِ تاییدِ سراسری): افزودن <ConfirmModalProvider> — دقیقاً
// هم‌الگو با نحوه‌ی قرارگیری ToastProvider (یک Provider سراسری، بیرونی‌ترین لایه‌ی ممکن، چون هر
// صفحه‌ای در هر عمقی از درخت ممکن است به useConfirm() نیاز داشته باشد). جزئیات کامل طراحی و
// چرایی در بالای components/ui/ConfirmModal.tsx.
//
// 🆕 به‌روزرسانی (رفع باگِ سراسری — «هدرها فونتِ برند نمی‌گیرند/تیتر و فلش‌ها نامرتب‌اند»):
// طبق بازخوردِ کارفرما، تا پیش از این تغییر، خودِ <Stack> فقط `headerShown: true` داشت — هیچ
// headerTitleStyle/headerTintColor/headerStyle‌ای هیچ‌جای این فایل تعریف نشده بود، پس عنوانِ
// هر صفحه‌ای که هدرِ بومیِ پیش‌فرض دارد (یعنی تقریباً همه‌ی صفحات، به‌جز (tabs) و
// select-language) با فونتِ سیستم‌عاملِ گوشی رندر می‌شد، نه Vazirmatn — دقیقاً همان چیزی که
// کارفرما «فونتِ برند نمی‌گیرند» توصیف کرد. راه‌حل یک‌جا و سراسری: چهار خاصیتِ تازه به همان
// screenOptions ریشه اضافه شد؛ چون این تنظیمات روی خودِ <Stack> ریشه است، بدون نیاز به لمسِ
// تک‌تکِ دهها فایلِ صفحه، روی همه‌ی هدرهای بومیِ سراسر اپ یک‌جا اثر می‌گذارد. راست‌به‌چپ‌بودنِ
// جهتِ خودِ فلش/چیدمانِ هدر را React Navigation/react-native-screens خودکار از
// I18nManager.isRTL (که همین فایل، چند خط پایین‌تر، همیشه true تنظیم می‌کند) می‌خواند — نیازی
// به تنظیمِ دستیِ جداگانه‌ای برای آن نبود؛ فقط headerTitleAlign صراحتاً 'center' شد تا در هر دو
// جهت یکسان و پیش‌بینی‌پذیر بماند.
//
// 🆕 به‌روزرسانی (رفع باگِ StatusBar غیرقابل‌اعتماد): <StatusBar style="auto" /> قبلی، رنگِ
// آیکون‌های نوار وضعیت (ساعت/باتری/آنتن) را بر اساسِ حالتِ روشن/تیره‌ی سیستم‌عاملِ گوشی حدس
// می‌زد — نه بر اساسِ رنگِ واقعیِ پس‌زمینه‌ی همان صفحه‌ای که کاربر می‌بیند. چون این اپ هم صفحاتِ
// روشن (اکثرِ صفحاتِ Stack، هدرِ سفید) هم صفحاتِ تیره (۵ تب اصلی، پشتِ ProvinceBar تیره) دارد،
// یک حالتِ واحدِ حدسی برای هر دو هرگز درست نمی‌شد — دقیقاً همان چیزی که به‌صورتِ «آیکون‌های نوار
// وضعیت گاهی دیده نمی‌شوند» توصیف شد. راه‌حل: این‌جا (ریشه، پیش‌فرضِ سراسری) صریحاً `style="dark"`
// شد (آیکون‌های تیره، مناسبِ اکثریتِ صفحاتِ روشن)؛ داخلِ app/(tabs)/_layout.tsx یک
// <StatusBar style="light" /> محلی اضافه شد که فقط وقتی یکی از ۵ تبِ اصلی روی صفحه است این
// پیش‌فرض را override می‌کند (چون آنجا پشتِ ProvinceBarِ تیره قرار دارد) — به‌محضِ رفتن به هر
// صفحه‌ی دیگری، همان پیش‌فرضِ سراسریِ اینجا دوباره اعمال می‌شود.
//
// 🆕 به‌روزرسانی (رفع باگِ سراسری — «نوار پایینِ سیستم‌عاملِ اندروید سفید روی سفید و نامرئی
// است»): app.json از قبل `edgeToEdgeEnabled: true` دارد — یعنی محتوای اپ پشتِ نوار سیستمیِ
// ناوبریِ اندروید (دکمه‌های خانه/بازگشت/میان‌برنامه‌ای، وقتی گوشی در حالتِ ناوبریِ سه‌دکمه‌ای
// است، نه ژست‌محور) هم امتداد پیدا می‌کند؛ بدون تنظیمِ صریح، رنگِ پس‌زمینه/آیکونِ آن نوار به
// پیش‌فرضِ سیستم‌عامل واگذار می‌شود که می‌تواند (بسته به گوشی) سفید-روی-سفید و کاملاً نامرئی از
// آب دربیاید — دقیقاً همان چیزی که گزارش شد. کتابخانه‌ی رسمیِ expo-navigation-bar (بخشی از همان
// خانواده‌ی Expo SDK که بقیه‌ی وابستگی‌های این پروژه هم از آن هستند؛ داخلِ Expo Go هم کار
// می‌کند، نیازی به Dev Client اختصاصی ندارد) دقیقاً برای همین ساخته شده. این افکتِ تازه، یک‌بار
// در mount شدنِ اپ، هم رنگِ پس‌زمینه‌ی آن نوار را روی همان رنگِ برندِ تیره (Colors.heroDark)
// تنظیم می‌کند، هم سبکِ آیکون‌هایش را روی 'light' (روشن/سفید — قابل‌دیدن روی زمینه‌ی تیره).
//
// 🆕 به‌روزرسانی (سیستمِ کنترلِ نسخه‌ی اپ از دیتابیس): افزودنِ <AppVersionProvider> — دقیقاً
// هم‌الگو با نحوه‌ی قرارگیریِ بقیه‌ی Providerهای سراسری (بیرونی‌ترین لایه‌ی ممکن که هنوز به
// زبانِ فعلی دسترسی دارد، چون داخلش LanguageProvider است). AppNavigator اگر status برابر
// 'updateRequired' باشد، به‌جای کلِ Stack فقط <UpdateRequiredScreen /> را رندر می‌کند؛
// <UpdateAvailableModal /> هم دقیقاً هم‌الگو با DisclaimerModal/OfflineBanner همیشه رندر
// می‌شود (خودش داخلی تصمیم می‌گیرد چیزی نشان بدهد یا نه). جزئیاتِ کاملِ منطق و دو سناریوی
// «اجباری»/«اختیاری» در یادداشتِ بالای context/AppVersionContext.tsx.
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { UpdateAvailableModal } from '@/components/UpdateAvailableModal';
import { UpdateRequiredScreen } from '@/components/UpdateRequiredScreen';
import { ConfirmModalProvider } from '@/components/ui/ConfirmModal';
import { ToastProvider } from '@/components/ui/Toast';
import { Colors, Fonts } from '@/constants/theme';
import { AppVersionProvider, useAppVersion } from '@/context/AppVersionContext';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { ProvinceProvider } from '@/context/ProvinceContext';
import { useAudioPlayer } from 'expo-audio';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';

// فارسی و پشتو هر دو راست‌به‌چپ هستند — کل اپ همیشه RTL است، بدون نیاز به سوییچ LTR/RTL.
// این خط باید همین‌جا، بیرون از کامپوننت و در همان لحظه‌ی لود شدن فایل اجرا شود.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export const unstable_settings = {
  anchor: '(tabs)',
};

type PushNotificationData = { type?: string; conversationId?: string };

// جدا شده از RootLayout چون باید داخل <LanguageProvider> رندر شود تا به useLanguage() دسترسی
// داشته باشد (خودِ RootLayout بیرون از Provider است، پس نمی‌تواند مستقیم این hook را صدا بزند).
function AppNavigator() {
  const { isReady: isLanguageReady, hasChosenLanguage } = useLanguage();
  const { status: appVersionStatus } = useAppVersion();
  const router = useRouter();

  // 🆕 صدای ورود — طبق درخواستِ صریحِ کارفرما: یک صدای کوتاه و خوشایند، درست همون لحظه‌ای که
  // اپ برای اولین بار (بعد از اسپلش‌اسکرین) واقعاً روی صفحه میاد — دقیقاً همون حسی که کارفرما
  // از یک اپِ انگلیسیِ دیگه توصیف کرد («صدایی که تو ذهن می‌مونه»، شبیهِ صدای startupِ
  // Netflix/PlayStation و مشابه). فایلِ صدا باید توی assets/sounds/welcome.mp3 باشه (رجوع کنید
  // به راهنمای کاملِ همراهِ این تغییر برای این‌که چه صدایی مناسبه و از کجا تهیه‌اش کنید).
  //
  // چرا useAudioPlayer اینجا، نه توی یه کامپوننتِ جدا: چون باید دقیقاً یک‌بار، در اولین لحظه‌ای
  // که isLanguageReady از false به true تغییر می‌کنه (یعنی همون لحظه‌ی «اسپلش رفت، حالا اپِ
  // واقعی معلومه») پخش بشه — این دقیقاً همون نقطه‌ایه که AppNavigator (همینجا) داره.
  const welcomeSoundPlayer = useAudioPlayer(require('../assets/sounds/welcome.mp3'));

  useEffect(() => {
    if (!isLanguageReady) return;
    try {
      welcomeSoundPlayer.play();
    } catch {
      // اگه فایلِ صدا هنوز اضافه نشده یا پخش به هر دلیلی (مثلاً گوشی در حالتِ بی‌صدا/سکوتِ
      // سیستمی) ممکن نبود، اپ باید کاملاً عادی ادامه بده — یک صدای تزیینیِ نبود، هرگز نباید
      // خودش دلیلِ مشکل بشه.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLanguageReady]);

  useEffect(() => {
    function handleResponse(data: PushNotificationData) {
      if (data.type === 'chat_message' && data.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      }
    }

    // حالتِ ۱: اپ باز است، کاربر روی یک اعلانِ تازه‌رسیده لمس می‌کند.
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleResponse(response.notification.request.content.data as PushNotificationData);
    });

    // حالتِ ۲: اپ با لمسِ اعلان از حالتِ کاملاً بسته باز شده (Cold Start).
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleResponse(response.notification.request.content.data as PushNotificationData);
      }
    });

    return () => subscription.remove();
  }, [router]);

  // رفعِ باگِ سراسریِ «نوار پایینِ اندروید سفید-روی-سفید» — فقط اندروید معنا دارد (iOS/وب چنین
  // نواری ندارند)؛ Platform.OS چک می‌شود تا فراخوانیِ بی‌مصرفِ یک API فقط-اندرویدی روی پلتفرم‌های
  // دیگر رخ ندهد. یک‌بار در mount کافی است — این تنظیمات تا وقتی اپ باز است پابرجا می‌مانند.
  // 🛠️ سخت‌سازیِ اضافه (بازخوردِ کارفرما — «اپ موقعِ بازکردن بلافاصله کرش می‌کرد»): تحلیلِ من
  // اینه که محتمل‌ترین علتِ این کرش همین دو خط بودن — نه یه باگِ منطقی، بلکه یک شکافِ دفاعی.
  // `.catch()` فقط رد-شدنِ Promise رو می‌گیره؛ اگه ماژولِ Native خودِ expo-navigation-bar به هر
  // دلیلی (اولین Buildِ Productionی بود که این وابستگیِ تازه توش بود) درست کامپایل/لینک نشده
  // باشه، خودِ فراخوانیِ `NavigationBar.setBackgroundColorAsync(...)` می‌تونه به‌صورتِ همزمان
  // (Synchronous) خطا پرتاب کنه — قبل از این‌که اصلاً یک Promise برگردونه؛ `.catch()` روی همچین
  // خطایی هیچ اثری نداره، و یک خطای همزمانِ گرفته‌نشده در useEffectِ ریشه‌ی اپ دقیقاً همون
  // کرشِ فوریِ لحظه‌ی بازشدن است. try/catch دورِ خودِ فراخوانی (نه فقط دورِ Promise) این کلاسِ
  // خطا رو هم می‌گیره — این تغییر مستقل از علتِ دقیق، خودش یک سخت‌سازیِ درست برای پروداکشنه.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    try {
      NavigationBar.setBackgroundColorAsync(Colors.heroDark)?.catch(() => {
        // روی برخی پیکربندی‌های Edge-to-Edge این متد ممکن است پشتیبانی نشود (رنگِ پس‌زمینه دیگر
        // معنا ندارد چون محتوای اپ همیشه زیرِ نوار دیده می‌شود)؛ در آن صورت setButtonStyleAsync
        // پایین هنوز مهم‌ترین بخش (دیده‌شدنِ خودِ آیکون‌ها) را حل می‌کند، پس خطای این یکی بی‌ضرر
        // نادیده گرفته می‌شود.
      });
    } catch {
      // ماژولِ Native احتمالاً در دسترس نیست — اپ باید بدونِ این جلوه‌ی تزیینی هم‌چنان کاملاً
      // عادی کار کند، نه این‌که کل اپ کرش کند.
    }
    try {
      NavigationBar.setButtonStyleAsync('light')?.catch(() => {});
    } catch {
      // همان منطقِ بالا.
    }
  }, []);

  // تا وضعیت انتخاب زبان از SecureStore خونده نشده، هیچی رندر نکن — دقیقاً هم‌الگو با شرط
  // fontsLoaded پایین‌تر: جلوگیری از یک فلاش لحظه‌ای که کاربر تازه‌وارد رو اشتباهی یک لحظه
  // وارد تب خانه نشون بده، قبل از این‌که مشخص بشه باید به select-language بره.
  if (!isLanguageReady) {
    return null;
  }

  // 🆕 سیستمِ کنترلِ نسخه‌ی اپ — سناریوی «آپدیتِ اجباری»: اگر force_update در دیتابیس true
  // باشد و نسخه‌ی نصب‌شده قدیمی‌تر از latest_version باشد، به‌جای کل Stack (تب‌ها، هر صفحه‌ی
  // دیگری)، فقط صفحه‌ی مسدودکننده رندر می‌شود — کاربر تا آپدیت نکند، به هیچ بخشِ دیگری از اپ
  // دسترسی ندارد. جزئیاتِ کامل در یادداشتِ بالای context/AppVersionContext.tsx و
  // components/UpdateRequiredScreen.tsx.
  if (appVersionStatus === 'updateRequired') {
    return <UpdateRequiredScreen />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          // رفعِ باگِ سراسریِ «هدرها فونتِ برند نمی‌گیرند» — جزئیاتِ کامل در یادداشتِ بالای فایل.
          headerTitleStyle: { fontFamily: Fonts.bold, fontSize: 17 },
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.textMain,
          headerShadowVisible: true,
        }}>
        <Stack.Protected guard={hasChosenLanguage}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="select-language" options={{ headerShown: false }} />
      </Stack>
      {hasChosenLanguage && <DisclaimerModal />}
      {/* 🆕 سیستمِ کنترلِ نسخه‌ی اپ — سناریوی «آپدیتِ اختیاری»: خودِ کامپوننت اگر
          showSoftPrompt=false باشد چیزی رندر نمی‌کند (return null داخلی)، پس همیشه امن است اینجا
          بدون شرط اضافه رندر شود — دقیقاً هم‌الگو با نحوه‌ی قرارگیریِ DisclaimerModal/
          OfflineBanner. */}
      <UpdateAvailableModal />
      <OfflineBanner />
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Vazirmatn-Regular': require('../assets/fonts/Vazirmatn-Regular.ttf'),
    'Vazirmatn-Bold': require('../assets/fonts/Vazirmatn-Bold.ttf'),
  });

  // تا فونت لود نشده هیچ‌چیز نشون نده — از افتادن لحظه‌ای به فونت سیستم جلوگیری می‌کنه
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmModalProvider>
          <LanguageProvider>
            <AppVersionProvider>
              <AuthProvider>
                <ProvinceProvider>
                  <AppNavigator />
                </ProvinceProvider>
              </AuthProvider>
            </AppVersionProvider>
          </LanguageProvider>
        </ConfirmModalProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}