// مسیر فایل: lib/media/videoUpload.ts
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، آپلود ویدئوی کوتاه VIP) — کمکِ مشترکِ انتخاب/اعتبارسنجیِ
// ویدئو، قابل‌استفاده در هر جایی که VIP بتواند یک ویدئوی کوتاه اضافه کند (فرم پروفایلِ راننده،
// و بعداً ویزاردهای کالا/متخصص/ملک).
//
// **تصمیمِ آگاهانه‌ی معماری — چرا بدون فشرده‌سازیِ سمتِ کلاینت (برخلافِ وب):** موتورِ
// فشرده‌سازیِ ویدئوی وب (src/lib/media/videoCompression.ts) کاملاً مبتنی‌بر API های
// مخصوصِ مرورگر است (Canvas.captureStream + MediaRecorder) — هیچ‌کدام در React Native/Expo
// وجود ندارند. جایگزینِ بومی (مثلِ ffmpeg-kit-react-native) یک وابستگیِ سنگین و پرریسک برای
// Build است، دقیقاً همان دلیلی که استوریِ موبایل هم قبلاً همین تصمیم را گرفته (رجوع کنید به
// کامنتِ کاملِ lib/stories/mutations.ts::uploadStoryMedia). این فایل عیناً همان تصمیم و همان
// الگو را برای ویدئوی VIP هم دنبال می‌کند: فایلِ خامِ انتخاب‌شده/ضبط‌شده مستقیم آپلود می‌شود،
// بدون هیچ فشرده‌سازیِ میانی.
//
// **چرا این با وب هم‌تراز کافی است:** بر خلافِ استوری (سقفِ سخت‌گیرانه‌ی ۱۵ ثانیه)، اینجا سقفِ
// مدت‌زمان همان ۶۰ ثانیه‌ی وب است (VIDEO_MAX_DURATION_SECONDS در
// src/app/[lang]/listings/new/NewListingWizard.tsx) — برای جبرانِ نبودِ فشرده‌سازی، این فایل یک
// سقفِ حجمِ خامِ محافظه‌کارانه‌تر از سقفِ ورودیِ وب (که چون خودش بعداً فشرده می‌کند، ۲۰۰ مگابایت
// اجازه می‌دهد) تعریف می‌کند — طبق بندِ «اینترنت ضعیف» سندِ راهبردی، آپلودِ خامِ چند ده مگابایتی
// روی ۲G/۳G عملاً غیرقابل‌تحمل است. اعتبارسنجیِ نهایی و غیرقابل‌دورزدنِ مدت‌زمان هم‌چنان سمتِ
// سرور انجام می‌شود (دقیقاً هم‌الگو با createStoryAction/saveDriverProfileAction).
import * as ImagePicker from 'expo-image-picker';

/** سقفِ مدت‌زمان — دقیقاً همان VIDEO_MAX_DURATION_SECONDS وب (۶۰ ثانیه). */
export const VIDEO_MAX_DURATION_SECONDS = 60;

/**
 * سقفِ حجمِ خامِ فایلِ ورودی — تصمیمِ مخصوصِ موبایل (رجوع کنید به یادداشتِ بالای فایل)، نه یک
 * کپیِ عینیِ MAX_SOURCE_VIDEO_BYTES وب (که چون بعداً فشرده می‌شود، عمداً سخاوتمندانه‌تر است).
 */
export const VIDEO_MAX_SOURCE_BYTES = 60 * 1024 * 1024; // ۶۰ مگابایت

export type PickedVideo = {
  uri: string;
  durationSeconds: number;
  sizeBytes: number;
  mimeType: string;
};

export class VideoPickError extends Error {
  code: 'invalidVideoType' | 'videoTooLarge' | 'invalidVideoDuration';
  constructor(code: VideoPickError['code']) {
    super(code);
    this.code = code;
  }
}

/**
 * از گالری یک ویدئوی تکی انتخاب می‌کند و همان‌جا (پیش از هرگونه آپلود) اعتبارسنجی می‌کند —
 * دقیقاً هم‌الگو با AddStorySection.tsx::handlePick. نتیجه‌ی null یعنی کاربر خودش لغو کرد یا
 * دسترسی گالری را رد کرد (نه یک خطای واقعی، پس نیازی به Toast نیست).
 */
export async function pickAndValidateVideo(): Promise<PickedVideo | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    quality: 1,
    videoMaxDuration: VIDEO_MAX_DURATION_SECONDS,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];

  // دفاع در عمق سمتِ کلاینت — دقیقاً همان الگوی AddStorySection: videoMaxDuration فقط برای
  // ضبطِ مستقیم با دوربین تضمین‌شده است، نه همیشه برای انتخاب از گالری.
  const durationSeconds = (asset.duration ?? 0) / 1000;
  if (durationSeconds > VIDEO_MAX_DURATION_SECONDS + 0.5) {
    throw new VideoPickError('invalidVideoDuration');
  }

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  if (blob.size > VIDEO_MAX_SOURCE_BYTES) {
    throw new VideoPickError('videoTooLarge');
  }
  if (!blob.type.startsWith('video/')) {
    throw new VideoPickError('invalidVideoType');
  }

  return {
    uri: asset.uri,
    durationSeconds,
    sizeBytes: blob.size,
    mimeType: blob.type || 'video/mp4',
  };
}