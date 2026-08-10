// مسیر فایل: components/chat/AdminSupportChatEntry.tsx
// معادل موبایلِ src/components/chat/AdminSupportChatEntry.tsx وب — ورودیِ مشترکِ «چت با
// پشتیبانی/مدیریت»، برای استفاده در سه نقطه: تب پروفایل، صفحه‌ی تماس با ما، و بالای فهرستِ
// «چت‌های من» (به‌صورت یک ردیفِ ثابت/پین‌شده).
//
// دقیقاً هم‌روح با ChatButton.tsx: برای کاربرِ مهمان (viewerId=null)، به‌جای صدازدنِ اکشن،
// مستقیم به صفحه‌ی ورود می‌رود.
//
// دو حالتِ ظاهری، عیناً مثل وب:
//   - "card": کارتِ بزرگ با آیکون/عنوان/توضیح — برای پروفایل و تماس با ما.
//   - "listItem": ردیفِ هم‌شکل با بقیه‌ی ردیف‌های فهرستِ چت‌ها — برای بالای صفحه‌ی /chat.
//
// اگر existingConversationId از قبل مشخص باشد (چون صفحه‌ی فراخوان، مثل app/chat/index.tsx، به‌هرحال
// getMyConversations را صدا زده و می‌داند)، لمس مستقیماً به همان گفتگو می‌رود — بدون صدازدنِ
// دوباره‌ی اکشنِ سرور. در غیرِ این‌صورت (پروفایل/تماس‌با‌ما)، لمس اکشنِ Idempotent سرور را صدا
// می‌زند.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { startAdminSupportConversation } from '@/lib/chat/mutations';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../ui/Icons';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/Toast';

export type AdminSupportChatDict = {
  title: string;
  description: string;
  startButton: string;
  loginRequiredButton: string;
  errors: Record<string, string>;
};

export function AdminSupportChatEntry({
  viewerId,
  variant,
  existingConversationId = null,
  subtitle,
  dict,
}: {
  viewerId: string | null;
  variant: 'card' | 'listItem';
  existingConversationId?: string | null;
  // فقط برای variant="listItem" — متنِ پویا (پیش‌نمایشِ آخرین پیام یا نشانِ «در انتظار پاسخ»)؛
  // اگر داده نشود، dict.description جایگزین می‌شود.
  subtitle?: string;
  dict: AdminSupportChatDict;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const displaySubtitle = subtitle ?? dict.description;

  async function handlePress() {
    if (existingConversationId) {
      router.push(`/chat/${existingConversationId}`);
      return;
    }
    setIsPending(true);
    const result = await startAdminSupportConversation();
    setIsPending(false);

    if (!result.success) {
      showToast(dict.errors[result.error] ?? dict.errors.generic, 'error');
      return;
    }
    router.push(`/chat/${result.conversationId}`);
  }

  if (!viewerId) {
    return (
      <Pressable
        onPress={() => router.push('/auth/login')}
        style={({ pressed }) => [
          variant === 'card' ? styles.cardWrap : styles.listItemWrap,
          pressed && styles.pressed,
        ]}>
        <EntryContent variant={variant} isPending={false} title={dict.title} subtitle={displaySubtitle} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isPending}
      style={({ pressed }) => [
        variant === 'card' ? styles.cardWrap : styles.listItemWrap,
        pressed && styles.pressed,
        isPending && styles.disabled,
      ]}>
      <EntryContent variant={variant} isPending={isPending} title={dict.title} subtitle={displaySubtitle} />
    </Pressable>
  );
}

function EntryContent({
  variant,
  isPending,
  title,
  subtitle,
}: {
  variant: 'card' | 'listItem';
  isPending: boolean;
  title: string;
  subtitle: string;
}) {
  const iconSize = variant === 'card' ? 40 : 48;
  return (
    <View style={variant === 'card' ? styles.cardInner : styles.listItemInner}>
      <View style={[styles.iconWrap, { width: iconSize, height: iconSize }]}>
        {isPending ? (
          <Spinner size="small" />
        ) : (
          <Icons.MessageSquare size={variant === 'card' ? 20 : 22} color={Colors.primary} />
        )}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  // --- variant="card" ---
  cardWrap: {
    borderRadius: Radii.xl,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  // --- variant="listItem" ---
  listItemWrap: {
    borderRadius: Radii.xl,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  listItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: 14,
  },
  iconWrap: {
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
});