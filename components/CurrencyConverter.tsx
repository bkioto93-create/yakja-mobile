// مسیر فایل: components/CurrencyConverter.tsx
// 🆕 فایل تازه (فاز M09 — همگام‌سازی با وب، بخش «اسعار») — معادل موبایلیِ
// src/app/[lang]/CurrencyConverter.tsx وب. همان منطقِ محاسبه عیناً کپی شد (شاملِ رفعِ باگِ
// واحدِ PKR/IRR — نرخ همیشه اول به «نرخِ هر ۱ واحد» تبدیل می‌شود، بعد ضرب/تقسیم انجام می‌شود).
//
// **تفاوتِ UI با وب (تصمیمِ آگاهانه، نه کوتاهی):** وب یک `<select>` بومیِ HTML برای انتخابِ ارز
// دارد. React Native معادلِ بومیِ `<select>` ندارد؛ به‌جای افزودنِ یک کتابخانه‌ی Picker تازه (که
// نیازمندِ نصب/Build دوباره است) برای فقط ۵ گزینه، یک ردیفِ افقیِ چیپ‌های قابل‌لمس (دقیقاً همان
// الگویی که فیلترهای دسته‌بندی در سراسرِ این پروژه — مثلاً چیپ‌های `app/(tabs)/listings.tsx` —
// از قبل استفاده می‌کنند) انتخابِ ارز را انجام می‌دهد؛ برای فقط ۵ گزینه، عملاً سریع‌تر و
// لمس‌پذیرتر از یک Picker پنهان هم هست.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { ExchangeRateRow } from '@/lib/exchangeRates/api';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icons } from './ui/Icons';

type Direction = 'toAfn' | 'fromAfn';

export type CurrencyConverterDict = {
  converterTitle: string;
  amountPlaceholder: string;
  resultLabel: string;
  afnLabel: string;
  perThousandNoteTemplate: string;
};

export function CurrencyConverter({
  rates,
  dict,
}: {
  rates: ExchangeRateRow[];
  dict: CurrencyConverterDict;
}) {
  const [selectedCode, setSelectedCode] = useState(rates[0]?.code ?? '');
  const [amount, setAmount] = useState('1000');
  const [direction, setDirection] = useState<Direction>('toAfn');

  const selectedRate = useMemo(
    () => rates.find((r) => r.code === selectedCode) ?? rates[0] ?? null,
    [rates, selectedCode]
  );

  const result = useMemo(() => {
    const numericAmount = Number(amount.replace(/[^\d.]/g, ''));
    if (!selectedRate || !Number.isFinite(numericAmount)) return 0;
    // 🐛 دقیقاً همان رفعِ باگِ وب: نرخِ PKR/IRR «به‌ازای هر ۱۰۰۰ واحد» ذخیره شده، نه ۱ واحد —
    // اول به نرخِ هر ۱ واحد تبدیل می‌شود، بعد ضرب/تقسیم انجام می‌شود.
    const sellPerSingleUnit = selectedRate.sell / selectedRate.perUnit;
    if (direction === 'toAfn') return numericAmount * sellPerSingleUnit;
    return sellPerSingleUnit > 0 ? numericAmount / sellPerSingleUnit : 0;
  }, [amount, direction, selectedRate]);

  if (!selectedRate) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{dict.converterTitle}</Text>
        <Icons.ArrowsExchange size={16} color={Colors.primary} />
      </View>

      <View style={styles.row}>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder={dict.amountPlaceholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.amountInput}
        />
        <Pressable
          onPress={() => setDirection((d) => (d === 'toAfn' ? 'fromAfn' : 'toAfn'))}
          style={({ pressed }) => [styles.swapButton, pressed && styles.swapButtonPressed]}
          accessibilityRole="button">
          <Icons.ArrowsExchange size={18} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        {rates.map((r) => {
          const isSelected = r.code === selectedRate.code;
          return (
            <Pressable
              key={r.code}
              onPress={() => setSelectedCode(r.code)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              accessibilityRole="button">
              <Text style={styles.chipFlag}>{r.flag}</Text>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{r.code}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedRate.perUnit === 1000 && (
        <View style={styles.noteRow}>
          <Icons.InfoCircle size={14} color="#d97706" />
          <Text style={styles.noteText}>
            {dict.perThousandNoteTemplate.replace('{code}', selectedRate.code)}
          </Text>
        </View>
      )}

      <View style={styles.resultBox}>
        <Text style={styles.resultLabel}>{dict.resultLabel}</Text>
        <Text style={styles.resultValue}>
          {result.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </Text>
        <Text style={styles.resultUnit}>{direction === 'toAfn' ? dict.afnLabel : selectedRate.code}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgBase,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'right',
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapButtonPressed: {
    opacity: 0.7,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(6,182,212,0.1)',
  },
  chipFlag: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  chipTextSelected: {
    color: Colors.primaryDark,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  noteText: {
    fontSize: 10.5,
    fontFamily: Fonts.bold,
    color: '#d97706',
    flexShrink: 1,
  },
  resultBox: {
    marginTop: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.06)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  resultLabel: {
    fontSize: 12.5,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  resultValue: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  resultUnit: {
    fontSize: 12.5,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
});