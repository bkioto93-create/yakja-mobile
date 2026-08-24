// مسیر فایل: app/real-estate/new.tsx — معادل /real-estate/new وب — فاز M05، تسک ۳ + تسک ۴
//
// چهار گام دقیقاً طبق دیکشنری (dict.realEstate.wizard.step1Title..step4Title) که از قبل آماده
// بود: نوع ملک → عکس‌ها → قیمت/آدرس/توضیح → مرور نهایی. از کامپوننت مشترک Wizard.tsx (فاز M00B)
// استفاده شده — دقیقاً هم‌الگو با app/listings/new.tsx (فاز M02، «هم‌الگو با کالا» طبق متن دقیق
// همین تسک).
//
// سه تفاوت آگاهانه با ویزارد کالا (چون جدول real_estate ستون title یا contact_phone ندارد —
// docs/YAKJA_DATABASE_LOG.md، تسک ۲ فاز ۰۵):
//   ۱) بدون فیلد «عنوان» و بدون فیلد «شماره تماس» در گام ۳.
//   ۲) گام ۱، علاوه بر نوع ملک (CategoryPicker — چون PROPERTY_TYPES دقیقاً همان شکل
//      {id, dictKey, icon} را دارد که CategoryPicker انتظار دارد، برخلاف service_categories که
//      پویا بود)، نوع معامله (فروش/اجاره) را هم مشخص می‌کند — اما نه همیشه با پرسش جداگانه:
//      دقیقاً طبق نگاشت IMPLIED_DEAL_TYPE پایین (عیناً کپی‌شده از
//      src/app/[lang]/real-estate/new/NewRealEstateWizard.tsx وب)، برای «فروش خانه»/«اجاره
//      خانه»/«فروش زمین»/«باغ» نوع معامله خودکار از روی نوع ملک تعیین می‌شود؛ فقط برای
//      «مغازه»/«سوله»/«سایر» یک پرسش کوتاه («فروش یا اجاره؟») همان‌جا در گام ۱ اضافه می‌شود —
//      بدون گام پنجم جدا، دقیقاً طبق «۴ مرحله»ی متن تسک.
//   ۳) گام ۲ (عکس) حداقل ۱ عکس الزامی دارد (نه اختیاری مثل گالری متخصص فاز M04) — طبق
//      CHECK cardinality(images) between 1 and 5 در ستون real_estate.images.
//
// «اگر اجازه بدهید، موقعیت مکانی...» (locationNote): دقیقاً هم‌الگو با app/listings/new.tsx —
// موقعیت مکانی کاملاً اختیاری و بی‌صدا، فقط همان لحظه‌ی لمس دکمه‌ی نهایی گرفته می‌شود.
//
// «آگهی شما پس از تایید مدیر نمایش داده می‌شود» (publishSuccess): چون real_estate.status پیش‌فرض
// 'pending' است (نه approved) — برخلاف بعضی جدول‌های دیگر، هر آگهی ملک تازه تا تایید مدیر در
// فهرست/جستجوی عمومی دیده نمی‌شود؛ این پیام از قبل، از فاز M00، دقیقاً برای همین منظور نوشته
// شده بود.
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
import { pickAndValidateVideo, VideoPickError } from '@/lib/media/videoUpload';
import { DealTypeId } from '@/lib/realEstate/dealTypes';
import {
  createRealEstateListing,
  RealEstateApiError,
  uploadRealEstateImages,
  uploadRealEstateVideo,
} from '@/lib/realEstate/mutations';
import { PROPERTY_TYPES, PropertyTypeId } from '@/lib/realEstate/propertyTypes';
import { isUserVip } from '@/lib/vip/vipStatus';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const MIN_PHOTOS = 1;
const MAX_PHOTOS = 5;
const LOCATION_TIMEOUT_MS = 8000;

// نوع معامله‌ی ضمنی هر نوع ملک؛ مقدار null یعنی «هم فروشی و هم اجاره‌ای معنا دارد» و باید از
// کاربر جداگانه پرسیده شود — عیناً کپی‌شده از IMPLIED_DEAL_TYPE در NewRealEstateWizard.tsx وب.
const IMPLIED_DEAL_TYPE: Record<PropertyTypeId, DealTypeId | null> = {
  house_sale: 'sale',
  house_rent: 'rent',
  land_sale: 'sale',
  garden: 'sale',
  shop: null,
  warehouse: null,
  other: null,
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function NewRealEstateScreen() {
  const dict = useDictionary();
  const wizardDict = dict.realEstate.wizard;
  const errorsDict = wizardDict.errors as Record<string, string>;
  const propertyTypesDict = dict.realEstate.propertyTypes as Record<string, string>;
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { showToast } = useToast();

  const [propertyType, setPropertyType] = useState<PropertyTypeId | null>(null);
  // فاز ۱۰ موبایل — قابلیت «ولایت»: فیلد الزامی تازه.
  const [province, setProvince] = useState<string | null>(null);
  const [dealType, setDealType] = useState<DealTypeId | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [compressingCount, setCompressingCount] = useState(0);
  // 🆕 فاز M09
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        <Stack.Screen options={{ title: wizardDict.title }} />
        <LoginRequiredCard
          title={wizardDict.loginRequiredTitle}
          description={wizardDict.loginRequiredDesc}
          buttonLabel={wizardDict.loginRequiredButton}
        />
      </>
    );
  }

  const handleSelectPropertyType = (id: PropertyTypeId) => {
    setPropertyType(id);
    setDealType(IMPLIED_DEAL_TYPE[id] ?? null);
  };

  // آیا نوع ملک انتخاب‌شده نیاز به پرسش جداگانه‌ی «فروش یا اجاره؟» دارد؟
  const needsDealTypeQuestion = propertyType !== null && IMPLIED_DEAL_TYPE[propertyType] === null;

  // 🆕 فاز M09
  const isVip = isUserVip(user.vipExpiresAt);

  const pickVideo = async () => {
    try {
      const picked = await pickAndValidateVideo();
      if (!picked) return;
      setVideoUri(picked.uri);
    } catch (err) {
      const code = err instanceof VideoPickError ? err.code : 'generic';
      showToast(errorsDict[code] ?? errorsDict.generic, 'error');
    }
  };

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
        showToast(errorsDict.compressionFailed, 'error');
      } finally {
        setCompressingCount((c) => c - 1);
      }
    }
  };

  const removeImage = (uri: string) => setImages((prev) => prev.filter((u) => u !== uri));

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      errs.price = errorsDict.invalidPrice;
    }
    if (address.trim().length === 0) errs.address = errorsDict.invalidAddress;
    // فاز ۱۰ موبایل — قابلیت «ولایت»: createRealEstateListingAction وب این فیلد را الزامی
    // می‌داند (رجوع کنید به کامنت بالای lib/realEstate/mutations.ts).
    if (!province) errs.province = dict.province.fieldError;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isStep3Valid =
    price.trim().length > 0 &&
    !Number.isNaN(Number(price)) &&
    Number(price) >= 0 &&
    address.trim().length > 0 &&
    province !== null;

  const handleSubmit = async () => {
    if (!propertyType || !dealType || !province || !validateStep3()) return;

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

      const imagePaths = await uploadRealEstateImages(images);

      // 🆕 فاز M09 — فقط اگر کاربر واقعاً VIP است آپلود می‌شود؛ دفاعِ در عمقِ سمتِ کلاینت
      // (سرور هم دوباره همین را بررسی می‌کند).
      const videoPath = isVip && videoUri ? await uploadRealEstateVideo(videoUri) : null;

      await createRealEstateListing({
        propertyType,
        dealType,
        province: province as string,
        price,
        address: address.trim(),
        description: description.trim(),
        imagePaths,
        videoPath,
        latitude,
        longitude,
      });

      showToast(wizardDict.publishSuccess, 'success');
      router.replace('/real-estate');
    } catch (err) {
      const code = err instanceof RealEstateApiError ? err.code : 'generic';
      setSubmitError(errorsDict[code] ?? errorsDict.generic);
    } finally {
      setSubmitting(false);
    }
  };

  const dealTypeOptionLabel = (id: DealTypeId) =>
    id === 'sale' ? wizardDict.dealTypeSale : wizardDict.dealTypeRent;

  const steps: WizardStep[] = [
    {
      key: 'propertyType',
      isValid: propertyType !== null && dealType !== null,
      content: (
        <ScrollView>
          <Text style={styles.stepTitle}>{wizardDict.step1Title}</Text>
          <CategoryPicker
            items={PROPERTY_TYPES}
            labels={propertyTypesDict}
            value={propertyType}
            onChange={handleSelectPropertyType}
          />

          {needsDealTypeQuestion && (
            <View style={styles.dealTypeQuestionWrap}>
              <Text style={styles.dealTypeQuestion}>{wizardDict.dealTypeQuestion}</Text>
              <View style={styles.dealTypeOptionsRow}>
                {(['sale', 'rent'] as DealTypeId[]).map((option) => {
                  const selected = dealType === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setDealType(option)}
                      style={[styles.dealTypeOption, selected && styles.dealTypeOptionSelected]}>
                      <Text
                        style={[
                          styles.dealTypeOptionText,
                          selected && styles.dealTypeOptionTextSelected,
                        ]}>
                        {dealTypeOptionLabel(option)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      ),
    },
    {
      key: 'photos',
      isValid: images.length >= MIN_PHOTOS && images.length <= MAX_PHOTOS && compressingCount === 0,
      content: (
        <ScrollView>
          <Text style={styles.stepTitle}>{wizardDict.step2Title}</Text>
          <Text style={styles.stepHint}>{wizardDict.step2Hint}</Text>
          <View style={styles.photoGrid}>
            {images.map((uri) => (
              <View key={uri} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                <Pressable
                  onPress={() => removeImage(uri)}
                  accessibilityLabel={wizardDict.removePhotoLabel}
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
              title={wizardDict.addPhotoButton}
              variant="secondary"
              onPress={addPhotos}
              style={styles.addPhotoButton}
            />
          )}

          {/* 🆕 فاز M09 — همان گام، بعدِ عکس‌ها؛ دقیقاً هم‌جایگاه با وب. */}
          <View style={styles.videoSectionDivider}>
            <Text style={styles.videoSectionTitle}>{wizardDict.videoTitle}</Text>
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
                accessibilityLabel={wizardDict.removeVideoLabel}
                style={styles.removeBadge}>
                <Text style={styles.removeBadgeText}>×</Text>
              </Pressable>
            </View>
          ) : (
            <Button title={wizardDict.addVideoButton} variant="secondary" onPress={pickVideo} />
          )}
        </ScrollView>
      ),
    },
    {
      key: 'details',
      isValid: isStep3Valid,
      content: (
        <ScrollView>
          <Text style={styles.stepTitle}>{wizardDict.step3Title}</Text>
          <Input
            label={wizardDict.priceLabel}
            placeholder={wizardDict.pricePlaceholder}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            error={fieldErrors.price}
          />
          <Input
            label={wizardDict.addressLabel}
            placeholder={wizardDict.addressPlaceholder}
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
            label={wizardDict.descriptionLabel}
            placeholder={wizardDict.descriptionPlaceholder}
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
          <Text style={styles.stepTitle}>{wizardDict.step4Title}</Text>
          <Text style={styles.stepHint}>{wizardDict.step4Hint}</Text>

          {images[0] && <Image source={{ uri: images[0] }} style={styles.reviewImage} contentFit="cover" />}
          <Text style={styles.reviewTitle}>
            {propertyType && propertyTypesDict[PROPERTY_TYPES.find((p) => p.id === propertyType)!.dictKey]}
            {dealType && ` · ${dealTypeOptionLabel(dealType)}`}
          </Text>
          <Text style={styles.reviewPrice}>
            {price} {dict.realEstate.detail.currencyLabel}
          </Text>
          <Text style={styles.reviewLine}>{address}</Text>
          {/* رفع باگ TypeScript (ts7053): دقیقاً همان دلیل/رفع app/listings/new.tsx — cast صریح
              به keyof typeof dict.province.names لازم است، وگرنه TypeScript ایندکس‌کردن با یک
              متغیر string معمولی را رد می‌کند. */}
          {province && (
            <Text style={styles.reviewLine}>
              {dict.province.names[province as keyof typeof dict.province.names]}
            </Text>
          )}
          {description.trim().length > 0 && <Text style={styles.reviewLine}>{description}</Text>}

          <Text style={styles.locationNote}>{wizardDict.locationNote}</Text>

          {submitError && <Text style={styles.submitError}>{submitError}</Text>}
        </ScrollView>
      ),
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: wizardDict.title }} />
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
    textAlign: 'center',
  },
  stepHint: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  dealTypeQuestionWrap: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  dealTypeQuestion: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  dealTypeOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dealTypeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  dealTypeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ecfeff',
  },
  dealTypeOptionText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  dealTypeOptionTextSelected: {
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