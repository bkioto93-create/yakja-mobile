// مسیر فایل: components/ErrorBoundary.tsx
// 🆕 سیستمِ تازه‌ی «مانعِ خطای سراسری» — طبق بازخوردِ کارفرما («اپ موقعِ بازکردن بلافاصله کرش
// می‌کرد و کامل می‌رفت بیرون»): تا پیش از این، اپ هیچ Error Boundaryی نداشت — یعنی اگر هر
// خطای گرفته‌نشده‌ای (فارغ از این‌که از کدامین بخش، امروز یا در آینده) در حینِ رندر رخ می‌داد،
// React هیچ راهی برای «نمایشِ یک صفحه‌ی جایگزین» نداشت و کلِ اپ کرش می‌کرد و کاربر می‌افتاد
// بیرون — دقیقاً همان تجربه‌ای که گزارش شد.
//
// این کامپوننت، دقیقاً طبق الگوی رسمیِ خودِ React (Class Component با
// getDerivedStateFromError/componentDidCatch — Error Boundary فقط با Class Component ممکن
// است، هنوز معادلِ Hookی رسمی ندارد)، دورِ کلِ درختِ اپ در app/_layout.tsx قرار می‌گیرد. اگر
// در آینده هر جای دیگری از اپ یک خطای گرفته‌نشده رخ بدهد، کاربر به‌جای کرشِ کاملِ اپ، یک
// صفحه‌ی آرام و قابل‌فهم می‌بیند — با یک دکمه‌ی «تلاشِ دوباره» که فقط state را ریست می‌کند (بدونِ
// نیاز به بستن و بازکردنِ دستیِ اپ).
//
// **محدودیتِ ذاتیِ Error Boundary (طبق خودِ مستنداتِ React، نه یک نقصِ این پیاده‌سازی):** فقط
// خطاهای حینِ رندر/lifecycle را می‌گیرد — نه خطاهای داخلِ event handler ها (onPress و مانند آن،
// که خودشان باید try/catch داشته باشند) و نه خطاهای داخلِ Promise/async که جدا مدیریت می‌شوند.
// یعنی این یک مکملِ مواردِ دیگر است (مثلِ سخت‌سازیِ try/catch دورِ NavigationBar در
// app/_layout.tsx)، نه جایگزینِ آن‌ها.
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // فقط برای دیباگِ محلی — هیچ سرویسِ ثالثی اینجا صدا زده نمی‌شود (بدونِ وابستگیِ تازه).
    console.error('[ErrorBoundary] خطای گرفته‌نشده:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>یه مشکلی پیش اومد</Text>
          <Text style={styles.desc}>
            نگران نباشید، اطلاعاتِ شما جایی از دست نرفته. لطفاً دوباره امتحان کنید.
          </Text>
          <Pressable onPress={this.handleRetry} style={styles.button}>
            <Text style={styles.buttonText}>تلاشِ دوباره</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  desc: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  button: {
    minWidth: 160,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#fff',
  },
});