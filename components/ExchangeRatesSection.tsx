// مسیر فایل: components/ExchangeRatesSection.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب): معادل موبایلیِ src/app/[lang]/ExchangeRatesSection.tsx
// وب — بخشِ «اسعار» که تا پیش از این تسک، در کل پروژه‌ی موبایل وجود نداشت (تنها فیچرِ محتواییِ
// واقعاً جامانده‌ی صفحه‌ی اصلی؛ رجوع کنید به تحلیلِ کاملِ ارسال‌شده پیش از این تسک).
//
// **چرا Client Component با useEffect (نه یک تابعِ async مثل وب):** وب چون Next.js Server
// Component است، مستقیم و بدونِ state داخلِ خودِ رندر await می‌زند. React Native چنین مفهومی
// ندارد — این کامپوننت خودش یک useEffect دارد که در mount شدن (lib/exchangeRates/api.ts) را
// صدا می‌زند؛ دقیقاً هم‌الگو با بقیه‌ی صفحاتِ این پروژه (مثلاً app/(tabs)/index.tsx خودش برای
// showcase همین کار را می‌کند).
//
// **رفتارِ «کاملاً مخفی اگر داده خالی است» — عیناً حفظ شد:** اگر جدولِ Supabase هنوز خالی است
// (پیش از اولین اجرای Cron وب) یا خودِ Route پل موبایل خطا بدهد، این کامپوننت هیچ‌چیز رندر
// نمی‌کند (نه یک اسپینر ابدی، نه یک جدولِ خالی/شکسته) — دقیقاً همان تصمیمِ صریحِ کامنتِ بالای
// نسخه‌ی وب.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { ExchangeRateRow, getExchangeRates } from '@/lib/exchangeRates/api';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CurrencyConverter } from './CurrencyConverter';
import { Icons } from './ui/Icons';

export type ExchangeRatesSectionDict = {
  title: string;
  subtitle: string;
  sourceLabel: string;
  buyLabel: string;
  sellLabel: string;
  currencyLabel: string;
  trendLabel: string;
  afnLabel: string;
  converterTitle: string;
  amountPlaceholder: string;
  resultLabel: string;
  disclaimer: string;
  justNowLabel: string;
  minutesAgoTemplate: string;
  hoursAgoTemplate: string;
  perThousandBadgeLabel: string;
  perThousandNoteTemplate: string;
};

function formatRelativeTime(iso: string | null, dict: ExchangeRatesSectionDict): string {
  if (!iso) return '—';
  const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return dict.justNowLabel;
  if (diffMinutes < 60) return dict.minutesAgoTemplate.replace('{minutes}', String(diffMinutes));
  const diffHours = Math.floor(diffMinutes / 60);
  return dict.hoursAgoTemplate.replace('{hours}', String(diffHours));
}

export function ExchangeRatesSection({
  dict,
  language,
}: {
  dict: ExchangeRatesSectionDict;
  language: string;
}) {
  const [rates, setRates] = useState<ExchangeRateRow[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getExchangeRates().then((result) => {
      if (cancelled) return;
      setRates(result.rates);
      setUpdatedAt(result.updatedAt);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // هنوز در حالِ بارگذاریِ اولیه (rates === null) → چیزی نشان نده، نه اسکلتِ خالی؛ صفحه‌ی اصلی
  // این بخش را بینِ «دسترسی عاجل» و ردیف‌های «تازه‌ترین‌ها» می‌گذارد، پس یک ورودِ ناگهانی وقتی
  // داده می‌رسد کاملاً طبیعی به‌نظر می‌رسد، دقیقاً مثل بقیه‌ی بخش‌های همین صفحه.
  if (!rates || rates.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* هدر تیره — دقیقاً هم‌رنگ با بنرِ اصلیِ صفحه (Colors.heroDark) طبق همان دلیلِ وب: بخشی
          از هویتِ بصریِ برند به‌نظر برسد، نه یک ویجتِ ناهماهنگِ پیوندی. */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconWrap}>
              <Icons.ChartBar size={18} color={Colors.white} />
            </View>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {dict.title}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {dict.subtitle}
              </Text>
            </View>
          </View>
          <View style={styles.headerTimeRow}>
            <View style={styles.liveDot} />
            <Icons.Clock size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.headerTimeText}>{formatRelativeTime(updatedAt, dict)}</Text>
          </View>
        </View>
        <View style={styles.sourceBadge}>
          <Icons.CheckCircle size={11} color="rgba(255,255,255,0.9)" />
          <Text style={styles.sourceBadgeText}>{dict.sourceLabel}</Text>
        </View>
      </View>

      {/* هدرِ ستون‌های جدول */}
      <View style={styles.columnHeaderRow}>
        <Text style={[styles.columnHeaderText, styles.currencyColumn]}>{dict.currencyLabel}</Text>
        <Text style={[styles.columnHeaderText, styles.rateColumn]}>{dict.buyLabel}</Text>
        <Text style={[styles.columnHeaderText, styles.rateColumn]}>{dict.sellLabel}</Text>
        <Text style={[styles.columnHeaderText, styles.trendColumn]}>{dict.trendLabel}</Text>
      </View>

      {/* ردیف‌های نرخ */}
      <View style={styles.ratesList}>
        {rates.map((rate) => {
          const isUp = rate.changePercent > 0;
          const isDown = rate.changePercent < 0;
          const rateName = language === 'ps' ? rate.namePs : rate.nameFa;
          return (
            <View key={rate.code} style={styles.rateRow}>
              <View style={[styles.currencyColumn, styles.currencyCell]}>
                <Text style={styles.flag}>{rate.flag}</Text>
                <View style={styles.currencyTextCol}>
                  <Text style={styles.currencyName} numberOfLines={1}>
                    {rateName}
                  </Text>
                  <View style={styles.currencyCodeRow}>
                    <Text style={styles.currencyCode}>{rate.code}</Text>
                    {rate.perUnit === 1000 && (
                      <View style={styles.perThousandBadge}>
                        <Text style={styles.perThousandBadgeText}>{dict.perThousandBadgeLabel}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <Text style={[styles.rateColumn, styles.buyValue]}>
                {rate.buy.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.rateColumn, styles.sellValue]}>
                {rate.sell.toLocaleString('en-US')}
              </Text>
              <View style={[styles.trendColumn, styles.trendCell]}>
                {isUp && <Icons.TrendUp size={12} color={Colors.success} />}
                {isDown && <Icons.TrendDown size={12} color={Colors.danger} />}
                <Text
                  style={[
                    styles.trendText,
                    isUp && styles.trendTextUp,
                    isDown && styles.trendTextDown,
                  ]}>
                  {Math.abs(rate.changePercent).toFixed(2)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <CurrencyConverter
        rates={rates}
        dict={{
          converterTitle: dict.converterTitle,
          amountPlaceholder: dict.amountPlaceholder,
          resultLabel: dict.resultLabel,
          afnLabel: dict.afnLabel,
          perThousandNoteTemplate: dict.perThousandNoteTemplate,
        }}
      />

      <View style={styles.disclaimerRow}>
        <Icons.InfoCircle size={13} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}>{dict.disclaimer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  header: {
    backgroundColor: Colors.heroDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.6)',
  },
  headerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  headerTimeText: {
    fontSize: 10.5,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  sourceBadge: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: 'rgba(255,255,255,0.9)',
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
  },
  columnHeaderText: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  currencyColumn: {
    flex: 1,
    textAlign: 'right',
  },
  rateColumn: {
    width: 60,
    textAlign: 'center',
  },
  trendColumn: {
    width: 48,
    textAlign: 'center',
  },
  ratesList: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
    paddingBottom: 4,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
  },
  currencyCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  flag: {
    fontSize: 19,
  },
  currencyTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  currencyName: {
    fontSize: 12.5,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  currencyCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currencyCode: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  perThousandBadge: {
    backgroundColor: '#fffbeb',
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  perThousandBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: '#d97706',
  },
  buyValue: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.success,
  },
  sellValue: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.danger,
  },
  trendCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  trendTextUp: {
    color: Colors.success,
  },
  trendTextDown: {
    color: Colors.danger,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 15,
  },
});