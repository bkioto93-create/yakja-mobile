// مسیر فایل: app/contact.tsx — معادل /contact وب — فاز M00B، تسک ۶ (نسخه‌ی واقعی)
// محتوا کاملاً از dict.contact خوانده می‌شود (طبق الزام قطعی ۲)؛ هیچ متنی اینجا هاردکد نشده.
// شماره‌ی پشتیبانی با یک لمس تماس می‌گیرد (Linking `tel:`) و دامنه با یک لمس در مرورگر باز
// می‌شود — دقیقاً همان رفتار «تماس یک‌لمسی» که در بقیه‌ی فازها (M02 تا M06) هم استفاده خواهد شد.
import { AdminSupportChatEntry } from '@/components/chat/AdminSupportChatEntry';
import { Card } from '@/components/ui/Card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactScreen() {
  const dict = useDictionary();
  const { user } = useAuth();
  const c = dict.contact;
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ آخرین آیتمِ صفحه زیرِ نوار ناوبریِ سیستمیِ اندروید.
  const insets = useSafeAreaInsets();

  const rows: {
    key: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
    onPress?: () => void;
  }[] = [
    {
      key: 'phone',
      icon: 'call',
      label: c.phoneLabel,
      value: c.phoneVal,
      onPress: () => Linking.openURL(`tel:${c.phoneVal.replace(/\s/g, '')}`),
    },
    {
      key: 'address',
      icon: 'location',
      label: c.addressLabel,
      value: c.addressVal,
    },
    {
      key: 'domain',
      icon: 'globe',
      label: c.domainLabel,
      value: c.domainVal,
      onPress: () => Linking.openURL(`https://${c.domainVal}`),
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: c.title }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Text style={styles.brand}>{c.brandVal}</Text>

        {rows.map((row) => (
          <Card key={row.key} style={styles.row}>
            <Pressable
              onPress={row.onPress}
              disabled={!row.onPress}
              style={styles.rowInner}>
              <View style={styles.iconWrap}>
                <Ionicons name={row.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.value}>{row.value}</Text>
              </View>
            </Pressable>
          </Card>
        ))}

        {/* **افزوده‌شده (چت با پشتیبانی):** طبق یادداشتِ خودِ کامپوننتِ وب، این یکی از سه نقطه‌ی
            استفاده است — برای کاربرِ مهمان هم نمایش داده می‌شود، خودش او را به ورود می‌برد. */}
        <AdminSupportChatEntry
          viewerId={user?.id ?? null}
          variant="card"
          dict={dict.chat.adminSupport}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  brand: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  row: {
    padding: 0,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  value: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginTop: 2,
  },
});