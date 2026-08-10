// مسیر فایل: components/chat/ChatButton.tsx
// معادل موبایلِ src/components/chat/ChatButton.tsx وب — دکمه‌ی مشترکِ «چت با ...»، آماده برای
// استفاده روی هر ۴ ماژول (کالا، حمل‌ونقل، خدمات، املاک). دقیقاً هم‌روح با ReportButton موبایل
// (اگر در پروژه موجود باشد): یک کامپوننتِ مشترک، نه تکرار در هر ماژول.
//
// **نکته‌ی سیم‌کشی:** خودِ این کامپوننت کامل و مستقل است، اما هنوز داخلِ صفحاتِ جزئیاتِ
// آگهی/راننده/متخصص/ملک قرار داده نشده — آن سیم‌کشی (importکردن این دکمه در هرکدام از آن ۴
// صفحه، با contextType/contextId/ownerیِ درست) به فازِ بعدیِ هم‌سازی موکول شد. خودِ دکمه از
// همین الان کاملاً کاربردی است.
//
// برای کاربرِ مهمان (viewerId=null)، به‌جای صدازدنِ اکشن، مستقیم به صفحه‌ی ورود می‌رود.
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { ChatContextType } from '@/lib/chat/api';
import { startConversation } from '@/lib/chat/mutations';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export type ChatButtonDict = {
  label: string;
  errors: {
    cannotChatWithSelf: string;
    dailyLimitReached: string;
    dbError: string;
    generic: string;
  };
};

export function ChatButton({
  viewerId,
  contextType,
  contextId,
  ownerId,
  dict,
  variant = 'secondary',
}: {
  viewerId: string | null;
  contextType: Exclude<ChatContextType, 'admin_support'>;
  contextId: string;
  ownerId: string;
  dict: ChatButtonDict;
  variant?: 'primary' | 'secondary';
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  // صاحبِ خودِ آگهی/پروفایل، دکمه‌ی چت با خودش را نمی‌بیند.
  if (viewerId === ownerId) return null;

  if (!viewerId) {
    return (
      <Button
        title={dict.label}
        variant={variant}
        onPress={() => router.push('/auth/login')}
      />
    );
  }

  async function handlePress() {
    setIsPending(true);
    const result = await startConversation(contextType, contextId, ownerId);
    setIsPending(false);

    if (!result.success) {
      const code = result.error as keyof ChatButtonDict['errors'];
      showToast(dict.errors[code] ?? dict.errors.generic, 'error');
      return;
    }
    router.push(`/chat/${result.conversationId}`);
  }

  return (
    <Button title={dict.label} variant={variant} onPress={handlePress} disabled={isPending} />
  );
}