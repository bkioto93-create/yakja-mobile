// مسیر فایل: app/users/[id]/followers.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — معادلِ موبایلیِ
// src/app/[lang]/users/[id]/followers/page.tsx: دسته‌ی اول با getFollowers می‌آید، بقیه با
// FollowListView (components/follows/FollowListView.tsx) صفحه‌به‌صفحه لود می‌شوند.
import { FollowListView } from '@/components/follows/FollowListView';
import { Spinner } from '@/components/ui/Spinner';
import { Colors } from '@/constants/theme';
import { useDictionary } from '@/hooks/useDictionary';
import { FollowListItem, getFollowers } from '@/lib/follows/api';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function FollowersScreen() {
  const dict = useDictionary();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [initial, setInitial] = useState<{ items: FollowListItem[]; cursor: string | null } | undefined>(
    undefined
  );

  useEffect(() => {
    if (!id) return;
    getFollowers(id, null).then((page) => setInitial({ items: page.items, cursor: page.nextCursor }));
  }, [id]);

  if (!initial) {
    return (
      <>
        <Stack.Screen options={{ title: dict.follows.followersPageTitle }} />
        <View style={styles.centered}>
          <Spinner size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: dict.follows.followersPageTitle }} />
      <View style={styles.container}>
        <FollowListView
          initialItems={initial.items}
          initialCursor={initial.cursor}
          loadMore={(cursor) => getFollowers(id, cursor)}
          emptyTitle={dict.follows.emptyFollowersTitle}
          emptyDesc={dict.follows.emptyFollowersDesc}
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