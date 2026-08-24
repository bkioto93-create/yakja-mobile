// مسیر فایل: app/users/[id]/following.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — دقیقاً هم‌الگو با
// ./followers.tsx کنارش، فقط با getFollowing به‌جای getFollowers.
import { FollowListView } from '@/components/follows/FollowListView';
import { Spinner } from '@/components/ui/Spinner';
import { Colors } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { FollowListItem, getFollowing } from '@/lib/follows/api';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function FollowingScreen() {
  const dict = useDictionary();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [initial, setInitial] = useState<{ items: FollowListItem[]; cursor: string | null } | undefined>(
    undefined
  );

  useEffect(() => {
    if (!id) return;
    getFollowing(id, null).then((page) => setInitial({ items: page.items, cursor: page.nextCursor }));
  }, [id]);

  if (!initial) {
    return (
      <>
        <Stack.Screen options={{ title: dict.follows.followingPageTitle }} />
        <View style={styles.centered}>
          <Spinner size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: dict.follows.followingPageTitle }} />
      <View style={styles.container}>
        <FollowListView
          initialItems={initial.items}
          initialCursor={initial.cursor}
          loadMore={(cursor) => getFollowing(id, cursor)}
          emptyTitle={dict.follows.emptyFollowingTitle}
          emptyDesc={dict.follows.emptyFollowingDesc}
        />
      </View>
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
});