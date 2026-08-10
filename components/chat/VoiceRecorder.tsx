// مسیر فایل: components/chat/VoiceRecorder.tsx
// معادل موبایلِ بخشِ ضبطِ صدای src/app/[lang]/chat/[id]/ChatThreadClient.tsx وب — دقیقاً همان
// ماشین‌حالتِ ساده: idle → recording → uploading → (idle | ارسال‌شد). یک دکمه‌ی میکروفون که با
// تپ اول ضبط را شروع می‌کند و با تپ دوم ضبط را تمام و ارسال می‌کند؛ در حینِ ضبط، یک دکمه‌ی لغوِ
// جداگانه (سطل زباله) هم کنارش ظاهر می‌شود — عیناً هم‌رفتار با وب (بدون گرفتن-و-نگه‌داشتن،
// بدون قطعِ خودکار در سقفِ ۱۲۰ثانیه‌ای؛ وب هم چنین قطعِ خودکاری ندارد، سرور فقط مدت را کوتاه
// می‌کند).
//
// **وابستگیِ تازه‌ی لازم:** پروژه‌ی موبایل تا الان هیچ کتابخانه‌ی ضبطِ صدا نداشت. `expo-audio`
// (کتابخانه‌ی فعلیِ توصیه‌شده‌ی خودِ Expo، جایگزینِ expo-av منسوخ‌شده — دقیقاً هم‌خانواده با
// expo-video که قبلاً برای پخشِ ویدئوی استوری اضافه شد) اضافه شد — پیش از استفاده از این فایل،
// اجرا کنید: `npx expo install expo-audio`.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { sendVoiceMessage, uploadVoiceMessage, VoiceMessageError } from '@/lib/chat/mutations';
import {
    AudioModule,
    RecordingPresets,
    useAudioRecorder,
    useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../ui/Icons';
import { Spinner } from '../ui/Spinner';

export type VoiceRecorderDict = {
  recordVoiceLabel: string;
  cancelRecordingLabel: string;
  recordingInProgress: string;
  uploadingVoice: string;
  errors: {
    voiceNotSupported: string;
    microphonePermissionDenied: string;
    uploadFailed: string;
    invalidVoiceData: string;
    unauthorized: string;
    generic: string;
  };
};

function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VoiceRecorder({
  conversationId,
  dict,
  onSent,
  onError,
}: {
  conversationId: string;
  dict: VoiceRecorderDict;
  onSent: () => void;
  onError: (message: string) => void;
}) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 500);
  const [isUploading, setIsUploading] = useState(false);

  const isRecording = recorderState.isRecording;

  async function handleStart() {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      onError(dict.errors.microphonePermissionDenied);
      return;
    }

    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch {
      onError(dict.errors.voiceNotSupported);
    }
  }

  function handleCancel() {
    audioRecorder.stop();
  }

  async function handleStopAndSend() {
    // مدت‌زمانِ لحظه‌ی توقف را همین‌جا نگه می‌داریم — چون بعد از await audioRecorder.stop()،
    // recorderState دیگر مقدارِ لحظه‌ی توقف را نشان نمی‌دهد.
    const finalSeconds = Math.round(recorderState.durationMillis / 1000);
    await audioRecorder.stop();

    if (finalSeconds < 1) return; // ضبطِ خیلی کوتاه/تصادفی — بی‌صدا نادیده گرفته می‌شود.

    const uri = audioRecorder.uri;
    if (!uri) {
      onError(dict.errors.uploadFailed);
      return;
    }

    setIsUploading(true);
    try {
      const { voicePath } = await uploadVoiceMessage(conversationId, uri);
      const result = await sendVoiceMessage(conversationId, voicePath, finalSeconds);
      if (!result.success) {
        const code = result.error as keyof VoiceRecorderDict['errors'];
        onError(dict.errors[code] ?? dict.errors.generic);
      } else {
        onSent();
      }
    } catch (err) {
      if (err instanceof VoiceMessageError) {
        const code = err.code as keyof VoiceRecorderDict['errors'];
        onError(dict.errors[code] ?? dict.errors.generic);
      } else {
        onError(dict.errors.generic);
      }
    } finally {
      setIsUploading(false);
    }
  }

  // پاک‌سازی — اگر کامپوننت هنگام ضبط از درخت خارج شود (مثلاً کاربر از صفحه خارج شد)، ضبطِ
  // نیمه‌کاره متوقف می‌شود تا میکروفون آزاد بماند.
  useEffect(() => {
    return () => {
      if (audioRecorder.isRecording) audioRecorder.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isUploading) {
    return (
      <View style={styles.statusRow}>
        <Spinner size="small" />
        <Text style={styles.statusText}>{dict.uploadingVoice}</Text>
      </View>
    );
  }

  if (isRecording) {
    return (
      <View style={styles.recordingRow}>
        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel={dict.cancelRecordingLabel}
          style={styles.cancelButton}>
          <Icons.Trash size={18} color={Colors.danger} />
        </Pressable>

        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>
            {dict.recordingInProgress} · {formatSeconds(Math.round(recorderState.durationMillis / 1000))}
          </Text>
        </View>

        <Pressable
          onPress={handleStopAndSend}
          accessibilityRole="button"
          accessibilityLabel={dict.recordVoiceLabel}
          style={styles.sendButton}>
          <Icons.Send size={18} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handleStart}
      accessibilityRole="button"
      accessibilityLabel={dict.recordVoiceLabel}
      style={styles.micButton}>
      <Icons.Mic size={20} color={Colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.xl,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cancelButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgBase,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  recordingText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    height: 44,
  },
  statusText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
});