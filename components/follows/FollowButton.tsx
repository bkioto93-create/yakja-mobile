// مسیر فایل: components/follows/FollowButton.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — معادلِ موبایلیِ
// src/components/follows/FollowButton.tsx وب، دقیقاً همان سه حالت:
//   • هنوز فالو نمی‌کند + طرف هم بیننده را فالو نمی‌کند → دکمه‌ی پررنگ «فالو».
//   • هنوز فالو نمی‌کند ولی طرف از قبل بیننده را فالو می‌کند → دکمه‌ی پررنگ «فالو بک».
//   • از قبل فالو می‌کند → دکمه‌ی توخالی «دنبال می‌کنید»؛ با لمس، یک تاییدِ درون‌خطی («لغو فالو؟
//     بله / بیخیال») باز می‌شود — همان محافظتِ در برابرِ لمسِ تصادفی که وب هم دارد.
//
// state محلی (isFollowing) به‌صورت خوش‌بینانه فوراً به‌روز می‌شود؛ اگر تماسِ سرور شکست بخورد، به
// مقدارِ قبلی برمی‌گردد + Toast خطا.
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { followUser, unfollowUser } from '@/lib/follows/api';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type FollowButtonDict = {
  followButton: string;
  followBackButton: string;
  followingButton: string;
  unfollowConfirmQuestion: string;
  unfollowConfirmYes: string;
  unfollowConfirmCancel: string;
  errors: {
    unauthenticated: string;
    invalidTarget: string;
    userNotFound: string;
    dbError: string;
    generic: string;
  };
};

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialIsFollowedBy,
  dict,
  onLoginRequired,
  onChange,
}: {
  targetUserId: string;
  initialIsFollowing: boolean;
  initialIsFollowedBy: boolean;
  dict: FollowButtonDict;
  onLoginRequired?: () => void;
  onChange?: (state: { isFollowing: boolean; isMutual: boolean }) => void;
}) {
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isFollowedBy] = useState(initialIsFollowedBy);
  const [confirmingUnfollow, setConfirmingUnfollow] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  async function handleFollow() {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const result = await followUser(targetUserId);
      if (!result.success) {
        if (result.error === 'unauthenticated' && onLoginRequired) {
          onLoginRequired();
          return;
        }
        showToast((dict.errors as Record<string, string>)[result.error] ?? dict.errors.generic, 'error');
        return;
      }
      setIsFollowing(true);
      onChange?.({ isFollowing: true, isMutual: result.isMutual });
    } catch {
      showToast(dict.errors.generic, 'error');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUnfollow() {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const result = await unfollowUser(targetUserId);
      setConfirmingUnfollow(false);
      if (!result.success) {
        showToast((dict.errors as Record<string, string>)[result.error] ?? dict.errors.generic, 'error');
        return;
      }
      setIsFollowing(false);
      onChange?.({ isFollowing: false, isMutual: false });
    } catch {
      showToast(dict.errors.generic, 'error');
    } finally {
      setIsBusy(false);
    }
  }

  if (isFollowing) {
    if (confirmingUnfollow) {
      return (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>{dict.unfollowConfirmQuestion}</Text>
          <View style={styles.confirmActions}>
            <Pressable onPress={() => setConfirmingUnfollow(false)} disabled={isBusy} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{dict.unfollowConfirmCancel}</Text>
            </Pressable>
            <Pressable onPress={handleUnfollow} disabled={isBusy} style={styles.confirmBtn}>
              <Text style={styles.confirmBtnText}>{isBusy ? '…' : dict.unfollowConfirmYes}</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <Button
        title={dict.followingButton}
        variant="secondary"
        disabled={isBusy}
        onPress={() => setConfirmingUnfollow(true)}
        style={styles.button}
      />
    );
  }

  return (
    <Button
      title={isFollowedBy ? dict.followBackButton : dict.followButton}
      disabled={isBusy}
      onPress={handleFollow}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 110,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  confirmText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.danger,
    flexShrink: 1,
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  confirmBtn: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  confirmBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#fff',
  },
});