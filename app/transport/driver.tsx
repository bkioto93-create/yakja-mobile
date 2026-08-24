// مسیر فایل: app/transport/driver.tsx — معادل /transport/driver وب
//
// 🛠️ بازطراحیِ کامل (فاز M09 — همگام‌سازی با وب): این فایل باگِ مستندشده‌ی مدت‌ها پیش را رفع
// می‌کند («سیستم عکسِ آرایه‌ای قدیمی با Route واقعیِ وب هماهنگ نیست») + دو فیچرِ تازه‌ی وب را
// اضافه می‌کند:
//   ۱) عکس‌ها: «حداکثر ۵ عکسِ عمومی» با دو اسلاتِ معنادار جایگزین شد — عکسِ خودِ راننده
//      (personalPhoto، الزامی) و عکسِ وسیله (vehiclePhoto، اختیاری)، دقیقاً هم‌الگو با
//      DriverProfileClient.tsx وب. هر اسلات هم می‌تواند «از قبل موجود» (حالتِ ویرایش، مسیرِ
//      خامِ Storage) یا «تازه‌ی همینجلسه» (URI محلی، هنوز آپلودنشده) باشد.
//   ۲) ویدئوی کوتاهِ اختیاری، فقط برای کاربرِ VIP — با lib/media/videoUpload.ts (بدون
//      فشرده‌سازیِ سمتِ کلاینت، رجوع کنید به یادداشتِ کاملِ همان فایل).
//   ۳) بررسیِ «آیا بخشِ راننده و بار اکنون فعال است؟» (useTransportModuleEnabled) — اگر ادمین
//      این بخش را از پنل خاموش کرده، کلِ فرم جایش را به TransportDisabledNotice می‌دهد، دقیقاً
//      هم‌رفتار با صفحه‌ی transport/page.tsx وب.
//
// بقیه‌ی رفتار (نوع وسیله، ولایت، شماره تماس، سوییچ فعال/غیرفعال، ردیابیِ خودکارِ موقعیت با
// فاصله‌ی تصادفیِ ۳۰-۶۰ ثانیه) کاملاً دست‌نخورده ماند — این‌ها بخشی از این بازطراحی نبودند.
import { LoginRequiredCard } from '@/components/LoginRequiredCard';
import { ProvinceSelectField } from '@/components/province/ProvinceSelectField';
import { TransportDisabledNotice } from '@/components/transport/TransportDisabledNotice';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CategoryPicker } from '@/components/ui/CategoryPicker';
import { Icons } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { VipUpsellNotice } from '@/components/vip/VipUpsellNotice';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { compressImage } from '@/lib/imageCompression';
import { requestLocationAccess } from '@/lib/location';
import { pickAndValidateVideo, VideoPickError } from '@/lib/media/videoUpload';
import { normalizeAfghanPhone } from '@/lib/phone';
import { getDriverImageUrl } from '@/lib/transport/images';
import { useTransportModuleEnabled } from '@/lib/transport/moduleStatus';
import {
  getMyDriverProfile,
  saveDriverProfile,
  setDriverActiveStatus,
  TransportApiError,
  updateDriverLocation,
  uploadDriverPhoto,
  uploadDriverVideo,
} from '@/lib/transport/mutations';
import { VEHICLE_TYPES, VehicleTypeId } from '@/lib/transport/vehicleTypes';
import { isUserVip } from '@/lib/vip/vipStatus';
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

type LocationTrackingStatus = 'idle' | 'active' | 'denied' | 'blocked' | 'unsupported';

// یک اسلاتِ عکسِ تکی (شخصی یا وسیله) — یا «از قبل موجود» (مسیرِ خامِ Storage، حالتِ ویرایش) یا
// «تازه‌ی همین‌جلسه» (URI محلی، هنوز آپلودنشده) یا خالی.
type PhotoSlot = { kind: 'existing'; path: string } | { kind: 'new'; uri: string } | null;

export default function DriverProfileScreen() {
  const dict = useDictionary();
  const formDict = dict.transport.driverProfile;
  const errorsDict = formDict.errors as Record<string, string>;
  const vehicleTypesDict = dict.transport.vehicleTypes as Record<string, string>;
  const router = useRouter();
  const { user, isReady } = useAuth();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  // 🆕 فاز M09 — undefined = هنوز در حالِ بررسی، false = ادمین خاموش کرده.
  const moduleEnabled = useTransportModuleEnabled();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [vehicleType, setVehicleType] = useState<VehicleTypeId | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // 🆕 فاز M09 — دو اسلاتِ معنادارِ عکس به‌جای آرایه‌ی عمومیِ قبلی.
  const [personalPhoto, setPersonalPhoto] = useState<PhotoSlot>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<PhotoSlot>(null);
  const [compressingPersonal, setCompressingPersonal] = useState(false);
  const [compressingVehicle, setCompressingVehicle] = useState(false);

  // 🆕 فاز M09 — ویدئوی کوتاهِ اختیاری، فقط VIP.
  const [videoSlot, setVideoSlot] = useState<PhotoSlot>(null);

  const [isActive, setIsActive] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const [locationTrackingStatus, setLocationTrackingStatus] =
    useState<LocationTrackingStatus>('idle');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isVip = isUserVip(user?.vipExpiresAt);

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
          if (profile.personalPhotoPath) setPersonalPhoto({ kind: 'existing', path: profile.personalPhotoPath });
          if (profile.vehiclePhotoPath) setVehiclePhoto({ kind: 'existing', path: profile.vehiclePhotoPath });
          if (profile.videoPath) setVideoSlot({ kind: 'existing', path: profile.videoPath });
          setIsActive(profile.isActive);
        } else {
          setContactPhone(user.phoneNumber);
        }
      })
      .catch(() => {
        if (!cancelled) setContactPhone(user.phoneNumber);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, user]);

  // ردیابیِ خودکارِ موقعیتِ مکانی — دست‌نخورده از نسخه‌ی قبلی، رجوع کنید به یادداشتِ کاملِ بالای
  // خودِ این افکت در نسخه‌های پیشین همین فایل.
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
        const position = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          LOCATION_TIMEOUT_MS
        );
        if (cancelled) return;
        setLocationTrackingStatus('active');
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

  // 🆕 فاز M09 — تا وقتی وضعیتِ ماژول معلوم نشده، چیزی نشان نده؛ اگر خاموش است، کلِ فرم را با
  // اخطار جایگزین کن.
  if (moduleEnabled === undefined || !isReady || (user && loadingProfile)) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (!moduleEnabled) {
    return (
      <>
        <Stack.Screen options={{ title: formDict.title }} />
        <TransportDisabledNotice dict={dict.transport.disabledNotice} />
      </>
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

  async function pickPhoto(slot: 'personal' | 'vehicle') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;

    const setCompressing = slot === 'personal' ? setCompressingPersonal : setCompressingVehicle;
    const setSlot = slot === 'personal' ? setPersonalPhoto : setVehiclePhoto;

    setCompressing(true);
    try {
      const compressed = await compressImage(result.assets[0].uri);
      setSlot({ kind: 'new', uri: compressed.uri });
    } catch {
      showToast(errorsDict.compressionFailed ?? errorsDict.generic, 'error');
    } finally {
      setCompressing(false);
    }
  }

  async function pickVideo() {
    try {
      const picked = await pickAndValidateVideo();
      if (!picked) return;
      setVideoSlot({ kind: 'new', uri: picked.uri });
    } catch (err) {
      const code = err instanceof VideoPickError ? err.code : 'generic';
      showToast(errorsDict[code] ?? errorsDict.generic, 'error');
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vehicleType) errs.vehicleType = errorsDict.invalidVehicleType;
    if (!province) errs.province = dict.province.fieldError;
    if (!normalizeAfghanPhone(contactPhone)) errs.phone = errorsDict.invalidPhone;
    if (!personalPhoto) errs.personalPhoto = errorsDict.personalPhotoRequired;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !vehicleType || !province || !personalPhoto) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      const personalPhotoPath =
        personalPhoto.kind === 'existing' ? personalPhoto.path : await uploadDriverPhoto(personalPhoto.uri, 'personal');

      const vehiclePhotoPath = vehiclePhoto
        ? vehiclePhoto.kind === 'existing'
          ? vehiclePhoto.path
          : await uploadDriverPhoto(vehiclePhoto.uri, 'vehicle')
        : null;

      // 🆕 فاز M09 — ویدئو فقط اگر کاربر واقعاً VIP است ارسال می‌شود؛ حتی اگر UI به‌هردلیل یک
      // اسلاتِ videoSlot باقی‌مانده از حالتِ VIP قبلی داشته باشد، دفاع در عمقِ سمتِ کلاینت.
      const videoPath =
        isVip && videoSlot
          ? videoSlot.kind === 'existing'
            ? videoSlot.path
            : await uploadDriverVideo(videoSlot.uri)
          : null;

      const normalizedPhone = normalizeAfghanPhone(contactPhone)!; // validate() همین را تضمین کرده

      await saveDriverProfile({
        vehicleType,
        province,
        vehicleDetails: vehicleDetails.trim(),
        contactPhone: normalizedPhone,
        personalPhotoPath,
        vehiclePhotoPath,
        videoPath,
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

  function photoUri(slot: PhotoSlot): string | null {
    if (!slot) return null;
    return slot.kind === 'existing' ? getDriverImageUrl(slot.path) : slot.uri;
  }

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

        {/* 🆕 فاز M09 — عکسِ شخصی، الزامی. */}
        <Text style={styles.sectionTitle}>{formDict.photosSectionTitle}</Text>
        <Card style={styles.card}>
          <View style={styles.photoSlotHeader}>
            <Text style={styles.photoSlotLabel}>{formDict.personalPhotoLabel}</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>{formDict.requiredBadge}</Text>
            </View>
          </View>
          <PhotoSlotView
            uri={photoUri(personalPhoto)}
            isCompressing={compressingPersonal}
            onPick={() => pickPhoto('personal')}
            onRemove={() => setPersonalPhoto(null)}
            addButtonLabel={formDict.addPersonalPhotoButton}
            removeLabel={formDict.removePhotoLabel}
          />
          {fieldErrors.personalPhoto && <Text style={styles.fieldError}>{fieldErrors.personalPhoto}</Text>}

          <View style={styles.photoSlotHeader}>
            <Text style={styles.photoSlotLabel}>{formDict.vehiclePhotoLabel}</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>{formDict.optionalBadge}</Text>
            </View>
          </View>
          <PhotoSlotView
            uri={photoUri(vehiclePhoto)}
            isCompressing={compressingVehicle}
            onPick={() => pickPhoto('vehicle')}
            onRemove={() => setVehiclePhoto(null)}
            addButtonLabel={formDict.addVehiclePhotoButton}
            removeLabel={formDict.removePhotoLabel}
          />

          <Text style={styles.photosHint}>{formDict.photosHint}</Text>
        </Card>

        {/* 🆕 فاز M09 — ویدئوی کوتاهِ اختیاری، فقط VIP. */}
        <Text style={styles.sectionTitle}>{formDict.videoSectionTitle}</Text>
        {!isVip ? (
          <VipUpsellNotice message={dict.vip.upsell.videoMessage} buttonLabel={dict.vip.upsell.button} />
        ) : (
          <Card style={styles.card}>
            {videoSlot ? (
              <View style={styles.videoPreviewWrap}>
                <View style={styles.videoPreviewPlaceholder}>
                  <Icons.CheckCircle size={22} color={Colors.primary} />
                </View>
                <Pressable
                  onPress={() => setVideoSlot(null)}
                  accessibilityLabel={formDict.removeVideoLabel}
                  style={styles.removeBadge}>
                  <Text style={styles.removeBadgeText}>×</Text>
                </Pressable>
              </View>
            ) : (
              <Button title={formDict.addVideoButton} variant="secondary" onPress={pickVideo} />
            )}
          </Card>
        )}

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
          disabled={submitting || compressingPersonal || compressingVehicle}
          style={styles.submitButton}
        />
      </ScrollView>
    </>
  );
}

// 🆕 فاز M09 — یک اسلاتِ عکسِ تکی (پیش‌نمایش/دکمه‌ی افزودن/نشانِ حذف)، مشترک بینِ شخصی/وسیله —
// به‌جای تکرارِ همین JSX دوبار.
function PhotoSlotView({
  uri,
  isCompressing,
  onPick,
  onRemove,
  addButtonLabel,
  removeLabel,
}: {
  uri: string | null;
  isCompressing: boolean;
  onPick: () => void;
  onRemove: () => void;
  addButtonLabel: string;
  removeLabel: string;
}) {
  if (isCompressing) {
    return (
      <View style={[styles.photoWrap, styles.photoLoading]}>
        <Spinner size="small" />
      </View>
    );
  }
  if (uri) {
    return (
      <View style={styles.photoWrap}>
        <Image source={{ uri }} style={styles.photo} contentFit="cover" />
        <Pressable onPress={onRemove} accessibilityLabel={removeLabel} style={styles.removeBadge}>
          <Text style={styles.removeBadgeText}>×</Text>
        </Pressable>
      </View>
    );
  }
  return <Button title={addButtonLabel} variant="secondary" onPress={onPick} style={styles.addPhotoButton} />;
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
  fieldError: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.danger,
    textAlign: 'center',
  },
  card: {
    gap: Spacing.md,
  },
  // 🆕 فاز M09
  photoSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoSlotLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  requiredBadge: {
    borderRadius: Radii.full,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  requiredBadgeText: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    color: Colors.danger,
  },
  optionalBadge: {
    borderRadius: Radii.full,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  optionalBadgeText: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  photosHint: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  photoWrap: {
    width: 96,
    height: 96,
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
  // 🆕 فاز M09 — پیش‌نمایشِ ویدئو. RN فاقدِ تگِ <video> بومی است؛ به‌جای نصبِ expo-av فقط برای
  // یک پیش‌نمایشِ کوچک، یک نشانگرِ ساده‌ی «ویدئو انتخاب شد» نمایش داده می‌شود — پخشِ واقعی لازم
  // نیست، چون هدف در همین مرحله فقط تاییدِ انتخاب و امکانِ حذف است.
  videoPreviewWrap: {
    width: 120,
    height: 90,
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