// مسیر فایل: lib/push/registerForPushNotifications.ts
// قابلیت Push Notification (فاز موبایل) — درخواستِ اجازه، گرفتنِ Expo Push Token، و ثبت/حذفِ آن
// روی سرور.
//
// **وابستگیِ تازه‌ی لازم:** `expo-notifications` — پیش از استفاده از این فایل، اجرا کنید:
// `npx expo install expo-notifications`
//
// **پیش‌نیازِ حیاتی (بدون آن Push کار نمی‌کند):** گرفتنِ توکن به یک `projectId` معتبرِ EAS نیاز
// دارد (`Constants.expoConfig.extra.eas.projectId`). بررسیِ app.json فعلیِ پروژه نشان داد این
// مقدار هنوز تنظیم نشده — یعنی پروژه ظاهراً هنوز هیچ‌وقت `eas init`/`eas build:configure` را
// اجرا نکرده. **این یک قدمِ یک‌بارمصرف است که باید خودتان (با حساب Expo/EAS خودتان) اجرا
// کنید** — من نمی‌توانم این‌کار را برایتان انجام دهم چون به حساب EAS شما نیاز دارد. بعد از اجرای
// `eas init`، این مقدار خودکار به app.json اضافه می‌شود.
import { apiFetch } from '@/lib/session';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// رفتارِ نمایشِ اعلان وقتی اپ در پیش‌زمینه (باز و روی صفحه) است — بدون این تنظیم، پیش‌فرضِ
// expo-notifications نمایش‌ندادنِ اعلان در پیش‌زمینه است؛ اینجا عمداً همیشه نمایش داده می‌شود
// (دقیقاً هم‌حسِ وب که زنگوله‌ی اعلان همیشه زنده و قابل‌مشاهده است).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * درخواستِ اجازه (اگر قبلاً داده نشده) + گرفتنِ Expo Push Token. اگر کاربر اجازه ندهد، یا
 * projectId تنظیم نشده باشد، یا هر خطای دیگری رخ دهد — بی‌صدا null برمی‌گرداند، نه throw؛ چون
 * نبودنِ Push نباید هرگز مانعِ استفاده‌ی عادی از اپ شود (دقیقاً هم‌فلسفه‌ی بقیه‌ی این فایل‌ها).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#06b6d4',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    // رجوع کنید به یادداشتِ بالای فایل — این پیام فقط برای دیباگِ توسعه‌دهنده است.
    console.warn('⚠️ EAS projectId در app.json تنظیم نشده؛ Push غیرفعال می‌ماند.');
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data;
  } catch {
    return null;
  }
}

export async function sendPushTokenToServer(expoPushToken: string): Promise<void> {
  try {
    await apiFetch('/api/mobile/v1/push/register', {
      method: 'POST',
      body: JSON.stringify({ expoPushToken, platform: Platform.OS }),
    });
  } catch {
    // best-effort — نبودِ اتصال یا خطای سرور هرگز نباید ورود/خروج کاربر را بشکند.
  }
}

export async function removePushTokenFromServer(expoPushToken: string): Promise<void> {
  try {
    await apiFetch('/api/mobile/v1/push/unregister', {
      method: 'POST',
      body: JSON.stringify({ expoPushToken }),
    });
  } catch {
    // best-effort
  }
}