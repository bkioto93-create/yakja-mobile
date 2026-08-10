// مسیر فایل: app/chat/[id].tsx
// معادل موبایلِ src/app/[lang]/chat/[id]/ChatThreadClient.tsx وب — صفحه‌ی یک گفتگو: تاریخچه‌ی
// پیام‌ها (زنده، از طریق Supabase Realtime، مستقیم با Anon Key — رجوع کنید به یادداشتِ کاملِ
// «چرا این یکی مستقیم است» پایین‌تر)، ارسالِ پیامِ متنی، علامت‌گذاریِ خودکارِ خوانده‌شده.
//
// **محدوده‌ی این تحویل (فاز الف — متن‌محور):** ضبط/ارسال/پخشِ پیامِ صوتی عمداً اینجا نیست —
// نیازمندِ یک کتابخانه‌ی تازه (expo-audio) است که با دقتِ کامل در فازِ ب اضافه خواهد شد. نوارِ
// وضعیتِ «در انتظار تاییدِ پشتیبانی» (مخصوصِ گفتگوی admin_support) هم به همان فاز موکول شد.
//
// **چرا Realtime اینجا مستقیم با Anon Key است، نه پل موبایل:** برخلاف تقریباً همه‌جای دیگرِ این
// اپ، جدولِ chat_messages یک Policy عمومیِ SELECT دارد — یک استثنای آگاهانه و مستندشده در خودِ
// وب (بند ۶.۱۸ سند راهبردی وب)، دقیقاً برای این‌که Realtime بدون auth.uid() بومیِ Supabase کار
// کند. یعنی موبایل می‌تواند دقیقاً همان کانالِ postgres_changes را که وب استفاده می‌کند مستقیم
// subscribe کند — بدون نیاز به هیچ زیرساختِ تازه. بارگذاریِ اولیه (خودِ گفتگو + تاریخچه‌ی
// پیام‌ها) و ارسالِ پیام هم‌چنان از پل موبایل رد می‌شوند، چون آن‌ها به بررسیِ عضویت/دسترسی و
// Join با جدولِ users نیاز دارند.
//
// **یادداشتِ فنیِ به‌ارث‌رسیده:** Realtime پیش‌تر فقط برای «رانندگانِ فعال» (فاز M03) روی موبایل
// امتحان شده و به‌عنوانِ «نیازمندِ تاییدِ نهایی روی گوشیِ واقعی» علامت‌گذاری شده بود؛ اگر همان‌جا
// مشکلی نبود، اینجا هم نباید باشد (دقیقاً همان کلاینت/الگو). اگر وصل نشد: فهرستِ پیام‌ها هنوز با
// همان بارگذاریِ اولیه درست کار می‌کند، فقط «پیامِ تازه بدون رفرش» کار نخواهد کرد؛ رفعِ
// احتمالی: افزودنِ `import 'react-native-url-polyfill/auto';` به ابتدای lib/supabase.ts.
import { ChatRetentionNotice } from '@/components/chat/ChatRetentionNotice';
import { VoicePlayer } from '@/components/chat/VoicePlayer';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { Icons } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { VipBadge } from '@/components/vip/VipBadge';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { ChatMessageView, ConversationView, getConversationThread } from '@/lib/chat/api';
import { markConversationAsRead, sendTextMessage } from '@/lib/chat/mutations';
import { supabase } from '@/lib/supabase';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dict = useDictionary();
  const chatDict = dict.chat;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conversation, setConversation] = useState<ConversationView | null>(null);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const listRef = useRef<FlatList<ChatMessageView>>(null);
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): نوارِ
  // متن‌ورودی/ارسال همیشه پایینِ صفحه می‌نشیند (خارج از FlatList)، پس بدون این padding روی
  // اندروید درست زیرِ نوار ناوبریِ سیستم قرار می‌گرفت — دکمه‌ی ارسال/میکروفون به‌سختی قابل‌لمس
  // بود. وقتی کیبورد باز است KeyboardAvoidingView خودش محتوا را بالا می‌کشد، پس این padding فقط
  // در حالتِ بسته‌بودنِ کیبورد اثرِ محسوس دارد — دقیقاً همان زمانی که مشکل بود.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!id) return;
    getConversationThread(id, { contextFallbackLabel: chatDict.contextFallbackLabel })
      .then((result) => {
        if (!result) {
          setNotFound(true);
          return;
        }
        setConversation(result.conversation);
        setMessages(result.messages);
        seenMessageIdsRef.current = new Set(result.messages.map((m) => m.id));
        void markConversationAsRead(id);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // اشتراک زنده‌ی Realtime — دقیقاً هم‌الگو با app/(tabs)/transport.tsx (ActiveDriversList، فاز
  // M03)، فقط اینجا با filter روی همین یک گفتگو (نه کلِ جدول).
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`conversation-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            message_type: 'text' | 'voice';
            content: string | null;
            voice_duration_seconds: number | null;
            created_at: string;
          };

          if (seenMessageIdsRef.current.has(row.id)) return;
          seenMessageIdsRef.current.add(row.id);

          // **افزوده‌شده (فاز ب — پیامِ صوتی):** payload خامِ Realtime فقط voice_path را دارد،
          // نه یک URL قابل‌پخش — امضاکردنِ URL فقط سمت سرور (Service Role) ممکن است. به‌جای
          // ساختنِ یک Route اختصاصیِ فقط برای همین یک حالت، کل نخِ گفتگو دوباره خوانده می‌شود
          // (که آن URL امضاشده را درست برمی‌گرداند) — ساده، کم‌هزینه (چون طولِ یک گفتگوی
          // ۲۴ساعته معمولاً کوتاه است)، و همیشه درست.
          if (row.message_type === 'voice') {
            if (row.sender_id !== user?.id) void markConversationAsRead(id);
            getConversationThread(id, { contextFallbackLabel: chatDict.contextFallbackLabel }).then(
              (result) => {
                if (result) setMessages(result.messages);
              }
            );
            return;
          }

          if (row.sender_id !== user?.id) {
            void markConversationAsRead(id);
          }

          setMessages((prev) => [
            ...prev,
            {
              id: row.id,
              conversationId: id,
              senderId: row.sender_id,
              messageType: row.message_type,
              content: row.content,
              voiceUrl: null,
              voiceDurationSeconds: row.voice_duration_seconds,
              createdAt: row.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !id) return;

    setText('');
    setIsSending(true);
    const result = await sendTextMessage(id, trimmed);
    setIsSending(false);

    if (!result.success) return;

    const optimisticId = `optimistic-${Date.now()}`;
    seenMessageIdsRef.current.add(optimisticId);
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        conversationId: id,
        senderId: user?.id ?? '',
        messageType: 'text',
        content: trimmed,
        voiceUrl: null,
        voiceDurationSeconds: null,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (notFound || !conversation) {
    return (
      <>
        <Stack.Screen options={{ title: chatDict.notFoundTitle }} />
        <View style={styles.centered}>
          <Text style={styles.notFoundTitle}>{chatDict.notFoundTitle}</Text>
          <Text style={styles.notFoundDesc}>{chatDict.notFoundDesc}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerName} numberOfLines={1}>
                {conversation.otherUserName || chatDict.unknownUser}
              </Text>
              {conversation.otherUserIsVip && <VipBadge label={dict.vip.badgeLabel} />}
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.noticeWrap}>
          <ChatRetentionNotice message={chatDict.retentionNotice} />
          {/* **افزوده‌شده (چت با پشتیبانی):** وقتی گفتگو هنوز «در انتظار تاییدِ ادمین» است،
              دقیقاً هم‌رفتار با وب، یک پیامِ توضیحی جدا نشان داده می‌شود — متنِ متفاوت برای
              کاربرِ درخواست‌دهنده در برابرِ خودِ ادمین (که در عمل روی موبایل خیلی نادر است، چون
              پنلِ مدیریت فقط وب است، اما همان منطق برای درستی حفظ شد). */}
          {conversation.isAdminSupportChat && conversation.status === 'pending' && (
            <View style={styles.adminPendingWrap}>
              <ChatRetentionNotice
                message={
                  conversation.viewerIsSupportAdmin
                    ? chatDict.adminSupport.adminPendingNotice
                    : chatDict.adminSupport.userPendingNotice
                }
              />
            </View>
          )}
        </View>

        <FlatList
          ref={listRef}
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          data={messages}
          keyExtractor={(m) => m.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{chatDict.emptyThreadNotice}</Text>
          }
          renderItem={({ item }) => {
            const isOwn = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                {item.messageType === 'text' ? (
                  <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
                    {item.content}
                  </Text>
                ) : item.voiceUrl ? (
                  <VoicePlayer
                    uri={item.voiceUrl}
                    durationSeconds={item.voiceDurationSeconds}
                    isOwn={isOwn}
                  />
                ) : (
                  <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn, styles.bubbleMuted]}>
                    {chatDict.voiceUnavailable}
                  </Text>
                )}
              </View>
            );
          }}
        />

        {/* **افزوده‌شده (فاز ب — پیامِ صوتی):** وقتی متنِ ورودی خالی است، دکمه‌ی میکروفون
            به‌جای دکمه‌ی ارسالِ متن نشان داده می‌شود — کاربر یا متن می‌نویسد یا صدا ضبط می‌کند،
            هرگز هم‌زمان هر دو نه (دقیقاً هم‌رفتار با وب). */}
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={chatDict.messagePlaceholder}
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
            multiline
          />
          {text.trim() ? (
            <Pressable
              onPress={handleSend}
              disabled={isSending}
              style={[styles.sendButton, isSending && styles.sendButtonDisabled]}>
              {isSending ? <Spinner size="small" /> : <Icons.Send size={20} color="#fff" />}
            </Pressable>
          ) : (
            <VoiceRecorder
              conversationId={id}
              dict={chatDict}
              onSent={() => {
                // پیامِ صوتیِ خودمان هم مثل پیامِ صوتیِ طرفِ مقابل، از همان مسیرِ Realtime
                // (بازخوانیِ کل نخ) به لیست اضافه می‌شود؛ اینجا کارِ اضافه‌ای لازم نیست.
              }}
              onError={(message) => showToast(message, 'error')}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  notFoundTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  notFoundDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerName: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    maxWidth: 180,
  },
  noticeWrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  adminPendingWrap: {},
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radii.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMain,
    lineHeight: 19,
  },
  bubbleTextOwn: {
    color: '#fff',
  },
  bubbleMuted: {
    opacity: 0.7,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMain,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});