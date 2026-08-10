// مسیر فایل: components/AddStorySection.tsx
// معادل موبایلِ AddStorySection وب — کارتِ «افزودن استوری» در تب پروفایل. کاربر یک عکس یا
// ویدئوی کوتاه انتخاب می‌کند، سیستم آن را آپلود و ثبت می‌کند.
//
// **به‌روزرسانی (سقفِ VIP برای ویدئوی استوری):** طبق تصمیم تازه‌ی صریح کارفرما، کاربرِ VIP حالا
// می‌تواند تا ۳۰ ثانیه (به‌جای ۱۵ ثانیه) ویدئوی استوری بگذارد — دقیقاً هم‌رفتار با وب. یادداشتِ
// قبلیِ این فایل می‌گفت «AuthUser موبایل فیلد vipExpiresAt ندارد»؛ آن یادداشت دیگر درست نیست —
// context/AuthContext.tsx از قبل vipExpiresAt را روی AuthUser دارد (برای بج VIP در پروفایل و
// فرم درخواست VIP استفاده می‌شود). پس اینجا هم دقیقاً همان الگوی isUserVip(user?.vipExpiresAt)
// که بقیه‌ی صفحات موبایل استفاده می‌کنند به‌کار رفته، و سقفِ مدت‌زمان از همان منبعِ حقیقتِ
// مشترکِ وب/موبایل خوانده می‌شود (lib/stories/storyVideoLimits.ts).
//
// **ساده‌سازیِ باقی‌مانده (بدون نمایشِ شمارنده‌ی زنده‌ی «امروز X از ۱ استفاده شده»):** نمایشِ
// دقیقِ سهمیه‌ی روزانه هم‌چنان به یک فازِ جداگانه موکول شده؛ این کارت فقط یک متنِ ثابتِ راهنما
// نشان می‌دهد. اجرای واقعیِ محدودیت کاملاً سمت سرور و همیشه درست است
// (createSignedStoryUploadSlotAction/createStoryAction، هر دو VIP واقعی کاربر را از دیتابیس
// می‌خوانند) — اگر کاربر به سقف رسیده باشد، پیام خطای dailyLimitReached را دقیقاً در لحظه‌ی
// تلاش می‌بیند، نه یک شمارنده‌ی از قبل که ممکن است نادرست باشد.
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import {
  createStoryAction,
  StoryApiError,
  uploadStoryMedia,
} from '@/lib/stories/mutations';
import { getStoryVideoMaxDurationSeconds } from '@/lib/stories/storyVideoLimits';
import { isUserVip } from '@/lib/vip/vipStatus';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from './ui/Icons';

type Stage = 'idle' | 'compressing' | 'uploading';

export function AddStorySection({ onPosted }: { onPosted?: () => void }) {
  const dict = useDictionary();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>('idle');

  const isBusy = stage !== 'idle';
  const isVip = isUserVip(user?.vipExpiresAt);
  const maxVideoDurationSeconds = getStoryVideoMaxDurationSeconds(isVip);

  async function handlePick(kind: 'images' | 'videos') {
    if (isBusy) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [kind],
      quality: 1,
      videoMaxDuration: maxVideoDurationSeconds,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const mediaType = kind === 'images' ? 'image' : 'video';

    // دفاع در عمق سمت کلاینت: حتی اگر گالری گوشی به‌هردلیل ویدئویی بلندتر از سقف برگرداند
    // (videoMaxDuration فقط برای ضبط مستقیم با دوربین تضمین‌شده است، نه همیشه برای گالری)،
    // پیش از هر آپلودی همین‌جا رد می‌شود — بررسیِ نهایی و غیرقابل‌دورزدن هم‌چنان سمت سرور است.
    if (mediaType === 'video' && asset.duration && asset.duration / 1000 > maxVideoDurationSeconds + 0.5) {
      showToast(dict.stories.addSection.errors.invalidVideoDuration, 'error');
      return;
    }

    try {
      setStage('compressing');
      const prepared = await uploadStoryMedia({
        uri: asset.uri,
        mediaType,
        durationMs: asset.duration ?? null,
        width: asset.width ?? null,
        height: asset.height ?? null,
      });

      setStage('uploading');
      const result2 = await createStoryAction(prepared);

      if (!result2.success) {
        const code = result2.error as keyof typeof dict.stories.addSection.errors;
        showToast(
          dict.stories.addSection.errors[code] ?? dict.stories.addSection.errors.generic,
          'error'
        );
        return;
      }

      showToast(dict.stories.addSection.successMessage, 'success');
      onPosted?.();
    } catch (err) {
      if (err instanceof StoryApiError) {
        const code = err.code as keyof typeof dict.stories.addSection.errors;
        showToast(
          dict.stories.addSection.errors[code] ?? dict.stories.addSection.errors.generic,
          'error'
        );
      } else {
        showToast(dict.stories.addSection.errors.generic, 'error');
      }
    } finally {
      setStage('idle');
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{dict.stories.addSection.title}</Text>
      <Text style={styles.desc}>{dict.stories.addSection.description}</Text>

      <View style={styles.buttonsRow}>
        <Pressable
          onPress={() => handlePick('images')}
          disabled={isBusy}
          style={({ pressed }) => [styles.pickButton, pressed && styles.pickButtonPressed, isBusy && styles.disabled]}>
          <Icons.Box size={20} color={Colors.primary} />
          <Text style={styles.pickButtonText}>{dict.stories.addSection.addPhotoButton}</Text>
        </Pressable>
        <Pressable
          onPress={() => handlePick('videos')}
          disabled={isBusy}
          style={({ pressed }) => [styles.pickButton, pressed && styles.pickButtonPressed, isBusy && styles.disabled]}>
          <Icons.Video size={20} color={Colors.primary} />
          <Text style={styles.pickButtonText}>{dict.stories.addSection.addVideoButton}</Text>
        </Pressable>
      </View>

      {isBusy && (
        <View style={styles.progressRow}>
          <Spinner size="small" />
          <Text style={styles.progressText}>
            {stage === 'compressing'
              ? dict.stories.addSection.compressingLabel
              : dict.stories.addSection.uploadingLabel}
          </Text>
        </View>
      )}

      <Text style={styles.limitNote}>{dict.stories.addSection.limitReachedDesc}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  desc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
  },
  pickButtonPressed: {
    opacity: 0.75,
  },
  pickButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  progressText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  limitNote: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
});