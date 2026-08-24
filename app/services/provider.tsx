// مسیر فایل: app/services/provider.tsx — معادل /services/provider وب — فاز M04، تسک ۳ + تسک ۵
//
// فرم ثبت/ویرایش پروفایل متخصص: تخصص (الزامی، از جدول پویای service_categories) → آدرس/منطقه
// (الزامی — همین ستون است که تسک ۴ همین فاز، جستجوی دستی شهر/منطقه در app/(tabs)/services.tsx،
// با ILIKE روی آن جستجو می‌کند) → شماره تماس (الزامی) → توضیح کوتاه (اختیاری) → گالری نمونه‌کار
// (اختیاری، حداکثر ۵ عکس). دقیقاً معادل موبایلِ ServiceProviderProfileClient.tsx وب
// (src/app/[lang]/services/provider/ServiceProviderProfileClient.tsx، تسک ۶ فاز ۰۴ وب) و
// دقیقاً هم‌ساختار با app/transport/driver.tsx (فاز M03، تسک ۳) — با سه تفاوت آگاهانه:
//
//   ۱) بدون سوییچ فعال/غیرفعال: طبق متن دقیق تسک ۵ همین فاز («اعلان... بدون سوییچ برای خودِ
//      متخصص») و طبق ستون service_providers.is_active (که فقط پنل ادمین می‌نویسد — بند ۷.۵ سند
//      راهبردی وب)، این فرم فقط isActive را می‌خواند (از getMyServiceProviderProfile) تا اعلان
//      «پروفایل پنهان‌شده» را نشان دهد؛ برخلاف driver.tsx هیچ Switch/handleToggleActive‌ای اینجا
//      وجود ندارد.
//   ۲) بدون ردیابی خودکار موقعیت مکانی: فاز M04 هیچ تسک جداگانه‌ای معادل تسک ۵ فاز M03 ندارد؛
//      این فرم هرگز GPS نمی‌گیرد (نگاه کنید به یادداشت کامل در lib/services/providerProfile.ts).
//   ۳) انتخابگر تخصص یک گرید سفارشی است، نه کامپوننت مشترک CategoryPicker: چون service_categories
//      یک جدول پویاست (نه یک آرایه‌ی کد ثابت با dictKey مثل VEHICLE_TYPES)، هر گزینه نام خودش را
//      مستقیماً از دیتابیس می‌آورد (name_fa/name_ps بر اساس زبان جاری) — دقیقاً همان معماری‌ای که
//      چیپ‌های تخصص در app/(tabs)/services.tsx (تسک ۱ همین فاز) از قبل استفاده می‌کنند، نه
//      معماری dictKey/labels کامپوننت CategoryPicker (که فقط با فایل‌های کد ثابت کار می‌کند).
//      آیکون هر گزینه هم دقیقاً همان منطق کارت فهرست را تکرار می‌کند: عکسِ سفارشیِ آپلودشده در
//      پنل ادمین (icon_source='custom') در اولویت، وگرنه آیکون داخلی (getBuiltinIconComponent).
//
// اعلان «پروفایل پنهان‌شده» (تسک ۵): دقیقاً هم‌الگو با بخش isHiddenByAdmin در
// ServiceProviderProfileClient.tsx وب — فقط در حالت ویرایش و فقط وقتی profile.isActive===false
// بالای فرم نمایش داده می‌شود؛ در غیر این صورت (پروفایل تازه یا پروفایل فعال) همان
// visibleImmediatelyNotice قبلی (که از تسک ۱ فاز M00، هنگام کپی دیکشنری، از قبل نوشته شده بود)
// پایین فرم نمایش داده می‌شود — این دو اعلان هرگز هم‌زمان نمایش داده نمی‌شوند.
//
// جریان عکس دقیقاً هم‌الگو با app/transport/driver.tsx: انتخاب از گالری → فشرده‌سازی فوری سمت
// کلاینت (lib/imageCompression.ts) → پیش‌نمایش محلی؛ آپلود واقعی
// (lib/services/providerProfile.ts :: uploadProviderImages) فقط لحظه‌ی ذخیره‌ی نهایی فرم انجام
// می‌شود. عکس‌های «از قبل موجود» (حالت ویرایش) و عکس‌های «تازه‌ی همین جلسه» هم‌زمان مدیریت
// می‌شوند — دقیقاً همان دو-آرایه‌ای که driver.tsx هم دارد.
//
// هیچ کلید دیکشنری تازه‌ای لازم نبود — dict.services.providerProfile از قبل، از فاز M00 (کپی
// مستقیم از دیکشنری بالغ وب)، کامل بود؛ شامل errors.invalidCategory/invalidAddress/invalidPhone،
// hiddenByAdminNotice، و visibleImmediatelyNotice که تا همین تسک هرگز واقعاً مصرف نشده بودند.
import { LoginRequiredCard } from '@/components/LoginRequiredCard';
import { ProvinceSelectField } from '@/components/province/ProvinceSelectField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { VipUpsellNotice } from '@/components/vip/VipUpsellNotice';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useDictionary } from '@/hooks/useDictionary';
import { compressImage } from '@/lib/imageCompression';
import { pickAndValidateVideo, VideoPickError } from '@/lib/media/videoUpload';
import { normalizeAfghanPhone } from '@/lib/phone';
import { getActiveServiceCategories, ServiceCategory } from '@/lib/services/categories';
import { getBuiltinIconComponent } from '@/lib/services/categoryIcons';
import { getServiceProviderImageUrl } from '@/lib/services/images';
import {
  getMyServiceProviderProfile,
  saveServiceProviderProfile,
  ServicesApiError,
  uploadProviderImages,
  uploadProviderVideo,
} from '@/lib/services/providerProfile';
import { isUserVip } from '@/lib/vip/vipStatus';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_PHOTOS = 5;

export default function ServiceProviderProfileScreen() {
  const dict = useDictionary();
  const formDict = dict.services.providerProfile;
  const errorsDict = formDict.errors as Record<string, string>;
  const { language } = useLanguage();
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { showToast } = useToast();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ آخرین آیتمِ صفحه زیرِ نوار ناوبریِ سیستمیِ اندروید.
  const insets = useSafeAreaInsets();

  // تا وقتی پروفایل فعلی (اگر باشد) و فهرست تخصص‌ها خوانده نشده‌اند، فرم رندر نمی‌شود — تا
  // فیلدها یک‌بار درست پیش‌پر شوند، دقیقاً هم‌الگو با driver.tsx.
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isActive, setIsActive] = useState(true); // تسک ۵ — فقط خواندنی؛ پیش‌فرض true بی‌اثر است چون فقط در isEditMode بررسی می‌شود.

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [serviceCategoryId, setServiceCategoryId] = useState<string | null>(null);
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فیلد الزامی تازه.
  const [province, setProvince] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');

  // عکس‌های از قبل ذخیره‌شده (حالت ویرایش) — مسیر خامِ Storage.
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // عکس‌های تازه‌ی انتخاب‌شده در همین جلسه — URI محلی؛ فقط هنگام ذخیره‌ی فرم آپلود می‌شوند.
  const [newImages, setNewImages] = useState<string[]>([]);
  const [compressingCount, setCompressingCount] = useState(0);
  // 🆕 فاز M09 — یا «از قبل موجود» (مسیرِ خامِ Storage، حالتِ ویرایش) یا «تازه‌ی همین‌جلسه»
  // (URI محلی)، دقیقاً هم‌الگو با تفکیکِ existingImages/newImages بالا.
  const [existingVideoPath, setExistingVideoPath] = useState<string | null>(null);
  const [newVideoUri, setNewVideoUri] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalImages = existingImages.length + newImages.length;

  useEffect(() => {
    getActiveServiceCategories()
      .then(setCategories)
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);

    getMyServiceProviderProfile()
      .then((profile) => {
        if (cancelled) return;
        if (profile) {
          setIsEditMode(true);
          setServiceCategoryId(profile.serviceCategoryId);
          setProvince(profile.province);
          setAddress(profile.address);
          setContactPhone(profile.contactPhone);
          setDescription(profile.description ?? '');
          setExistingImages(profile.images);
          setExistingVideoPath(profile.videoPath);
          setIsActive(profile.isActive);
        } else {
          setContactPhone(user.phoneNumber);
        }
      })
      .catch(() => {
        // شبکه/سرور در دسترس نبود — فرم در «حالت ثبت» با شماره‌ی پیش‌فرض کاربر باز می‌ماند؛
        // کاربر همچنان می‌تواند فرم را پر و ارسال کند (خطای واقعی همان لحظه‌ی ارسال نشان داده
        // می‌شود) — دقیقاً همان الگوی تحمل‌گر driver.tsx.
        if (!cancelled) setContactPhone(user.phoneNumber);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, user]);

  if (!isReady || (user && (loadingProfile || loadingCategories))) {
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

  const categoryLabel = (cat: ServiceCategory) => (language === 'ps' ? cat.namePs : cat.nameFa);
  // 🆕 فاز M09
  const isVip = isUserVip(user.vipExpiresAt);

  const pickVideo = async () => {
    try {
      const picked = await pickAndValidateVideo();
      if (!picked) return;
      setNewVideoUri(picked.uri);
      setExistingVideoPath(null);
    } catch (err) {
      const code = err instanceof VideoPickError ? err.code : 'generic';
      showToast(errorsDict[code] ?? errorsDict.generic, 'error');
    }
  };

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
    if (!serviceCategoryId) errs.category = errorsDict.invalidCategory;
    if (!address.trim()) errs.address = errorsDict.invalidAddress;
    // فاز ۱۰ موبایل — قابلیت «ولایت»: saveServiceProviderProfileAction وب این فیلد را الزامی
    // می‌داند (رجوع کنید به کامنت بالای lib/services/providerProfile.ts).
    if (!province) errs.province = dict.province.fieldError;
    if (!normalizeAfghanPhone(contactPhone)) errs.phone = errorsDict.invalidPhone;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !serviceCategoryId || !province) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      const uploadedPaths = await uploadProviderImages(newImages);
      const normalizedPhone = normalizeAfghanPhone(contactPhone)!; // validate() همین را تضمین کرده

      // 🆕 فاز M09 — سه حالت: عکس/ویدئوی تازه (آپلود می‌شود)، از قبل موجود (همان مسیر دوباره
      // فرستاده می‌شود)، یا کاملاً حذف‌شده (null).
      const videoPath = isVip
        ? newVideoUri
          ? await uploadProviderVideo(newVideoUri)
          : existingVideoPath
        : null;

      await saveServiceProviderProfile({
        serviceCategoryId,
        province,
        address: address.trim(),
        contactPhone: normalizedPhone,
        description: description.trim(),
        imagePaths: [...existingImages, ...uploadedPaths],
        videoPath,
      });

      showToast(isEditMode ? formDict.saveSuccessUpdate : formDict.saveSuccessCreate, 'success');
      router.replace('/(tabs)/services');
    } catch (err) {
      const code = err instanceof ServicesApiError ? err.code : 'generic';
      setSubmitError(errorsDict[code] ?? errorsDict.generic);
    } finally {
      setSubmitting(false);
    }
  };

  // تسک ۵ — فقط در حالت ویرایش معنا دارد (پروفایل تازه هنوز چیزی برای «پنهان‌شدن توسط ادمین»
  // ندارد). این دو اعلان (پنهان‌شده / بلافاصله قابل‌مشاهده) هرگز هم‌زمان نشان داده نمی‌شوند.
  const isHiddenByAdmin = isEditMode && !isActive;

  return (
    <>
      <Stack.Screen options={{ title: formDict.title }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Text style={styles.subtitle}>{formDict.subtitle}</Text>

        {/* تسک ۵ — اعلان «پروفایل توسط ادمین پنهان شده»، بالای فرم؛ بدون هیچ سوییچی برای خودِ
            متخصص (فقط اطلاع‌رسانی). */}
        {isHiddenByAdmin && (
          <Card style={styles.hiddenNoticeCard}>
            <Text style={styles.hiddenNoticeText}>{formDict.hiddenByAdminNotice}</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>{formDict.categorySectionTitle}</Text>
        {categories.length > 0 ? (
          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const CategoryIcon = getBuiltinIconComponent(cat.iconKey);
              const selected = cat.id === serviceCategoryId;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setServiceCategoryId(cat.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    selected && styles.categoryCardSelected,
                    pressed && styles.categoryCardPressed,
                  ]}>
                  <View style={[styles.categoryIconWrap, selected && styles.categoryIconWrapSelected]}>
                    {cat.iconSource === 'custom' && cat.iconUrl ? (
                      <Image
                        source={{ uri: cat.iconUrl }}
                        style={styles.categoryIconImage}
                        contentFit="contain"
                      />
                    ) : (
                      <CategoryIcon size={26} color={selected ? Colors.white : Colors.primary} />
                    )}
                  </View>
                  <Text
                    style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}
                    numberOfLines={2}>
                    {categoryLabel(cat)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.noticeText}>{formDict.categoryEmptyNotice}</Text>
          </Card>
        )}
        {fieldErrors.category && <Text style={styles.fieldError}>{fieldErrors.category}</Text>}

        <Card style={styles.card}>
          <Input
            label={formDict.addressLabel}
            placeholder={formDict.addressPlaceholder}
            value={address}
            onChangeText={setAddress}
            error={fieldErrors.address}
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
          <Input
            label={formDict.descriptionLabel}
            placeholder={formDict.descriptionPlaceholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />
        </Card>

        <Text style={styles.sectionTitle}>{formDict.photosSectionTitle}</Text>
        <Text style={styles.stepHint}>{formDict.photosHint}</Text>
        <View style={styles.photoGrid}>
          {existingImages.map((path) => (
            <View key={`existing-${path}`} style={styles.photoWrap}>
              <Image
                source={{ uri: getServiceProviderImageUrl(path) }}
                style={styles.photo}
                contentFit="cover"
              />
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

        {/* 🆕 فاز M09 — همگام‌سازی با وب، ویدئوی کوتاهِ VIP */}
        <View style={styles.videoSectionDivider}>
          <Text style={styles.sectionTitle}>{formDict.videoSectionTitle}</Text>
        </View>
        {!isVip ? (
          <VipUpsellNotice message={dict.vip.upsell.videoMessage} buttonLabel={dict.vip.upsell.button} />
        ) : newVideoUri || existingVideoPath ? (
          <View style={styles.videoPreviewWrap}>
            <View style={styles.videoPreviewPlaceholder}>
              <Icons.CheckCircle size={22} color={Colors.primary} />
            </View>
            <Pressable
              onPress={() => {
                setNewVideoUri(null);
                setExistingVideoPath(null);
              }}
              accessibilityLabel={formDict.removeVideoLabel}
              style={styles.removeBadge}>
              <Text style={styles.removeBadgeText}>×</Text>
            </Pressable>
          </View>
        ) : (
          <Button title={formDict.addVideoButton} variant="secondary" onPress={pickVideo} />
        )}

        {/* تسک ۵ — وقتی پروفایل پنهان نیست (تازه یا فعال)، همان اعلان قبلیِ «بلافاصله قابل‌مشاهده»
            (از فاز M00) پایین فرم نشان داده می‌شود؛ این دو اعلان هرگز هم‌زمان نیستند. */}
        {!isHiddenByAdmin && (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeText}>{formDict.visibleImmediatelyNotice}</Text>
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  // گرید انتخاب تخصص — دقیقاً هم‌الگو با استایل‌های داخلی CategoryPicker.tsx، چون از همان کامپوننت
  // مشترک استفاده نشد (دلیل کامل در کامنت بالای فایل)؛ برای هم‌ظاهری بصری، مقادیر عیناً کپی شدند.
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    flexBasis: '31%',
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ecfeff',
  },
  categoryCardPressed: {
    opacity: 0.8,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryIconWrapSelected: {
    backgroundColor: Colors.primary,
  },
  categoryIconImage: {
    width: 28,
    height: 28,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.primaryDark,
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
  // 🆕 فاز M09
  videoSectionDivider: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  videoPreviewWrap: {
    width: 140,
    height: 105,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  videoPreviewPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenNoticeCard: {
    backgroundColor: '#fef2f2',
    borderColor: Colors.danger,
  },
  hiddenNoticeText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.danger,
    lineHeight: 20,
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