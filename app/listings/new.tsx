// مسیر فایل: app/listings/new.tsx — معادل /listings/new وب — فاز M02، تسک ۳/۴/۵/۶ (نسخه‌ی واقعی)
//
// چهار گام دقیقاً طبق دیکشنری (dict.marketplace.wizard.step1Title..step4Title) که از قبل آماده
// بود: دسته → عکس‌ها → قیمت/توضیح → مرور نهایی. از کامپوننت مشترک Wizard.tsx (فاز M00B) استفاده
// شده — این فایل فقط محتوای هر گام و منطق را می‌دهد.
//
// «آدرس/شماره پیش‌فرض از پروفایل کاربر» (متن تسک ۳): جدول users فقط phone_number دارد، نه آدرس
// (docs/YAKJA_DATABASE_LOG.md) — پس فقط contactPhone از user.phoneNumber پیش‌فرض می‌گیرد؛
// آدرس چنین مقدار پیش‌فرضی در دیتابیس ندارد، پس خالی می‌ماند (کاربر خودش هر بار می‌نویسد).
//
// «اگر اجازه بدهید، موقعیت مکانی...» (locationNote): چون Wizard.tsx شماره‌ی گام فعلی را به
// والد گزارش نمی‌دهد (کاملاً content-agnostic — نگاه کنید به کامنت خودِ آن فایل)، این صفحه
// موقعیت مکانی را دقیقاً همان لحظه‌ای که handleSubmit صدا زده می‌شود درخواست می‌کند (یعنی همان
// لحظه‌ی لمس دکمه‌ی نهایی در گام ۴) — از نظر کاربر همان رفتار «موقع انتشار» است، بدون نیاز به
// تغییر Wizard.tsx مشترک. کاملاً اختیاری و بی‌صدا: رد دسترسی یا timeout، آگهی را بدون مختصات ثبت
// می‌کند، نه با خطا.
//
// 🔴 اصلاح (ممیزی i18n/RTL فاز M02، تسک ۹): uploadListingImages اکنون مسیرهای خامِ Storage
// برمی‌گرداند (نه URL عمومی)، و createListing این مسیرها را زیر فیلد imagePaths می‌خواهد، نه
// images — دقیقاً هم‌راستا با قرارداد واقعی Route وب. جزئیات کامل در کامنت‌های
// lib/marketplace/mutations.ts.
//
// 🆕 فاز M09 — همگام‌سازی با وب، آپلودِ ویدئوی کوتاهِ VIP: داخلِ همان گامِ ۲ («عکس‌ها»)، بعدِ
// گریدِ عکس‌ها، یک بخشِ جداگانه‌ی ویدئو اضافه شد — دقیقاً همان جایگاهی که NewListingWizard.tsx
// وب هم انتخاب کرده (نه یک گامِ پنجمِ تازه). فقط برای کاربرِ VIP؛ کاربرِ غیر-VIP به‌جایش کارتِ
// دعوت‌به‌عضویت (VipUpsellNotice) می‌بیند. بدونِ فشرده‌سازیِ سمتِ کلاینت (رجوع کنید به یادداشتِ
// کاملِ lib/media/videoUpload.ts).
import { LoginRequiredCard } from '@/components/LoginRequiredCard';
import { ProvinceSelectField } from '@/components/province/ProvinceSelectField';
import { Button } from '@/components/ui/Button';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { Icons } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { Wizard, WizardStep } from '@/components/ui/Wizard';
import { VipUpsellNotice } from '@/components/vip/VipUpsellNotice';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { compressImage } from '@/lib/imageCompression';
import { LISTING_CATEGORIES, ListingCategoryId } from '@/lib/marketplace/categories';
import {
  createListing,
  MarketplaceApiError,
  uploadListingImages,
  uploadListingVideo,
} from '@/lib/marketplace/mutations';
import { pickAndValidateVideo, VideoPickError } from '@/lib/media/videoUpload';
import { normalizeAfghanPhone } from '@/lib/phone';
import { isUserVip } from '@/lib/vip/vipStatus';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const MAX_PHOTOS = 5;
const LOCATION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function NewListingScreen() {
  const dict = useDictionary();
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<ListingCategoryId | null>(null);
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فیلد الزامی تازه، دقیقاً هم‌الگو با category بالا؛
  // بدون این فیلد، createListing (سرور) درخواست را با خطای invalidProvince رد می‌کند.
  const [province, setProvince] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [compressingCount, setCompressingCount] = useState(0);
  // 🆕 فاز M09
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber ?? '');
  const [description, setDescription] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 🆕 فاز M09
  const isVip = isUserVip(user?.vipExpiresAt);

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: dict.marketplace.wizard.title }} />
        <LoginRequiredCard
          title={dict.marketplace.wizard.loginRequiredTitle}
          description={dict.marketplace.wizard.loginRequiredDesc}
          buttonLabel={dict.marketplace.wizard.loginRequiredButton}
        />
      </>
    );
  }

  const addPhotos = async () => {
    const remaining = MAX_PHOTOS - images.length;
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
        setImages((prev) => (prev.length < MAX_PHOTOS ? [...prev, compressed.uri] : prev));
      } catch {
        showToast(dict.marketplace.wizard.errors.compressionFailed, 'error');
      } finally {
        setCompressingCount((c) => c - 1);
      }
    }
  };

  const removeImage = (uri: string) => setImages((prev) => prev.filter((u) => u !== uri));

  // 🆕 فاز M09
  const pickVideo = async () => {
    try {
      const picked = await pickAndValidateVideo();
      if (!picked) return;
      setVideoUri(picked.uri);
    } catch (err) {
      const code = err instanceof VideoPickError ? err.code : 'generic';
      showToast(
        (dict.marketplace.wizard.errors as Record<string, string>)[code] ?? dict.marketplace.wizard.errors.generic,
        'error'
      );
    }
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (title.trim().length === 0) errs.title = dict.marketplace.wizard.errors.invalidTitle;
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      errs.price = dict.marketplace.wizard.errors.invalidPrice;
    }
    if (address.trim().length === 0) errs.address = dict.marketplace.wizard.errors.invalidAddress;
    // فاز ۱۰ موبایل — قابلیت «ولایت»: دقیقاً هم‌الزام با فیلدهای بالا؛ createListingAction وب
    // این فیلد را الزامی می‌داند (رجوع کنید به کامنت بالای lib/marketplace/mutations.ts).
    if (!province) errs.province = dict.province.fieldError;
    if (!normalizeAfghanPhone(contactPhone)) errs.phone = dict.marketplace.wizard.errors.invalidPhone;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isStep3Valid =
    title.trim().length > 0 &&
    price.trim().length > 0 &&
    !Number.isNaN(Number(price)) &&
    Number(price) >= 0 &&
    address.trim().length > 0 &&
    province !== null &&
    normalizeAfghanPhone(contactPhone) !== null;

  const handleSubmit = async () => {
    if (!category || !province || !validateStep3()) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      // موقعیت مکانی: کاملاً اختیاری و بی‌صدا (locationNote) — دقیقاً همان لحظه‌ی لمس دکمه‌ی نهایی.
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await withTimeout(Location.getCurrentPositionAsync({}), LOCATION_TIMEOUT_MS);
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      } catch {
        // بی‌صدا نادیده گرفته می‌شود.
      }

      // 🔴 اصلاح: قبلاً این متغیر imageUrls (URL عمومی) بود و زیر فیلد images به createListing
      // فرستاده می‌شد — سرور همچین فیلدی نمی‌شناخت (یادداشت کامل در mutations.ts). اکنون
      // uploadListingImages مسیر خامِ Storage برمی‌گرداند و دقیقاً زیر فیلد imagePaths می‌رود.
      const imagePaths = await uploadListingImages(images);
      const normalizedPhone = normalizeAfghanPhone(contactPhone)!; // isStep3Valid همین را تضمین کرده

      // 🆕 فاز M09 — فقط اگر کاربر واقعاً VIP است آپلود می‌شود؛ دفاعِ در عمقِ سمتِ کلاینت
      // (سرور هم دوباره همین را بررسی می‌کند).
      const videoPath = isVip && videoUri ? await uploadListingVideo(videoUri) : null;

      await createListing({
        category,
        province: province as string,
        title: title.trim(),
        price: Number(price),
        address: address.trim(),
        contactPhone: normalizedPhone,
        description: description.trim().length > 0 ? description.trim() : null,
        imagePaths,
        videoPath,
        latitude,
        longitude,
      });

      showToast(dict.marketplace.wizard.publishSuccess, 'success');
      router.replace('/listings/my-listings');
    } catch (err) {
      const code = err instanceof MarketplaceApiError ? err.code : 'generic';
      setSubmitError(
        (dict.marketplace.wizard.errors as Record<string, string>)[code] ?? dict.marketplace.wizard.errors.generic
      );
    } finally {
      setSubmitting(false);
    }
  };

  const steps: WizardStep[] = [
    {
      key: 'category',
      isValid: category !== null,
      content: (
        <ScrollView>
          <Text style={styles.stepTitle}>{dict.marketplace.wizard.step1Title}</Text>
          <CategoryPicker
            items={LISTING_CATEGORIES}
            labels={dict.marketplace.categories}
            value={category}
            onChange={setCategory}
          />
        </ScrollView>
      ),
    },
    {
      key: 'photos',
      isValid: images.length >= 1 && images.length <= MAX_PHOTOS && compressingCount === 0,
      content: (
        <ScrollView>
          <Text style={styles.stepTitle}>{dict.marketplace.wizard.step2Title}</Text>
          <Text style={styles.stepHint}>{dict.marketplace.wizard.step2Hint}</Text>
          <View style={styles.photoGrid}>
            {images.map((uri) => (
              <View key={uri} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                <Pressable
                  onPress={() => removeImage(uri)}
                  accessibilityLabel={dict.marketplace.wizard.removePhotoLabel}
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
          {images.length < MAX_PHOTOS && (
            <Button
              title={dict.marketplace.wizard.addPhotoButton}
              variant="secondary"
              onPress={addPhotos}
              style={styles.addPhotoButton}
            />
          )}

          {/* 🆕 فاز M09 — همان گام، بعدِ عکس‌ها؛ دقیقاً هم‌جایگاه با وب. */}
          <View style={styles.videoSectionDivider}>
            <Text style={styles.videoSectionTitle}>{dict.marketplace.wizard.videoTitle}</Text>
          </View>
          {!isVip ? (
            <VipUpsellNotice message={dict.vip.upsell.videoMessage} buttonLabel={dict.vip.upsell.button} />
          ) : videoUri ? (
            <View style={styles.videoPreviewWrap}>
              <View style={styles.videoPreviewPlaceholder}>
                <Icons.CheckCircle size={22} color={Colors.primary} />
              </View>
              <Pressable
                onPress={() => setVideoUri(null)}
                accessibilityLabel={dict.marketplace.wizard.removeVideoLabel}
                style={styles.removeBadge}>
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Button
                title={dict.marketplace.wizard.addVideoButton}
                variant="secondary"
                onPress={pickVideo}
              />
              <Text style={styles.videoTrimNotice}>
                {dict.marketplace.wizard.videoTrimNoticeTemplate.replace('{seconds}', '60')}
              </Text>
            </>
          )}
        </ScrollView>
      ),
    },
    {
      key: 'details',
      isValid: isStep3Valid,
      content: (
        <ScrollView>
          <Text style={styles.stepTitle}>{dict.marketplace.wizard.step3Title}</Text>
          <Input
            label={dict.marketplace.wizard.titleLabel}
            placeholder={dict.marketplace.wizard.titlePlaceholder}
            value={title}
            onChangeText={setTitle}
            error={fieldErrors.title}
          />
          <Input
            label={dict.marketplace.wizard.priceLabel}
            placeholder={dict.marketplace.wizard.pricePlaceholder}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            error={fieldErrors.price}
          />
          <Input
            label={dict.marketplace.wizard.addressLabel}
            placeholder={dict.marketplace.wizard.addressPlaceholder}
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
            label={dict.marketplace.wizard.contactPhoneLabel}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            error={fieldErrors.phone}
          />
          <Input
            label={dict.marketplace.wizard.descriptionLabel}
            placeholder={dict.marketplace.wizard.descriptionPlaceholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />
        </ScrollView>
      ),
    },
    {
      key: 'review',
      content: (
        <ScrollView>
          <Text style={styles.stepTitle}>{dict.marketplace.wizard.step4Title}</Text>
          <Text style={styles.stepHint}>{dict.marketplace.wizard.step4Hint}</Text>

          {images[0] && <Image source={{ uri: images[0] }} style={styles.reviewImage} contentFit="cover" />}
          <Text style={styles.reviewTitle}>{title}</Text>
          <Text style={styles.reviewPrice}>
            {price} {dict.marketplace.detail.currencyLabel}
          </Text>
          <Text style={styles.reviewLine}>{address}</Text>
          {/* رفع باگ TypeScript (ts7053): dict اینجا تایپ کامل دیکشنری است (نه ProvinceDict)،
              پس کلیدهای names دقیق و ثابت‌اند (kabul/kapisa/...)؛ برای ایندکس‌کردن با یک متغیر
              string معمولی (province) باید صراحتاً cast شود — دقیقاً همان رفع باگ مستندشده در
              NewListingWizard.tsx وب (src/app/[lang]/listings/new/NewListingWizard.tsx). */}
          {province && (
            <Text style={styles.reviewLine}>
              {dict.province.names[province as keyof typeof dict.province.names]}
            </Text>
          )}
          <Text style={styles.reviewLine}>{contactPhone}</Text>
          {description.trim().length > 0 && <Text style={styles.reviewLine}>{description}</Text>}

          <Text style={styles.locationNote}>{dict.marketplace.wizard.locationNote}</Text>

          {submitError && <Text style={styles.submitError}>{submitError}</Text>}
        </ScrollView>
      ),
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: dict.marketplace.wizard.title }} />
      <View style={styles.container}>
        <Wizard steps={steps} onSubmit={handleSubmit} submitting={submitting} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
  },
  stepTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  stepHint: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
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
    marginTop: Spacing.md,
  },
  // 🆕 فاز M09
  videoSectionDivider: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  videoSectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  videoPreviewWrap: {
    width: 140,
    height: 105,
    borderRadius: Radii.md,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  videoPreviewPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTrimNotice: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  reviewImage: {
    width: '100%',
    height: 160,
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.border,
  },
  reviewTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  reviewPrice: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  reviewLine: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMain,
    marginBottom: 4,
  },
  locationNote: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  submitError: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.danger,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});