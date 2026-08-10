// مسیر فایل: lib/vip/mutations.ts
// قابلیت VIP — ثبتِ درخواستِ عضویت/تمدید، از پل موبایل (نیازمند احراز هویت).
import { apiFetch } from '@/lib/session';

export type PaymentMethod = 'bank' | 'exchange';
type CreateVipRequestResponse = { success: true } | { success: false; error: string };

export async function createVipRequestAction(
  paymentMethod: PaymentMethod,
  note: string
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await apiFetch('/api/mobile/v1/vip/request', {
    method: 'POST',
    body: JSON.stringify({ paymentMethod, note }),
  });
  const data: CreateVipRequestResponse = await res.json();
  return data;
}