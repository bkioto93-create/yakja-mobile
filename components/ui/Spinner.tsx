// مسیر فایل: components/ui/Spinner.tsx
import { ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  return <ActivityIndicator size={size} color={Colors.primary} />;
}
