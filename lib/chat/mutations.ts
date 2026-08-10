// مسیر فایل: lib/chat/mutations.ts
// قابلیت چت — عملیات نوشتنی (نیازمند احراز هویت)، از پل موبایل.
//
// **افزوده‌شده (فاز ب — پیامِ صوتی):** پیش از این فقط متن بود. حالا createVoiceUploadSlot و
// sendVoiceMessage هم اضافه شدند، دقیقاً هم‌الگو با createSignedStoryUploadSlot/createStoryAction
// (lib/stories/mutations.ts): گام اول یک آدرسِ آپلودِ امضاشده می‌گیرد، سپس مستقیماً به Storage
// آپلود می‌شود (بدون عبور از سرور Next.js)، بعد ثبتِ نهایی.
//
// **نکته‌ی فنی درباره‌ی پسوندِ فایل:** createVoiceUploadSlotAction وب مسیرِ فایل را همیشه با
// پسوندِ `.webm` می‌سازد (چون مرورگر همیشه webm ضبط می‌کند) — این پسوند فقط بخشی از نامِ فایل
// است، نه یک اعتبارسنجیِ نوع‌محتوا. موبایل فرمتِ بومیِ ضبطِ خودش (m4a) را با همان مسیر آپلود
// می‌کند، اما contentType واقعی را درست تنظیم می‌کند — هنگامِ پخش، مرورگر/پخش‌کننده بر اساسِ
// هدرِ Content-Type واقعی (که در لحظه‌ی آپلود تنظیم شد) عمل می‌کند، نه بر اساسِ پسوندِ گمراه‌کننده‌ی
// نامِ فایل.
import { apiFetch } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import type { ChatContextType } from './api';

const VOICE_BUCKET = 'chat-voice-messages';

type ActionResult = { success: true } | { success: false; error: string };

export async function sendTextMessage(
  conversationId: string,
  content: string
): Promise<ActionResult> {
  const res = await apiFetch(`/api/mobile/v1/chat/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return res.json();
}

export async function markConversationAsRead(conversationId: string): Promise<ActionResult> {
  const res = await apiFetch(`/api/mobile/v1/chat/${conversationId}/read`, { method: 'POST' });
  return res.json();
}

export async function startConversation(
  contextType: Exclude<ChatContextType, 'admin_support'>,
  contextId: string,
  ownerId: string
): Promise<{ success: true; conversationId: string } | { success: false; error: string }> {
  const res = await apiFetch('/api/mobile/v1/chat/start', {
    method: 'POST',
    body: JSON.stringify({ contextType, contextId, ownerId }),
  });
  return res.json();
}

export class VoiceMessageError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

type SignedUploadSlot = { path: string; token: string };
type VoiceSlotResponse = { success: true; slot: SignedUploadSlot } | { success: false; error: string };

/**
 * ضبط تمام شد → آپلودِ مستقیم به Storage. مسیرِ کاملِ گامِ ۱ (گرفتنِ Slot) + گامِ ۲ (آپلود) در
 * همین یک تابع، دقیقاً هم‌الگو با uploadStoryMedia (lib/stories/mutations.ts).
 */
export async function uploadVoiceMessage(
  conversationId: string,
  localUri: string
): Promise<{ voicePath: string }> {
  const slotRes = await apiFetch(`/api/mobile/v1/chat/${conversationId}/voice-upload-slot`, {
    method: 'POST',
  });
  const slotData: VoiceSlotResponse = await slotRes.json();
  if (!slotData.success) throw new VoiceMessageError(slotData.error);

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(VOICE_BUCKET)
    .uploadToSignedUrl(slotData.slot.path, slotData.slot.token, blob, {
      // فرمتِ واقعیِ ضبط‌شده توسط expo-audio روی هر دو پلتفرم m4a/AAC است؛ رجوع کنید به
      // یادداشتِ بالای فایل درباره‌ی این‌که پسوندِ .webm در خودِ مسیر صرفاً اسمی است.
      contentType: 'audio/m4a',
    });
  if (error) throw new VoiceMessageError('uploadFailed');

  return { voicePath: slotData.slot.path };
}

export async function sendVoiceMessage(
  conversationId: string,
  voicePath: string,
  durationSeconds: number
): Promise<ActionResult> {
  const res = await apiFetch(`/api/mobile/v1/chat/${conversationId}/voice`, {
    method: 'POST',
    body: JSON.stringify({ voicePath, durationSeconds }),
  });
  return res.json();
}

/**
 * قابلیت «چت با پشتیبانی» — Idempotent، دقیقاً هم‌الگو با startConversation بالا. اگر گفتگو از
 * قبل وجود داشت (pending/active)، همان شناسه برمی‌گردد.
 */
export async function startAdminSupportConversation(): Promise<
  { success: true; conversationId: string } | { success: false; error: string }
> {
  const res = await apiFetch('/api/mobile/v1/chat/support/start', { method: 'POST' });
  return res.json();
}