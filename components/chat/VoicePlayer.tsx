// مسیر فایل: components/chat/VoicePlayer.tsx
// نمایش/پخشِ یک پیامِ صوتیِ دریافتی داخلِ حبابِ پیام — دکمه‌ی پخش/توقف + نوارِ پیشرفت + مدت‌زمان.
import { Colors, Fonts, Radii } from '@/constants/theme';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '../ui/Icons';

function formatSeconds(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VoicePlayer({
  uri,
  durationSeconds,
  isOwn,
}: {
  uri: string;
  durationSeconds: number | null;
  isOwn: boolean;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  function toggle() {
    if (status.playing) {
      player.pause();
    } else {
      // اگر قبلاً تا انتها پخش شده، دوباره از اول شروع کن.
      if (status.currentTime >= status.duration && status.duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  }

  const PlayPauseIcon = status.playing ? Icons.Pause : Icons.Play;
  const total = status.duration > 0 ? status.duration : durationSeconds ?? 0;
  const progress = total > 0 ? Math.min(1, status.currentTime / total) : 0;
  const remaining = status.playing || status.currentTime > 0 ? total - status.currentTime : total;

  return (
    <Pressable
      onPress={toggle}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'توقف' : 'پخش'}>
      <View style={[styles.playButton, isOwn && styles.playButtonOwn]}>
        <PlayPauseIcon size={16} color={isOwn ? '#fff' : Colors.primary} />
      </View>
      <View style={styles.trackCol}>
        <View style={[styles.track, isOwn && styles.trackOwn]}>
          <View
            style={[
              styles.trackFill,
              isOwn && styles.trackFillOwn,
              { width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>
        <Text style={[styles.timeText, isOwn && styles.timeTextOwn]}>
          {formatSeconds(remaining)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 160,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(6,182,212,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonOwn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  trackCol: {
    flex: 1,
    gap: 3,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(6,182,212,0.2)',
    overflow: 'hidden',
  },
  trackOwn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  trackFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  trackFillOwn: {
    backgroundColor: '#fff',
  },
  timeText: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  timeTextOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
});