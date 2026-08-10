// مسیر فایل: app/chat/index.tsx
// معادل موبایلِ src/app/[lang]/chat/page.tsx — فهرستِ «چت‌های من».
//
// **محدوده‌ی این تحویل (فاز الف — متن‌محور):** ردیفِ ثابتِ «چت با پشتیبانی» (که وب بالای همین
// فهرست نشان می‌دهد) عمداً اینجا نیست — به فازِ بعدیِ موبایل موکول شد. اگر کاربری از قبل یک
// گفتگوی پشتیبانی داشته باشد (از وب)، فعلاً مثل یک ردیفِ عادی در همین فهرست دیده می‌شود.
import { AdminSupportChatEntry } from '@/components/chat/AdminSupportChatEntry';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { VipBadge } from '@/components/vip/VipBadge';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getMyConversations, MyConversationRow } from '@/lib/chat/api';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatListScreen() {
  const dict = useDictionary();
  const chatDict = dict.chat;
  const { user, isReady } = useAuth();
  const router = useRouter();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ آخرین ردیفِ فهرست زیرِ نوار ناوبریِ سیستمیِ اندروید.
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<MyConversationRow[] | null>(null);

  const load = useCallback(() => {
    getMyConversations({
      contextFallbackLabel: chatDict.contextFallbackLabel,
      voiceMessagePreview: chatDict.voiceMessagePreview,
      noMessagesYet: chatDict.noMessagesYet,
    }).then(setConversations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

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
        <Stack.Screen options={{ title: chatDict.listTitle }} />
        <View style={styles.centered}>
          <Card style={styles.guestCard}>
            <View style={styles.guestIconWrap}>
              <Icons.MessageSquare size={28} color={Colors.textMuted} />
            </View>
            <Text style={styles.guestTitle}>{chatDict.loginRequiredTitle}</Text>
            <Text style={styles.guestDesc}>{chatDict.loginRequiredDesc}</Text>
            <Button
              title={chatDict.loginRequiredButton}
              onPress={() => router.push('/auth/login')}
              style={styles.guestButton}
            />
          </Card>
        </View>
      </>
    );
  }

  // **افزوده‌شده (چت با پشتیبانی):** اگر یک گفتگوی پشتیبانی از قبل در فهرست باشد، از ردیف‌های
  // معمولی جدا می‌شود — چون بالای همه، به‌صورت یک ردیفِ پین‌شده (ListHeaderComponent پایین‌تر)
  // نشان داده می‌شود، دقیقاً هم‌رفتار با فهرستِ چتِ وب.
  const supportConversation = conversations?.find((c) => c.isAdminSupportChat) ?? null;
  const regularConversations = conversations?.filter((c) => !c.isAdminSupportChat) ?? null;

  return (
    <>
      <Stack.Screen options={{ title: chatDict.listTitle }} />

      {conversations === null ? (
        <View style={styles.centered}>
          <Spinner size="large" />
        </View>
      ) : (
        <FlatList
          style={styles.container}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.lg }]}
          data={regularConversations}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.pinnedWrap}>
              <AdminSupportChatEntry
                viewerId={user.id}
                variant="listItem"
                existingConversationId={supportConversation?.id ?? null}
                subtitle={
                  supportConversation
                    ? supportConversation.status === 'pending'
                      ? chatDict.adminSupport.pendingListBadge
                      : supportConversation.lastMessagePreview
                    : undefined
                }
                dict={chatDict.adminSupport}
              />
            </View>
          }
          ListEmptyComponent={
            <Card style={styles.guestCard}>
              <View style={styles.guestIconWrap}>
                <Icons.MessageSquare size={28} color={Colors.textMuted} />
              </View>
              <Text style={styles.guestTitle}>{chatDict.emptyTitle}</Text>
              <Text style={styles.guestDesc}>{chatDict.emptyDesc}</Text>
            </Card>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/chat/${item.id}`)}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <Card style={styles.row}>
                <View style={styles.avatarWrap}>
                  {item.contextImageUrl ? (
                    <Image
                      source={{ uri: item.contextImageUrl }}
                      style={styles.fill}
                      contentFit="cover"
                    />
                  ) : (
                    <Icons.MessageSquare size={20} color={Colors.textMuted} />
                  )}
                </View>
                <View style={styles.rowTextCol}>
                  <View style={styles.rowNameLine}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.otherUserName || chatDict.unknownUser}
                    </Text>
                    {item.otherUserIsVip && <VipBadge label={dict.vip.badgeLabel} />}
                  </View>
                  <Text style={styles.rowContext} numberOfLines={1}>
                    {item.contextLabel}
                  </Text>
                  <Text style={styles.rowPreview} numberOfLines={1}>
                    {item.lastMessagePreview}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
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
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pinnedWrap: {
    marginBottom: Spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
  },
  guestCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 340,
  },
  guestIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radii.xl,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  guestDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  guestButton: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.xl,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  rowTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowName: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    flexShrink: 1,
  },
  rowContext: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  rowPreview: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
});