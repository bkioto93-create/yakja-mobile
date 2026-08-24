// مسیر فایل: components/ProfilePhotoUploader.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، قابلیت «آپلود عکس پروفایل») — معادلِ موبایلیِ
// src/components/profile/ProfilePhotoUploader.tsx وب. کارتِ مستقل در تبِ پروفایل: عکسِ فعلی
// (اگر باشد) + بجِ وضعیت (در انتظار/تاییدشده/ردشده) + دکمه‌ی تغییر + دکمه‌ی حذف.
//
// **معماریِ آپلود:** دقیقاً هم‌الگو با AddStorySection.tsx (انتخاب از گالری با expo-image-picker
// → فشرده‌سازی → آپلودِ مستقیم به Signed URL → ثبتِ نهایی) — همه‌ی این مراحل در یک تابعِ واحد
// (lib/users/profilePhotoMutations.ts::uploadAndSubmitProfilePhoto) پیچیده شده‌اند.
//
// **تفاوتِ آگاهانه با AddStorySection:** اینجا فقط عکس مجاز است (بدون گزینه‌ی ویدئو) — دقیقاً
// طبق طراحیِ وب («یک عکسِ واضح از خودت بگذار»)، عکسِ پروفایل هیچ‌وقت ویدئویی نبوده.
//
// **حذف:** از سیستمِ سراسریِ useConfirm() استفاده می‌کند (نه Alert.alert بومی) — طبق همان قاعده‌ی
// سراسریِ این پروژه (رجوع کنید به کامنتِ بالای components/ui/ConfirmModal.tsx).
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { deleteProfilePhoto, ProfilePhotoApiError, uploadAndSubmitProfilePhoto } from '@/lib/users/profilePhotoMutations';
import { getProfilePhotoUrl } from '@/lib/users/profilePhotoUrl';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './ui/Card';
import { useConfirm } from './ui/ConfirmModal';
import { Icons } from './ui/Icons';
import { Spinner } from './ui/Spinner';
import { useToast } from './ui/Toast';

type Stage = 'idle' | 'compressing' | 'uploading' | 'deleting';

// نگاشتِ code خطای ProfilePhotoApiError به کلیدِ درستِ دیکشنری. کدهایی که هرگز از سمتِ موبایل
// رخ نمی‌دهند (imageUnreadable/imageConversionFailed/canvasContextUnavailable — مخصوصِ
// پیاده‌سازیِ مبتنی‌بر Canvas مرورگر) عمداً اینجا نیستند؛ اگر کدِ ناشناخته‌ای برسد، errors.generic
// نمایش داده می‌شود.
function errorMessageFor(dict: ReturnType<typeof useDictionary>['profile']['photo'], code: string): string {
  switch (code) {
    case 'unauthenticated':
      return dict.errors.unauthenticated;
    case 'invalidPhotoData':
      return dict.errors.invalidPhotoData;
    case 'uploadFailed':
      return dict.errors.uploadFailed;
    case 'dbError':
      return dict.errors.dbError;
    case 'notFound':
      return dict.errors.notFound;
    default:
      return dict.errors.generic;
  }
}

export function ProfilePhotoUploader() {
  const dict = useDictionary();
  const photoDict = dict.profile.photo;
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [stage, setStage] = useState<Stage>('idle');

  if (!user) return null;

  const isBusy = stage !== 'idle';
  const photoUrl = user.photoPath ? getProfilePhotoUrl(user.photoPath) : null;

  async function handlePick() {
    if (isBusy) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || result.assets.length === 0) return;

    try {
      setStage('compressing');
      setStage('uploading');
      await uploadAndSubmitProfilePhoto(result.assets[0].uri);
      await refreshUser();
      showToast(photoDict.successMessage, 'success');
    } catch (err) {
      const code = err instanceof ProfilePhotoApiError ? err.code : 'generic';
      showToast(errorMessageFor(photoDict, code), 'error');
    } finally {
      setStage('idle');
    }
  }

  async function handleDelete() {
    if (isBusy) return;
    const ok = await confirm({
      title: photoDict.deleteButton,
      description: photoDict.deleteConfirm,
      confirmLabel: photoDict.deleteButton,
      cancelLabel: dict.common.cancel,
      destructive: true,
    });
    if (!ok) return;

    try {
      setStage('deleting');
      await deleteProfilePhoto();
      await refreshUser();
      showToast(photoDict.deleteSuccessMessage, 'success');
    } catch {
      showToast(photoDict.deleteError, 'error');
    } finally {
      setStage('idle');
    }
  }

  const statusLabel =
    user.photoStatus === 'pending'
      ? photoDict.statusPending
      : user.photoStatus === 'approved'
        ? photoDict.statusApproved
        : user.photoStatus === 'rejected'
          ? photoDict.statusRejected
          : null;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Pressable
          onPress={handlePick}
          disabled={isBusy}
          style={({ pressed }) => [styles.avatarWrap, pressed && styles.avatarWrapPressed]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icons.User size={28} color={Colors.primary} />
            </View>
          )}
          {isBusy && (
            <View style={styles.avatarOverlay}>
              <Spinner size="small" />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Icons.Camera size={12} color="#fff" />
          </View>
        </Pressable>

        <View style={styles.textCol}>
          <Text style={styles.title}>{photoDict.title}</Text>
          <Text style={styles.description}>{photoDict.description}</Text>
          {statusLabel && (
            <View
              style={[
                styles.statusBadge,
                user.photoStatus === 'approved' && styles.statusBadgeApproved,
                user.photoStatus === 'rejected' && styles.statusBadgeRejected,
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  user.photoStatus === 'approved' && styles.statusBadgeTextApproved,
                  user.photoStatus === 'rejected' && styles.statusBadgeTextRejected,
                ]}>
                {statusLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={handlePick} disabled={isBusy} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>
            {photoUrl ? photoDict.changeButton : photoDict.addButton}
          </Text>
        </Pressable>
        {photoUrl && (
          <Pressable onPress={handleDelete} disabled={isBusy} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>{photoDict.deleteButton}</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    overflow: 'visible',
  },
  avatarWrapPressed: {
    opacity: 0.8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.full,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.full,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    end: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  description: {
    fontSize: 11.5,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: 'rgba(100,116,139,0.12)',
  },
  statusBadgeApproved: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  statusBadgeRejected: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  statusBadgeTextApproved: {
    color: Colors.success,
  },
  statusBadgeTextRejected: {
    color: Colors.danger,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  deleteButton: {
    flex: 1,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.danger,
  },
});