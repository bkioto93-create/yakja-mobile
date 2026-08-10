// مسیر فایل: components/NotificationBell.tsx
//
// 🛠️ اصلاح (فاز ۱۰ موبایل — قابلیت «ولایت»): این کامپوننت از این پس داخل components/province/
// ProvinceBar.tsx (پس‌زمینه‌ی تیره) رندر می‌شود، نه در هدرِ بومیِ سفیدِ قبلیِ هر تب (که کاملاً
// حذف شد — رجوع کنید به کامنت بالای app/(tabs)/_layout.tsx). یک prop اختیاری تازه‌ی color
// اضافه شد تا رنگ حالتِ «بدون اعلانِ خوانده‌نشده» قابل‌تنظیم باشد؛ پیش‌فرضش همان رنگ قبلی
// (Colors.textMain) است تا اگر روزی جای دیگری هم (روی پس‌زمینه‌ی روشن) استفاده شد، دست‌نخورده
// بماند. رنگِ حالتِ «اعلانِ خوانده‌نشده» (Colors.primary) عمداً تغییر نکرد — آن رنگ (فیروزه‌ای
// برند) روی هر دو پس‌زمینه‌ی روشن/تیره به‌خوبی دیده می‌شود (دقیقاً همان رنگی که آیکونِ
// Icons.MapPin هم در همین ProvinceBar استفاده می‌کند).
// معادل موبایلِ src/components/chat/NotificationBell.tsx + UnreadChatCountProvider.tsx وب —
// زنگوله‌ی اعلانی که در سرصفحه‌ی هر ۵ تب نشان داده می‌شود (رجوع کنید به سیم‌کشیِ
// app/(tabs)/_layout.tsx). فعلاً تنها منبعِ اعلان، پیام‌های خوانده‌نشده‌ی چت است — دقیقاً همان
// دامنه‌ی فعلیِ خودِ وب (اسمِ کامپوننت و آیکونِ زنگوله عمداً عمومی نگه داشته شده، برای این‌که اگر
// روزی نوعِ دیگری از اعلان اضافه شد، فقط منطقِ داخلِ همین یک کامپوننت عوض شود).
//
// **معادل‌سازیِ Realtime (بدون فیلتر روی یک گفتگوی خاص):** برخلاف app/chat/[id].tsx (که فقط
// پیام‌های همان یک گفتگو را گوش می‌دهد)، این کامپوننت در همه‌جای اپ دیده می‌شود و نمی‌تواند از
// قبل بداند کاربر عضوِ کدام گفتگوهاست — پس دقیقاً هم‌الگو با ActiveDriversList (فاز M03،
// event: '*' بدون فیلتر روی کل جدول drivers)، اینجا هر INSERT تازه روی کل جدولِ chat_messages
// باعثِ یک بازخوانیِ سبکِ شمارش می‌شود (نه محاسبه‌ی محلی از رویِ payload، چون منطقِ «خوانده‌نشده
// چیست؟» پیچیده و سرور-محور است).
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getUnreadChatCount } from '@/lib/chat/api';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from './ui/Icons';

export function NotificationBell({ color = Colors.textMain }: { color?: string } = {}) {
  const { user } = useAuth();
  const dict = useDictionary();
  const router = useRouter();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) {
      setCount(0);
      return;
    }
    getUnreadChatCount().then(setCount);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notification-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  // کاربرِ مهمان هیچ‌وقت گفتگویی ندارد — دقیقاً هم‌رفتار با getUnreadChatCount وب که برای او
  // همیشه صفر برمی‌گرداند؛ اینجا حتی خودِ زنگوله هم نمایش داده نمی‌شود (فضای سرصفحه شلوغ نشود).
  if (!user) return null;

  const Icon = count > 0 ? Icons.BellSolid : Icons.BellOutline;

  return (
    <Pressable
      onPress={() => router.push('/chat')}
      accessibilityRole="button"
      accessibilityLabel={dict.notifications.ariaLabel}
      style={styles.wrap}>
      <Icon size={22} color={count > 0 ? Colors.primary : color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 4,
  },
  badge: {
    position: 'absolute',
    top: 2,
    end: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: '#fff',
  },
});