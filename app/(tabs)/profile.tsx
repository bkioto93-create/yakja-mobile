// مسیر فایل: app/(tabs)/profile.tsx — معادل /profile وب — فاز M01، تسک ۱۰ (نسخه‌ی واقعی)
//
// دو حالت اصلی، دقیقاً هم‌رفتار با صفحه‌ی وب (که خودش هم بر اساس getCurrentUser() یکی از این دو
// حالت را رندر می‌کند):
//   ۱. کاربر مهمان (user === null، بعد از isReady شدن AuthContext): کارت دعوت‌به‌ورود
//      (dict.profile.guestTitle/guestDesc/loginButton) → می‌رود به app/auth/login.tsx.
//   ۲. کاربر واردشده: شماره‌موبایل (+نشان مدیر در صورت role==='admin') + سوییچ زبان + خروج.
// طبق تسک ۱۱ («کاربر مهمان می‌تواند آزادانه در هر ۴ ماژول بگردد»)، ورود هرگز برای *دیدن* همین
// صفحه اجباری نیست — فقط دکمه‌های خاص (خروج) برای کاربر مهمان اصلاً رندر نمی‌شوند.
//
// سوییچ زبان مستقیم همین‌جا (نه با push به app/select-language.tsx) پیاده شد — چون دیکشنری
// (dict.profile.languageTitle/Desc/languageFa/languagePs) دقیقاً برای یک سوییچر درون‌خطی طراحی
// شده (برخلاف select-language.tsx که تمام‌صفحه و بدون‌دیکشنری است، مخصوص اولین‌اجرا). با هر
// تغییر، هم LanguageContext محلی فوراً و بدون شبکه به‌روز می‌شود، هم — طبق رفتار مستندشده‌ی
// PATCH /api/mobile/v1/profile (بخش الف، تسک ۴) — یک تماس پس‌زمینه‌ی fire-and-forget برای
// هم‌گام‌سازی ستون users.language ارسال می‌شود؛ آن Route صراحتاً برای کاربر مهمان هم بدون خطا
// (فقط بدون ذخیره) موفق برمی‌گردد، پس این تماس هرگز به شرط لاگین‌بودن نیاز ندارد.
//
// طبق تصمیم مستندشده‌ی بند ۱.۲ سند راهبردی موبایل («پنل مدیریت خارج از محدوده‌ی این فاز؛ مدیریت
// همچنان از مرورگر انجام می‌شود»)، کلید دیکشنریِ dict.profile.adminPanelLink عمداً اینجا استفاده
// نشده — فقط نشان «مدیر سیستم» (dict.profile.roleAdmin) بدون هیچ لینکی نمایش داده می‌شود.
import { AddStorySection } from '@/components/AddStorySection';
import { AdminSupportChatEntry } from '@/components/chat/AdminSupportChatEntry';
import { FollowStats } from '@/components/follows/FollowStats';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { VipBadge } from '@/components/vip/VipBadge';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAppVersion } from '@/context/AppVersionContext';
import { useAuth } from '@/context/AuthContext';
import { Language, useLanguage } from '@/context/LanguageContext';
import { useDictionary } from '@/hooks/useDictionary';
import { ContactInfo, getContactInfo } from '@/lib/contactInfo/api';
import { FollowState, getFollowState } from '@/lib/follows/api';
import { apiFetch } from '@/lib/session';
import { getProfilePhotoUrl } from '@/lib/users/profilePhotoUrl';
import { isUserVip } from '@/lib/vip/vipStatus';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// 🛠️ رفعِ باگ (بازخوردِ کارفرما — «شماره‌ی تماس برعکس نوشته می‌شه»): استایلِ writingDirection:
// 'ltr' که قبلاً روی این متن‌ها بود، به‌تنهایی روی اندروید کافی نبود. علتِ ریشه‌ای این است:
// «+93 78 663 3322» چند گروهِ عددی با فاصله است؛ خودِ ارقام همیشه چپ‌به‌راست خوانده می‌شوند،
// ولی وقتی این متن داخلِ یک پاراگرافِ کلاً راست‌به‌چپ قرار می‌گیرد، الگوریتمِ استانداردِ
// دوجهته‌نویسیِ یونیکد (Bidi Algorithm) *ترتیبِ خودِ گروه‌ها* را برعکس می‌کند — یعنی هر گروه
// داخلی درست می‌ماند، ولی گروه‌ها کنارِ هم برعکس چیده می‌شوند؛ دقیقاً همان چیزی که «برعکس نوشته
// می‌شه» توصیف شد. راه‌حلِ قابل‌اعتماد (نه فقط یک استایل که پشتیبانی‌اش ناقص است): پیچیدنِ متن
// در نویسه‌های ایزوله‌سازیِ جهتِ رسمیِ یونیکد (LRI…PDI) — این به الگوریتمِ Bidi صریحاً می‌گوید
// «هرچه داخلِ این محدوده است، قطعاً و بدون‌قید‌وشرط چپ‌به‌راست است»، فارغ از این‌که خودِ
// پلتفرم چه پشتیبانیِ استایلی داشته باشد.
function forceLtr(text: string): string {
  return `\u2066${text}\u2069`;
}

export default function ProfileScreen() {
  const dict = useDictionary();
  const { language, setLanguage } = useLanguage();
  const { user, isReady, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  // 🆕 سیستمِ کنترلِ نسخه‌ی اپ — همان state سراسری که app/_layout.tsx برای مودال/صفحه‌ی
  // مسدودکننده استفاده می‌کند؛ اینجا فقط برای نمایشِ وضعیت خوانده می‌شود (بدونِ در نظر گرفتنِ
  // این‌که کاربر مودالِ نرم را قبلاً رد کرده یا نه — طبق درخواستِ صریحِ کارفرما، این بخش همیشه
  // باید وضعیتِ واقعی را نشان بدهد، فارغ از این‌که پاپ‌آپ را دیده/ردکرده یا نه).
  const { status: appVersionStatus, currentVersion, downloadUrl } = useAppVersion();

  // 🆕 فاز M09 — همگام‌سازی با وب: کارتِ تماس دیگر از دیکشنریِ ایستا نمی‌خواند، بلکه اطلاعاتِ
  // زنده‌ی پنلِ ادمین («اطلاعاتِ یکجا») را می‌گیرد. مقدارِ اولیه‌ی state مستقیماً همان فال‌بکِ
  // دیکشنری است (نه null) — یعنی کارت از همان اولین رندر با متنِ درست (فقط شاید قدیمی‌تر) نشان
  // داده می‌شود، بدون هیچ فلشِ خالی؛ به‌محضِ رسیدنِ پاسخِ واقعی، جایگزین می‌شود.
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    whatsappNumber: '',
    phoneNumbers: [dict.contact.phoneVal],
    address: dict.contact.addressVal,
    extraInfo: '',
    primaryPhone: dict.contact.phoneVal,
  });

  useEffect(() => {
    let cancelled = false;
    getContactInfo({ phone: dict.contact.phoneVal, address: dict.contact.addressVal }).then((info) => {
      if (!cancelled) setContactInfo(info);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🆕 فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن»: شمارشِ دنبال‌کنندگان/دنبال‌شوندگانِ
  // خودِ کاربر، فقط برای نمایشِ FollowStats زیرِ کارتِ هویت — بدون هیچ دکمه‌ی فالو (فالوکردنِ
  // خود بی‌معناست، دقیقاً هم‌قاعده‌ی وب که همان‌جا هم FollowButton را کاملاً حذف می‌کند، نه فقط
  // غیرفعال). همان Route ترکیبیِ follow-state با شناسه‌ی خودِ کاربر صدا زده می‌شود —
  // isFollowing/isFollowedBy همیشه false برمی‌گردند (getFollowState وب: «اگر viewerId===targetId
  // باشد، همیشه false/false»)، که اینجا هم بی‌ضرر و نادیده گرفته می‌شوند.
  const [ownFollowState, setOwnFollowState] = useState<FollowState | null>(null);

  useEffect(() => {
    if (!user) {
      setOwnFollowState(null);
      return;
    }
    getFollowState(user.id).then(setOwnFollowState).catch(() => {});
  }, [user]);

  const changeLanguage = (lang: Language) => {
    if (lang === language) return;
    setLanguage(lang);
    // پس‌زمینه، بدون انتظار — خطای احتمالی شبکه نباید UI سوییچ زبان (که محلی و فوری است) را
    // مسدود کند. اگر این تماس شکست بخورد، ستون دیتابیس فقط تا تماس موفق بعدی هم‌گام نمی‌شود؛
    // تجربه‌ی خودِ اپ (که از LanguageContext محلی می‌خواند) بدون تغییر و فوری باقی می‌ماند.
    apiFetch('/api/mobile/v1/profile', {
      method: 'PATCH',
      body: JSON.stringify({ language: lang }),
    }).catch(() => {});
  };

  const handleLogout = async () => {
    await logout();
    showToast(dict.common.success, 'success');
  };

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>{dict.profile.title}</Text>

      {user ? (
        <Card style={styles.card}>
          <View style={styles.identityHeaderRow}>
            {/* 🆕 فاز M09 — همگام‌سازی با وب: آواتارِ کوچکِ کارتِ هویت، دقیقاً هم‌الگو با
                UserStoryAvatar وب: فقط عکسِ *تاییدشده* نشان داده می‌شود (همان چیزی که بازدیدکننده‌ی
                دیگری هم می‌بیند)؛ عکسِ در-انتظار/ردشده فقط داخلِ کارتِ ProfilePhotoUploader پایین
                (که برای مدیریتِ خودِ کاربر است) دیده می‌شود. اگر هنوز عکسِ تاییدشده‌ای نیست، همان
                آیکونِ ساده‌ی قبلی. */}
            <View style={styles.miniAvatarWrap}>
              {user.photoStatus === 'approved' && user.photoPath ? (
                <Image
                  source={{ uri: getProfilePhotoUrl(user.photoPath) }}
                  style={styles.miniAvatarImage}
                  contentFit="cover"
                />
              ) : (
                <Icons.User size={20} color={Colors.primary} />
              )}
            </View>
            <View style={styles.identityTextCol}>
              <Text style={styles.cardLabel}>{dict.profile.phoneLabel}</Text>
              <View style={styles.identityRow}>
                <Text style={styles.phoneValue}>{user.phoneNumber}</Text>
                {/* **افزوده‌شده (قابلیت VIP):** تیکِ VIP کنارِ شماره، دقیقاً هم‌جا با وب. */}
                {isUserVip(user.vipExpiresAt) && <VipBadge label={dict.vip.badgeLabel} />}
              </View>
              {user.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>{dict.profile.roleAdmin}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 🆕 فاز M09 — شمارشِ دنبال‌کنندگان/دنبال‌شوندگانِ خودِ کاربر، بدون دکمه‌ی فالو. */}
          {ownFollowState && (
            <View style={styles.followStatsWrap}>
              <FollowStats
                userId={user.id}
                followersCount={ownFollowState.followersCount}
                followingCount={ownFollowState.followingCount}
                followersLabel={dict.follows.followersLabel}
                followingLabel={dict.follows.followingLabel}
              />
            </View>
          )}
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.guestTitle}>{dict.profile.guestTitle}</Text>
          <Text style={styles.cardDesc}>{dict.profile.guestDesc}</Text>
          <Button
            title={dict.profile.loginButton}
            onPress={() => router.push('/auth/login')}
            style={styles.loginButton}
          />
        </Card>
      )}

      {/* 🆕 عکسِ پروفایل (فاز M09 — همگام‌سازی با وب) — کارتِ مستقل، فقط برای کاربرِ واردشده؛
          خودِ کامپوننت اگر user=null باشد چیزی رندر نمی‌کند، پس شرطِ user && اینجا لازم نیست. */}
      <ProfilePhotoUploader />

      {/* **افزوده‌شده (قابلیت VIP):** برای کاربرِ VIP نیست، یک کارتِ ترغیب‌کننده به صفحه‌ی
          خرید؛ برای کاربرِ VIP، اینجا چیزی تکراری نشان داده نمی‌شود (وضعیتش همین بالا، کنار
          شماره، مشخص است). مهمان اصلاً این کارت را نمی‌بیند — عضویتِ VIP نیازمندِ ورود است. */}
      {user && !isUserVip(user.vipExpiresAt) && (
        <Card style={styles.vipUpsellCard}>
          <View style={styles.vipUpsellIconWrap}>
            <Icons.CheckCircle size={20} color="#fff" />
          </View>
          <View style={styles.vipUpsellTextCol}>
            <Text style={styles.vipUpsellTitle}>{dict.vip.profileUpsellTitle}</Text>
            <Text style={styles.vipUpsellDesc}>{dict.vip.profileUpsellDesc}</Text>
          </View>
          <Button
            title={dict.vip.upsell.button}
            onPress={() => router.push('/vip')}
            style={styles.vipUpsellButton}
          />
        </Card>
      )}

      {/* **افزوده‌شده (قابلیت استوری — بخش نوشتن):** معادلِ موبایلِ AddStorySection وب. فقط
          برای کاربرِ واردشده — دقیقاً هم‌رفتار با کارتِ هویتِ بالا. */}
      {user && <AddStorySection />}

      {/* **افزوده‌شده (قابلیت چت):** لینکِ ورود به فهرستِ گفتگوها — فقط برای کاربرِ واردشده،
          دقیقاً هم‌رفتار با بقیه‌ی کارت‌های این صفحه. */}
      {user && (
        <Pressable onPress={() => router.push('/chat')} style={({ pressed }) => pressed && styles.pressed}>
          <Card style={styles.chatLinkCard}>
            <View style={styles.chatLinkIconWrap}>
              <Icons.MessageSquare size={18} color={Colors.primary} />
            </View>
            <Text style={styles.chatLinkText}>{dict.chat.myChatsLink}</Text>
            <Icons.ChevronBack size={18} color={Colors.textMuted} />
          </Card>
        </Pressable>
      )}

      {/* **افزوده‌شده (چت با پشتیبانی):** برخلاف بقیه‌ی کارت‌های این صفحه، برای کاربرِ مهمان هم
          نمایش داده می‌شود — خودِ کامپوننت او را به صفحه‌ی ورود می‌برد، دقیقاً هم‌رفتار با وب. */}
      <AdminSupportChatEntry
        viewerId={user?.id ?? null}
        variant="card"
        dict={dict.chat.adminSupport}
      />

      <Card style={styles.card}>
        <Text style={styles.cardLabel}>{dict.profile.languageTitle}</Text>
        <Text style={styles.cardDesc}>{dict.profile.languageDesc}</Text>
        <View style={styles.languageRow}>
          <Button
            title={dict.profile.languageFa}
            variant={language === 'fa' ? 'primary' : 'secondary'}
            onPress={() => changeLanguage('fa')}
            style={styles.languageChip}
          />
          <Button
            title={dict.profile.languagePs}
            variant={language === 'ps' ? 'primary' : 'secondary'}
            onPress={() => changeLanguage('ps')}
            style={styles.languageChip}
          />
        </View>
      </Card>

      {user && (
        <Button
          title={dict.profile.logout}
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      )}

      {/* 🆕 سیستمِ کنترلِ نسخه‌ی اپ — بخشِ «نسخه‌ی برنامه»: طبق درخواستِ صریحِ کارفرما، برای هم
          کاربرِ مهمان هم واردشده نمایش داده می‌شود (بیرونِ هر شرطِ user &&)، چون این اطلاعات
          سراسری/اپ‌محور است، نه کاربرمحور. همیشه وضعیتِ واقعی نشان می‌دهد، حتی اگر پاپ‌آپِ نرم
          قبلاً رد شده باشد — جزئیاتِ کامل در یادداشتِ بالای useAppVersion() بالای فایل. */}
      <Card style={styles.versionCard}>
        <View style={styles.versionCardHeader}>
          <View style={styles.versionIconWrap}>
            <Icons.Download size={18} color={Colors.primary} />
          </View>
          <View style={styles.versionCardTextCol}>
            <Text style={styles.versionCardTitle}>{dict.appUpdate.profileSectionTitle}</Text>
            <Text style={styles.versionCardCurrent}>
              {dict.appUpdate.currentVersionLabel}: {currentVersion}
            </Text>
          </View>
        </View>

        {appVersionStatus === 'updateAvailable' || appVersionStatus === 'updateRequired' ? (
          <>
            <Text style={styles.versionStatusOutdated}>{dict.appUpdate.outdatedStatus}</Text>
            <Button
              title={dict.appUpdate.outdatedButton}
              variant="secondary"
              onPress={() => Linking.openURL(downloadUrl)}
            />
          </>
        ) : appVersionStatus === 'upToDate' ? (
          <View style={styles.versionStatusRow}>
            <Icons.CheckCircle size={16} color={Colors.success} />
            <Text style={styles.versionStatusUpToDate}>{dict.appUpdate.upToDateStatus}</Text>
          </View>
        ) : null}
      </Card>

      {/* 🆕 اطلاعاتِ تماس — معادلِ موبایلیِ بخشِ تماسِ فوترِ وب (src/components/Footer.tsx) +
          صفحه‌ی «تماس با ما»ی وب (src/app/[lang]/contact/page.tsx):
          طبق درخواستِ صریحِ کارفرما («اپ فوتر نمی‌خواد، ولی یه سری اطلاعات قطعاً باید باشه، مثل
          شماره تماس»)، به‌جای یک فوترِ کامل (که برای اپ موبایل معنا ندارد)، همین اطلاعات
          به‌صورتِ یک کارتِ مستقل و همیشه در دسترس در تبِ پروفایل آمد.
          🛠️ فاز M09 — همگام‌سازی با وب: قبلاً این کارت مستقیم از دیکشنریِ ایستا می‌خواند؛ حالا
          دقیقاً هم‌محتوا با صفحه‌ی «تماس با ما»ی وب است — شماره(های) تماسِ چندتایی، کادرِ
          واتساپ (فقط اگر ادمین پر کرده باشد)، و توضیحاتِ تکمیلی (فقط اگر ادمین پر کرده باشد)،
          همگی از contactInfo (بالا) که زنده از پنلِ ادمین می‌آید. برای هر کاربری (مهمان یا
          واردشده) نمایش داده می‌شود، بیرون از هر شرطِ user &&، چون این اطلاعات کاملاً اپ‌محور
          است، نه کاربرمحور. */}
      <Card style={styles.contactCard}>
        <Text style={styles.contactCardTitle}>{dict.contact.title}</Text>
        <View style={styles.contactSectionDivider}>
          <Text style={styles.contactSectionTitle}>{dict.contact.sectionTitle}</Text>
          <View style={styles.contactSectionLine} />
        </View>

        {/* شماره(های) تماس — اگر ادمین بیش از یک شماره در پنل ذخیره کرده باشد، هرکدام ردیفِ
            جدای خودش را می‌گیرد؛ دقیقاً هم‌رفتار با contactInfo.phoneNumbers.map وب. */}
        {contactInfo.phoneNumbers.map((phoneNumber, index) => (
          <Pressable
            key={phoneNumber + index}
            onPress={() => Linking.openURL(`tel:${phoneNumber.replace(/\s/g, '')}`)}
            style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}>
            <View style={styles.contactIconWrap}>
              <Icons.Phone size={16} color={Colors.primary} />
            </View>
            <View style={styles.contactTextCol}>
              <Text style={styles.contactLabel}>
                {contactInfo.phoneNumbers.length > 1
                  ? `${dict.contact.phoneLabel} ${index + 1}`
                  : dict.contact.phoneLabel}
              </Text>
              <Text style={[styles.contactValue, styles.ltrText]}>{forceLtr(phoneNumber)}</Text>
            </View>
          </Pressable>
        ))}

        {/* کادرِ واتساپ — فقط اگر ادمین شماره‌ی واتساپ را از پنل «اطلاعاتِ یکجا» پر کرده باشد. */}
        {!!contactInfo.whatsappNumber && (
          <Pressable
            onPress={() =>
              Linking.openURL(`https://wa.me/${contactInfo.whatsappNumber.replace(/[^0-9]/g, '')}`)
            }
            style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}>
            <View style={[styles.contactIconWrap, styles.whatsappIconWrap]}>
              <Icons.Whatsapp size={16} color={Colors.success} />
            </View>
            <View style={styles.contactTextCol}>
              <Text style={styles.contactLabel}>{dict.contact.whatsappLabel}</Text>
              <Text style={[styles.contactValue, styles.ltrText]}>
                {forceLtr(contactInfo.whatsappNumber)}
              </Text>
            </View>
          </Pressable>
        )}

        <View style={styles.contactRow}>
          <View style={styles.contactIconWrap}>
            <Icons.MapPin size={16} color={Colors.primary} />
          </View>
          <View style={styles.contactTextCol}>
            <Text style={styles.contactLabel}>{dict.contact.addressLabel}</Text>
            <Text style={[styles.contactValue, styles.contactValueMultiline]}>
              {contactInfo.address}
            </Text>
          </View>
        </View>

        {/* توضیحاتِ تکمیلی — فقط اگر ادمین از پنل «اطلاعاتِ یکجا» چیزی برایش نوشته باشد. */}
        {!!contactInfo.extraInfo && (
          <View style={styles.contactRow}>
            <View style={styles.contactIconWrap}>
              <Icons.InfoCircle size={16} color={Colors.primary} />
            </View>
            <View style={styles.contactTextCol}>
              <Text style={styles.contactLabel}>{dict.contact.extraInfoLabel}</Text>
              <Text style={[styles.contactValue, styles.contactValueMultiline]}>
                {contactInfo.extraInfo}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => Linking.openURL(`https://${dict.contact.domainVal}`)}
          style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}>
          <View style={styles.contactIconWrap}>
            <Icons.Globe size={16} color={Colors.primary} />
          </View>
          <View style={styles.contactTextCol}>
            <Text style={styles.contactLabel}>{dict.contact.domainLabel}</Text>
            <Text style={[styles.contactValue, styles.ltrText]}>
              {forceLtr(dict.contact.domainVal)}
            </Text>
          </View>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginBottom: Spacing.xs,
  },
  card: {
    gap: Spacing.sm,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 21,
  },
  phoneValue: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  // 🆕 فاز M09 — ردیفِ آواتارِ کوچک + متنِ هویت، کنارِ هم؛ جایگزینِ چیدمانِ عمودیِ قبلی که فقط
  // متن داشت.
  identityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  identityTextCol: {
    flex: 1,
    gap: Spacing.xs,
  },
  miniAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniAvatarImage: {
    width: '100%',
    height: '100%',
  },
  // 🆕 فاز M09 — فاصله‌ی بالای ردیفِ FollowStats، زیرِ ردیفِ هویت (تلفن/VIP/ادمین) داخلِ همان
  // کارت؛ این استایل قبلاً در JSX استفاده می‌شد ولی این تعریف جا افتاده بود.
  followStatsWrap: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  chatLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chatLinkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatLinkText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  // --- کارتِ ترغیب به VIP (فقط برای کاربرِ غیرِ VIP) ---
  vipUpsellCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  vipUpsellIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipUpsellTextCol: {
    flex: 1,
    minWidth: 0,
  },
  vipUpsellTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#92400e',
  },
  vipUpsellDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#b45309',
    marginTop: 1,
  },
  vipUpsellButton: {
    minHeight: 38,
    paddingHorizontal: Spacing.md,
  },
  guestTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  loginButton: {
    marginTop: Spacing.xs,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginTop: Spacing.xs,
  },
  adminBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  languageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  languageChip: {
    flex: 1,
  },
  logoutButton: {
    marginTop: Spacing.sm,
  },
  // 🆕 سیستمِ کنترلِ نسخه‌ی اپ — بخشِ «نسخه‌ی برنامه».
  versionCard: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  versionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  versionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionCardTextCol: {
    flex: 1,
    minWidth: 0,
  },
  versionCardTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  versionCardCurrent: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  versionStatusOutdated: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.accent,
  },
  versionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  versionStatusUpToDate: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.success,
  },
  // 🆕 اطلاعاتِ تماس — معادلِ موبایلیِ بخشِ تماسِ فوترِ وب.
  contactCard: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  contactCardTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginBottom: Spacing.xs,
  },
  // 🆕 فاز M09 — تیترِ کوچکِ «اطلاعات و تماس یکجا» بالای کادرهای زیرین، معادلِ همان تیترِ
  // میان‌بخشیِ صفحه‌ی «تماس با ما»ی وب.
  contactSectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  contactSectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  contactSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
  },
  contactRowPressed: {
    backgroundColor: Colors.bgBase,
  },
  contactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 🆕 فاز M09 — ته‌رنگِ سبزِ متفاوت برای آیکونِ واتساپ، دقیقاً هم‌الگو با کادرِ واتساپِ وب
  // (bg-emerald-500/10)، تا از بقیه‌ی ردیف‌های فیروزه‌ای متمایز باشد.
  whatsappIconWrap: {
    backgroundColor: 'rgba(34,197,94,0.10)',
  },
  contactTextCol: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  contactValue: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginTop: 1,
  },
  // 🆕 فاز M09 — آدرس/توضیحاتِ تکمیلی می‌توانند چندخطی باشند (برخلافِ شماره/دامنه)؛
  // lineHeight اضافه‌شده برای خوانایی، بدونِ محدودیتِ numberOfLines.
  contactValueMultiline: {
    lineHeight: 19,
  },
  // اعداد/دامنه‌های لاتین همیشه چپ‌به‌راست بمانند، حتی داخلِ چیدمانِ کلیِ راست‌به‌چپِ اپ —
  // معادلِ RN برای dir="ltr" وب (که خودِ Text در React Native پشتیبانی نمی‌کند).
  ltrText: {
    writingDirection: 'ltr',
  },
});