// مسیر فایل: components/stories/StoryViewer.tsx
// معادل موبایلِ src/components/stories/StoryViewer.tsx وب — نمایشگر تمام‌صفحه، دقیقاً به الگوی
// رفتاری استوری اینستاگرام:
//   - نوارهای پیشرفت بالای صفحه (یک نوار به ازای هر استوری در دسته‌ی همان کاربر)
//   - عکس: مدت‌نمایش ثابت (STORY_IMAGE_DISPLAY_SECONDS=۶) | ویدئو: مدت واقعیِ ذخیره‌شده‌اش
//   - تپ سمت راست = بعدی، تپ سمت چپ = قبلی — طبق قرارداد جهانی استوری، عمداً برخلاف جهت RTL
//     رابط کاربری فلیپ نمی‌شود؛ چون این حرکت با «جهت زمان» گره خورده، نه با جهت متن.
//   - دکمه‌ی بستن (X) — و اگر بیننده خودِ صاحب استوری باشد، دکمه‌ی حذف زودهنگام هم کنارش.
//
// **وابستگیِ تازه‌ی لازم (فقط برای این فایل):** پروژه‌ی موبایل تا پیش از این هیچ کتابخانه‌ی
// پخشِ ویدئو نداشت (نه expo-av، نه expo-video). برای پخشِ ویدئوهای استوری، `expo-video` (نسخه‌ی
// فعلیِ توصیه‌شده‌ی خودِ Expo، جایگزینِ expo-av منسوخ‌شده) اضافه شد — پیش از استفاده از این
// فایل، اجرا کنید: `npx expo install expo-video`.
//
// **ساده‌سازیِ آگاهانه نسبت به وب (پیشروی خودکار):** وب برای ویدئو از رویدادِ `onEnded` خودِ تگ
// <video> به‌عنوان محرکِ اصلی استفاده می‌کند و یک تایمرِ ثابت را فقط به‌عنوان Fallback نگه
// می‌دارد؛ اینجا فقط از تایمرِ ثابت (بر پایه‌ی همان durationSeconds واقعی که هنگام ثبتِ استوری
// در سرور ذخیره شده) استفاده شد — چون این عدد از قبل «مدتِ واقعیِ ویدئو» است (نه یک حدس)،
// تکیه‌کردن به آن به‌جای رویدادهای پخش‌کننده‌ی بومی هم ساده‌تر است و هم از نوسانِ رفتاریِ
// نسخه‌های مختلف expo-video در دستگاه‌های گوناگون مستقل می‌ماند.
//
// **به‌روزرسانی (مهاجرت به سیستمِ تازه‌ی مودالِ تاییدِ سراسری):** پیاده‌سازیِ محلیِ قبلیِ این
// فایل (یک View مطلق‌موقعیت‌یافته‌ی دستی برای «آیا مطمئنید می‌خواهید حذف کنید؟») حالا با
// useConfirm() از components/ui/ConfirmModal.tsx جایگزین شده — همان UI (کارت، عنوان/توضیح، دو
// دکمه)، فقط حالا یک سیستمِ سراسریِ قابل‌استفاده‌ی مجدد برای هر صفحه‌ی دیگری هم هست، نه فقط
// همین‌جا. نگرانیِ قبلی درباره‌ی zIndex/React Native Modal اینجا دیگر صدق نمی‌کند: چون
// ConfirmModalProvider در ریشه‌ی مطلقِ اپ mount شده (نه تودرتوی این View تمام‌صفحه)، Modal
// بومی‌اش همیشه در بالاترین لایه‌ی ممکن رندر می‌شود — حتی وقتی از عمقِ همین کامپوننتِ
// تمام‌صفحه صدا زده شود. جزئیاتِ کامل در یادداشتِ بالای ConfirmModal.tsx.
import { Fonts, Radii, Spacing } from '@/constants/theme';
import type { ActiveStory } from '@/lib/stories/api';
import { deleteMyStoryAction } from '@/lib/stories/mutations';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useConfirm } from '../ui/ConfirmModal';
import { Icons } from '../ui/Icons';
import { useToast } from '../ui/Toast';

const STORY_IMAGE_DISPLAY_SECONDS = 6;

export type StoryViewerDict = {
  closeLabel: string;
  deleteLabel: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  deleteConfirmYes: string;
  deleteConfirmCancel: string;
  deleteFailedError: string;
  justNow: string;
  minutesAgoTemplate: string; // شامل {minutes}
  hoursAgoTemplate: string; // شامل {hours}
  previousLabel: string;
  nextLabel: string;
};

function formatRelativeTime(createdAt: string, dict: StoryViewerDict): string {
  const diffMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diffMinutes < 1) return dict.justNow;
  if (diffMinutes < 60) return dict.minutesAgoTemplate.replace('{minutes}', String(diffMinutes));
  const diffHours = Math.floor(diffMinutes / 60);
  return dict.hoursAgoTemplate.replace('{hours}', String(diffHours));
}

function storyDurationSeconds(story: ActiveStory): number {
  if (story.mediaType === 'video') return story.durationSeconds || STORY_IMAGE_DISPLAY_SECONDS;
  return STORY_IMAGE_DISPLAY_SECONDS;
}

function ProgressSegment({
  status,
  durationSeconds,
}: {
  status: 'done' | 'active' | 'upcoming';
  durationSeconds: number;
}) {
  const widthAnim = useRef(new Animated.Value(status === 'done' ? 1 : 0)).current;

  useEffect(() => {
    if (status !== 'active') {
      widthAnim.setValue(status === 'done' ? 1 : 0);
      return;
    }
    widthAnim.setValue(0);
    const anim = Animated.timing(widthAnim, {
      toValue: 1,
      duration: durationSeconds * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

function VideoStory({ uri, style }: { uri: string; style: object }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />;
}

export function StoryViewer({
  stories,
  ownerName,
  isOwnStories,
  onClose,
  onDeleted,
  dict,
  initialIndex = 0,
  hasNextUser = false,
  hasPreviousUser = false,
  onRequestNextUser,
  onRequestPreviousUser,
}: {
  stories: ActiveStory[];
  ownerName: string;
  isOwnStories: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  dict: StoryViewerDict;
  // "last" یعنی «از آخرین استوری این کاربر شروع کن» — دقیقاً حالتی که هنگام برگشتن به کاربرِ
  // قبلی لازم است.
  initialIndex?: number | 'last';
  hasNextUser?: boolean;
  hasPreviousUser?: boolean;
  onRequestNextUser?: () => void;
  onRequestPreviousUser?: () => void;
}) {
  const { showToast } = useToast();
  const [localStories, setLocalStories] = useState(stories);
  const [index, setIndex] = useState(() =>
    initialIndex === 'last' ? Math.max(0, stories.length - 1) : initialIndex
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const confirm = useConfirm();

  const currentStory = localStories[index];
  const isAtLastStory = index >= localStories.length - 1;
  const isAtFirstStory = index === 0;

  function goNext() {
    if (isAtLastStory) {
      if (hasNextUser && onRequestNextUser) {
        onRequestNextUser();
        return;
      }
      onClose();
      return;
    }
    setIndex((current) => current + 1);
  }

  function goPrev() {
    if (isAtFirstStory) {
      if (hasPreviousUser && onRequestPreviousUser) {
        onRequestPreviousUser();
      }
      return;
    }
    setIndex((current) => Math.max(0, current - 1));
  }

  // پیشروی خودکار — رجوع کنید به یادداشتِ «ساده‌سازیِ آگاهانه» بالای فایل.
  useEffect(() => {
    if (!currentStory) return;
    const duration = storyDurationSeconds(currentStory);
    const timer = setTimeout(goNext, duration * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, currentStory?.id]);

  if (!currentStory) return null;

  async function handleDeletePress() {
    const ok = await confirm({
      title: dict.deleteConfirmTitle,
      description: dict.deleteConfirmDesc,
      confirmLabel: dict.deleteConfirmYes,
      cancelLabel: dict.deleteConfirmCancel,
      destructive: true,
    });
    if (!ok) return;

    setIsDeleting(true);
    const result = await deleteMyStoryAction(currentStory.id);
    setIsDeleting(false);

    if (!result.success) {
      showToast(dict.deleteFailedError, 'error');
      return;
    }

    const remaining = localStories.filter((s) => s.id !== currentStory.id);
    onDeleted?.();
    if (remaining.length === 0) {
      onClose();
      return;
    }
    setLocalStories(remaining);
    setIndex((current) => Math.min(current, remaining.length - 1));
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.mediaLayer}>
        {currentStory.mediaType === 'image' ? (
          <Image source={{ uri: currentStory.mediaUrl }} style={styles.fill} contentFit="cover" />
        ) : (
          <VideoStory key={currentStory.id} uri={currentStory.mediaUrl} style={styles.fill} />
        )}
      </View>

      {/* هدر (نوارهای پیشرفت + نام/زمان + دکمه‌های حذف/بستن) — بالاترین لایه، همیشه قابل‌لمس. */}
      <View style={styles.header} pointerEvents="box-none">
        <View style={styles.progressRow}>
          {localStories.map((story, i) => (
            <ProgressSegment
              key={story.id}
              status={i < index ? 'done' : i === index ? 'active' : 'upcoming'}
              durationSeconds={storyDurationSeconds(story)}
            />
          ))}
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.ownerName} numberOfLines={1}>
              {ownerName}
            </Text>
            <Text style={styles.timeAgo}>{formatRelativeTime(currentStory.createdAt, dict)}</Text>
          </View>
          <View style={styles.headerActions}>
            {isOwnStories && (
              <Pressable
                onPress={handleDeletePress}
                disabled={isDeleting}
                accessibilityRole="button"
                accessibilityLabel={dict.deleteLabel}
                style={[styles.headerButton, isDeleting && styles.headerButtonDisabled]}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icons.Trash size={18} color="#fff" />
                )}
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={dict.closeLabel}
              style={styles.headerButton}>
              <Icons.X size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* دکمه‌های واضحِ قبلی/بعدی — علاوه بر تپ‌زون‌های نامرئیِ زیرشان، برای نشانه‌ی بصریِ روشن.
          جهت: راست=بعدی، چپ=قبلی — عمداً بدون منطقِ RTL (رجوع کنید به یادداشتِ بالای فایل). */}
      {!(isAtFirstStory && !hasPreviousUser) && (
        <Pressable
          onPress={goPrev}
          accessibilityRole="button"
          accessibilityLabel={dict.previousLabel}
          style={[styles.navButton, styles.navButtonLeft]}>
          <Icons.ChevronBack size={22} color="#fff" />
        </Pressable>
      )}
      {!(isAtLastStory && !hasNextUser) && (
        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={dict.nextLabel}
          style={[styles.navButton, styles.navButtonRight]}>
          <Icons.ChevronForward size={22} color="#fff" />
        </Pressable>
      )}

      {/* تپ‌زون‌های نامرئی — از زیرِ هدر شروع می‌شوند تا هرگز روی دکمه‌های آن ننشینند؛
          راست=بعدی (۷۰٪ عرض)، چپ=قبلی (۳۰٪ عرض). */}
      <Pressable onPress={goNext} style={styles.tapZoneRight} />
      <Pressable onPress={goPrev} style={styles.tapZoneLeft} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
  mediaLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 52,
    paddingHorizontal: Spacing.sm,
    zIndex: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.full,
    backgroundColor: '#fff',
  },
  headerRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  ownerName: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#fff',
    flexShrink: 1,
  },
  timeAgo: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: 8,
  },
  navButtonRight: {
    right: 8,
  },
  tapZoneLeft: {
    position: 'absolute',
    top: 80,
    bottom: 0,
    left: 0,
    width: '30%',
    zIndex: 0,
  },
  tapZoneRight: {
    position: 'absolute',
    top: 80,
    bottom: 0,
    right: 0,
    width: '70%',
    zIndex: 0,
  },
});