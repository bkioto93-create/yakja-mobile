// مسیر فایل: lib/chat/api.ts
// قابلیت چت — لایه‌ی خواندن (فهرست گفتگوها + باز کردن یک گفتگو)، از پل موبایل.
//
// چرا از پل موبایل، نه Anon Key مستقیم: خواندنِ «فهرستِ گفتگوهای من» و «جزئیاتِ یک گفتگو» به
// Joinِ چندجدولی (users برای نام/VIP طرف مقابل، و ۴ جدولِ context برای عنوان/عکس) نیاز دارد —
// دقیقاً هم‌الگو با درایورها/متخصصینِ صفحه‌ی اصلی. رجوع کنید به یادداشتِ کاملِ بالای
// src/app/api/mobile/v1/chat/route.ts در ریپازیتوری وب.
//
// **نکته‌ی fallback:** سرور برچسب‌های نمایشیِ خالی/نشانگر برمی‌گرداند (چون زبانِ کاربر را
// نمی‌داند)؛ این فایل همان‌جا، در لحظه‌ی دریافت، آن‌ها را با dict محلیِ موبایل جایگزین می‌کند —
// دقیقاً همان الگویی که برای ownerName استوری‌های صفحه‌ی اصلی هم استفاده شد.
import { apiFetch } from '@/lib/session';

export type ChatContextType = 'listing' | 'driver' | 'service_provider' | 'real_estate' | 'admin_support';
export type ConversationStatus = 'pending' | 'active' | 'rejected';

export type MyConversationRow = {
  id: string;
  contextType: ChatContextType;
  contextLabel: string;
  contextImageUrl: string | null;
  otherUserId: string;
  otherUserName: string | null;
  otherUserIsVip: boolean;
  lastMessagePreview: string;
  lastMessageAt: string;
  status: ConversationStatus;
  isAdminSupportChat: boolean;
};

export type ConversationView = {
  id: string;
  contextType: ChatContextType;
  contextId: string;
  otherUserId: string;
  otherUserName: string | null;
  otherUserIsVip: boolean;
  contextLabel: string;
  contextImageUrl: string | null;
  lastMessageAt: string;
  status: ConversationStatus;
  isAdminSupportChat: boolean;
  viewerIsSupportAdmin: boolean;
};

export type ChatMessageView = {
  id: string;
  conversationId: string;
  senderId: string;
  messageType: 'text' | 'voice';
  content: string | null;
  voiceUrl: string | null;
  voiceDurationSeconds: number | null;
  createdAt: string;
};

type ChatDictFallbacks = {
  contextFallbackLabel: string;
  voiceMessagePreview: string;
  noMessagesYet: string;
};

export async function getMyConversations(dict: ChatDictFallbacks): Promise<MyConversationRow[]> {
  const res = await apiFetch('/api/mobile/v1/chat');
  const data: { success: boolean; conversations: MyConversationRow[]; voiceMarker?: string } =
    await res.json();
  if (!data.success) return [];

  return data.conversations.map((row) => ({
    ...row,
    contextLabel: row.contextLabel || dict.contextFallbackLabel,
    lastMessagePreview:
      data.voiceMarker && row.lastMessagePreview === data.voiceMarker
        ? dict.voiceMessagePreview
        : row.lastMessagePreview || dict.noMessagesYet,
  }));
}

export async function getConversationThread(
  conversationId: string,
  dict: { contextFallbackLabel: string }
): Promise<{ conversation: ConversationView; messages: ChatMessageView[] } | null> {
  const res = await apiFetch(`/api/mobile/v1/chat/${conversationId}`);
  const data:
    | { success: true; conversation: ConversationView; messages: ChatMessageView[] }
    | { success: false; error: string } = await res.json();

  if (!data.success) return null;

  return {
    conversation: {
      ...data.conversation,
      contextLabel: data.conversation.contextLabel || dict.contextFallbackLabel,
    },
    messages: data.messages,
  };
}

// **افزوده‌شده (زنگوله‌ی اعلان):** شمارشِ «گفتگوهای خوانده‌نشده»، از پل موبایل — دقیقاً هم‌الگو
// با fetchUnreadChatCountAction وب. منطقِ «خوانده‌نشده چیست؟» (initiator/owner/صندوقِ مشترکِ
// ادمین) کاملاً پیچیده و سرور-محور است (به Join با users و بررسیِ نقش نیاز دارد)، پس این هم از
// پل موبایل رد می‌شود، نه محاسبه‌ی محلی.
export async function getUnreadChatCount(): Promise<number> {
  try {
    const res = await apiFetch('/api/mobile/v1/chat/unread-count');
    const data: { count: number } = await res.json();
    return data.count ?? 0;
  } catch {
    // آفلاین یا خطای سرور — زنگوله فقط شماره را صفر/قبلی نگه می‌دارد، هرگز کرش نمی‌کند.
    return 0;
  }
}