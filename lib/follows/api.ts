// مسیر فایل: lib/follows/api.ts
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — لایه‌ی خواندن/نوشتنِ موبایل
// برای فالو. دقیقاً هم‌الگو با lib/reports/mutations.ts: هر تابع یک Route تازه‌ی پل موبایل صدا
// می‌زند (چون جدولِ follows/notifications هیچ Policy عمومی/anon ندارد — دقیقاً همان استدلالِ
// reports/users).
import { apiFetch } from '@/lib/session';

export type FollowState = {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  followersCount: number;
  followingCount: number;
};

export type FollowActionResult =
  | { success: true; isFollowing: boolean; isMutual: boolean }
  | { success: false; error: string };

export class FollowApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export async function getFollowState(targetUserId: string): Promise<FollowState> {
  const res = await apiFetch(`/api/mobile/v1/users/${targetUserId}/follow-state`);
  return res.json();
}

export async function followUser(targetUserId: string): Promise<FollowActionResult> {
  const res = await apiFetch(`/api/mobile/v1/users/${targetUserId}/follow`, { method: 'POST' });
  return res.json();
}

export async function unfollowUser(targetUserId: string): Promise<FollowActionResult> {
  const res = await apiFetch(`/api/mobile/v1/users/${targetUserId}/follow`, { method: 'DELETE' });
  return res.json();
}

export type FollowListItem = {
  id: string;
  name: string | null;
  isVip: boolean;
  photoUrl: string | null;
  followedAt: string;
};

export type FollowListPage = {
  items: FollowListItem[];
  nextCursor: string | null;
};

export async function getFollowers(userId: string, cursor: string | null): Promise<FollowListPage> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const res = await apiFetch(`/api/mobile/v1/users/${userId}/followers${qs}`);
  return res.json();
}

export async function getFollowing(userId: string, cursor: string | null): Promise<FollowListPage> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const res = await apiFetch(`/api/mobile/v1/users/${userId}/following${qs}`);
  return res.json();
}