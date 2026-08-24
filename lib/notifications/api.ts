// مسیر فایل: lib/notifications/api.ts
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — لایه‌ی خواندنِ اعلان‌ها
// (فعلاً فقط انواعِ فالو: follow/follow_back) برای موبایل. دقیقاً هم‌الگو با lib/follows/api.ts
// کنارش.
import { apiFetch } from '@/lib/session';

export type FollowNotificationType = 'follow' | 'follow_back';

export type NotificationItem = {
  id: string;
  type: FollowNotificationType;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    isVip: boolean;
    photoUrl: string | null;
  };
};

export type NotificationsPage = {
  items: NotificationItem[];
  nextCursor: string | null;
};

export async function getUnreadFollowNotificationCount(): Promise<number> {
  try {
    const res = await apiFetch('/api/mobile/v1/notifications/unread-count');
    const data = await res.json();
    return typeof data?.count === 'number' ? data.count : 0;
  } catch {
    return 0;
  }
}

export async function getMyNotifications(cursor: string | null): Promise<NotificationsPage> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const res = await apiFetch(`/api/mobile/v1/notifications${qs}`);
  return res.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/api/mobile/v1/notifications/mark-read', { method: 'POST' }).catch(() => {});
}