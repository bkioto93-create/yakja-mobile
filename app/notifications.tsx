// مسیر فایل: app/notifications.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — معادلِ موبایلیِ
// src/app/[lang]/notifications/page.tsx: فهرستِ اعلان‌های فالو (فعلاً فقط follow/follow_back)،
// با همان الگوی «باز کردنِ صفحه = خواندن» — بلافاصله بعدِ گرفتنِ فهرست، markAllNotificationsRead
// صدا زده می‌شود.
//
// **کاربرِ مهمان:** دقیقاً هم‌الگو با app/listings/my-listings.tsx — خودِ مسیر برای مهمان هم
// قابل‌دسترس می‌ماند، فقط محتوای واقعی جایش را به LoginRequiredCard می‌دهد (چون این صفحه ذاتاً
// «اقدامِ محدود به کاربرِ واردشده» است، نه محتوای عمومی).
import { LoginRequiredCard } from '@/components/LoginRequiredCard';
import { Icons } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { VipBadge } from '@/components/vip/VipBadge';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import {
    getMyNotifications,
    markAllNotificationsRead,
    NotificationItem,
} from '@/lib/notifications/api';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

function formatRelativeTime(
  iso: string,
  dict: { justNow: string; minutesAgoTemplate: string; hoursAgoTemplate: string; daysAgoTemplate: string }
): string {
  const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return dict.justNow;
  if (diffMinutes < 60) return dict.minutesAgoTemplate.replace('{minutes}', String(diffMinutes));
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return dict.hoursAgoTemplate.replace('{hours}', String(diffHours));
  const diffDays = Math.floor(diffHours / 24);
  return dict.daysAgoTemplate.replace('{days}', String(diffDays));
}

export default function NotificationsScreen() {
  const dict = useDictionary();
  const followsDict = dict.follows;
  const { user, isReady } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    getMyNotifications(null).then((page) => {
      setItems(page.items);
      setCursor(page.nextCursor);
      // طبق الگوی وب: باز شدنِ این صفحه یعنی همه‌چیز خوانده شد — بی‌صدا، بدون انتظار.
      markAllNotificationsRead();
    });
  }, [user]);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || cursor === null) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await getMyNotifications(cursor);
      setItems((previous) => {
        const prev = previous ?? [];
        const seen = new Set(prev.map((item) => item.id));
        const fresh = page.items.filter((item) => !seen.has(item.id));
        return fresh.length === 0 ? prev : [...prev, ...fresh];
      });
      setCursor(page.nextCursor);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [cursor]);

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
        <Stack.Screen options={{ title: followsDict.activityPageTitle }} />
        <View style={styles.container}>
          <LoginRequiredCard
            title={followsDict.loginRequiredTitle}
            description={followsDict.loginRequiredDesc}
            buttonLabel={followsDict.loginRequiredButton}
          />
        </View>
      </>
    );
  }

  if (items === null) {
    return (
      <>
        <Stack.Screen options={{ title: followsDict.activityPageTitle }} />
        <View style={styles.centered}>
          <Spinner size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: followsDict.activityPageTitle }} />
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Icons.HeartOutline size={28} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>{followsDict.emptyActivityTitle}</Text>
          <Text style={styles.emptyDesc}>{followsDict.emptyActivityDesc}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          renderItem={({ item }) => {
            const displayName = item.actor.name?.trim()
              ? item.actor.name
              : dict.users.publicProfile.fallbackName;
            const actionText =
              item.type === 'follow_back' ? followsDict.followedYouBackText : followsDict.followedYouText;
            return (
              <Pressable
                onPress={() => router.push(`/users/${item.actor.id}`)}
                style={({ pressed }) => [styles.row, !item.isRead && styles.rowUnread, pressed && styles.rowPressed]}>
                <View style={styles.avatarWrap}>
                  {item.actor.photoUrl ? (
                    <Image source={{ uri: item.actor.photoUrl }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Icons.User size={20} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.textCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {displayName}
                    </Text>
                    {item.actor.isVip && <VipBadge label={dict.vip.badgeLabel} />}
                  </View>
                  <Text style={styles.actionText}>{actionText}</Text>
                </View>
                <Text style={styles.timeText}>{formatRelativeTime(item.createdAt, followsDict)}</Text>
              </Pressable>
            );
          }}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoading}>
                <Spinner size="small" />
              </View>
            ) : null
          }
        />
      )}
    </>
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
  list: {
    padding: Spacing.md,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.md,
  },
  rowUnread: {
    backgroundColor: 'rgba(6,182,212,0.06)',
  },
  rowPressed: {
    opacity: 0.7,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 13.5,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    flexShrink: 1,
  },
  actionText: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  timeText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgBase,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 19,
  },
  footerLoading: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});