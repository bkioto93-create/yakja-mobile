// مسیر فایل: components/FollowActivityBell.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، سیستم «دنبال‌کردن») — معادلِ موبایلیِ
// src/components/follows/FollowActivityBell.tsx وب. از نظرِ جایگاه، خواهرِ
// components/NotificationBell.tsx (چت) است — هر دو داخلِ components/province/ProvinceBar.tsx
// کنارِ هم رندر می‌شوند.
//
// **عمداً بدون Realtime** — دقیقاً همان دلیلِ وب (رجوع کنید به کامنتِ کاملِ بالای
// src/app/api/mobile/v1/notifications/unread-count/route.ts): افزودنِ Realtime روی جدولِ
// notifications نیازمندِ یک Policy عمومیِ پرریسک است. عدد فقط در mount شدن (و با refresh()
// صدازدنیِ دستی بعدِ بازگشت از صفحه‌ی فعالیت‌ها) به‌روز می‌شود.
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getUnreadFollowNotificationCount } from '@/lib/notifications/api';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from './ui/Icons';

export function FollowActivityBell({ color = '#0f172a' }: { color?: string } = {}) {
  const { user } = useAuth();
  const dict = useDictionary();
  const router = useRouter();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) {
      setCount(0);
      return;
    }
    getUnreadFollowNotificationCount().then(setCount);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;

  const hasUnread = count > 0;
  const displayCount = count > 9 ? '9+' : String(count);

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={dict.follows.activityBellAriaLabel}>
      {hasUnread ? (
        <Icons.HeartSolid size={22} color={color} />
      ) : (
        <Icons.HeartOutline size={22} color={color} />
      )}
      {hasUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    end: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
});