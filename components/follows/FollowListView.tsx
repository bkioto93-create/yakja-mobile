// مسیر فایل: components/follows/FollowListView.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — معادلِ موبایلیِ
// src/components/follows/FollowListClient.tsx وب: کامپوننتِ مشترکِ صفحاتِ «دنبال‌کنندگان» و
// «دنبال‌شوندگان». دسته‌ی اول در خودِ صفحه (app/users/[id]/followers.tsx یا following.tsx)
// گرفته می‌شود؛ دسته‌های بعدی با FlatList::onEndReached — معادلِ RN برای IntersectionObserver
// وب — به‌همراه دکمه‌ی پشتیبانِ «نمایش بیشتر» (طبق همان بندِ اینترنت ضعیف: کاربر همیشه یک راهِ
// دستیِ مطمئن هم دارد، نه فقط اسکرولِ خودکار).
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { FollowListItem, FollowListPage } from '@/lib/follows/api';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../ui/Icons';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { VipBadge } from '../vip/VipBadge';

export function FollowListView({
  initialItems,
  initialCursor,
  loadMore: loadMoreFn,
  emptyTitle,
  emptyDesc,
}: {
  initialItems: FollowListItem[];
  initialCursor: string | null;
  loadMore: (cursor: string | null) => Promise<FollowListPage>;
  emptyTitle: string;
  emptyDesc: string;
}) {
  const dict = useDictionary();
  const followsDict = dict.follows;
  const router = useRouter();
  const { showToast } = useToast();

  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || cursor === null) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await loadMoreFn(cursor);
      setItems((previous) => {
        const seen = new Set(previous.map((item) => item.id));
        const fresh = page.items.filter((item) => !seen.has(item.id));
        return fresh.length === 0 ? previous : [...previous, ...fresh];
      });
      setCursor(page.nextCursor);
    } catch {
      showToast(followsDict.loadMoreError, 'error');
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [cursor, loadMoreFn, followsDict.loadMoreError, showToast]);

  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <Icons.Users size={28} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyDesc}>{emptyDesc}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      onEndReachedThreshold={0.5}
      onEndReached={loadMore}
      renderItem={({ item }) => {
        const displayName = item.name?.trim() ? item.name : dict.users.publicProfile.fallbackName;
        return (
          <Pressable
            onPress={() => router.push(`/users/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <View style={styles.avatarWrap}>
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Icons.User size={22} color={Colors.primary} />
              )}
            </View>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              {item.isVip && <VipBadge label={dict.vip.badgeLabel} />}
            </View>
          </Pressable>
        );
      }}
      ListFooterComponent={
        <View style={styles.footer}>
          {isLoadingMore && (
            <View style={styles.loadingRow}>
              <Spinner size="small" />
              <Text style={styles.loadingText}>{followsDict.loadingMore}</Text>
            </View>
          )}
          {!isLoadingMore && cursor !== null && (
            <Pressable onPress={loadMore} style={styles.loadMoreButton}>
              <Text style={styles.loadMoreText}>{followsDict.loadMore}</Text>
            </Pressable>
          )}
          {cursor === null && <Text style={styles.endText}>{followsDict.endOfList}</Text>}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.md,
  },
  rowPressed: {
    backgroundColor: Colors.bgBase,
  },
  avatarWrap: {
    width: 48,
    height: 48,
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
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    flexShrink: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl * 2,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgBase,
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
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  loadMoreButton: {
    borderRadius: Radii.full,
    backgroundColor: 'rgba(6,182,212,0.1)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  loadMoreText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  endText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
});