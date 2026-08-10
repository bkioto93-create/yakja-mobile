// مسیر فایل: components/province/ProvincePickerModal.tsx
// 🆕 فایل تازه — معادل موبایلیِ src/components/province/ProvincePickerModal.tsx وب. دقیقاً همان
// سه لایه‌ی طراحی وب (طبق بند «سادگی حداکثری برای کاربران کم‌تجربه» سند راهبردی): ۱) جستجوی
// متنی سریع، ۲) ۵ ولایت پرکاربرد به‌صورت چیپ‌های بزرگ یک‌لمسی، ۳) فهرست کامل ۳۴ ولایت.
//
// دقیقاً مثل نسخه‌ی وب، این کامپوننت عمداً کاملاً «کور به Storage» است — فقط value/onSelect/
// onClose می‌گیرد و به بیرون اطلاع می‌دهد؛ خودِ نوشتن SecureStore (سوییچر سراسری، ProvinceBar) یا
// نوشتن state فرم (ProvinceSelectField) به عهده‌ی کامپوننت والد است — همین باعث می‌شود یک
// کامپوننت واحد برای هر دو مصرف کاملاً متفاوت کافی باشد، بدون تکرار کد فهرست/جستجو/چیپ.
//
// allowAll: فقط سوییچر سراسری (ProvinceBar) گزینه‌ی «همه‌ی افغانستان» را نشان می‌دهد؛ فرم‌های
// ثبت آگهی/پروفایل هرگز این گزینه را نمی‌گیرند — دقیقاً هم‌الگو و هم‌دلیل با وب.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { ALL_PROVINCES_VALUE } from '@/lib/province/constants';
import { POPULAR_PROVINCE_IDS, PROVINCES } from '@/lib/provinces';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icons } from '../ui/Icons';

// دقیقاً هم‌شکلِ ProvinceDict وب (src/components/province/ProvincePickerModal.tsx) — یعنی
// dict.province که در همین تحویل به dictionaries/fa.ts و dictionaries/ps.ts اضافه شد.
export type ProvinceDict = {
  title: string;
  searchPlaceholder: string;
  popularLabel: string;
  allLabel: string;
  allProvincesOption: string;
  noResultsText: string;
  fieldLabel: string;
  fieldError: string;
  resultsForLabel: string;
  names: Record<string, string>;
};

export function ProvincePickerModal({
  value,
  allowAll,
  dict,
  onSelect,
  onClose,
}: {
  value: string | null;
  allowAll: boolean;
  dict: ProvinceDict;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [searchText, setSearchText] = useState('');
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): این مودال یک
  // Bottom Sheet است (justifyContent: 'flex-end' در backdrop)، یعنی لبه‌ی پایینِ آن دقیقاً روی
  // لبه‌ی پایینِ صفحه می‌نشیند — بدون این padding، آخرین ولایتِ فهرست (وقتی کاملاً اسکرول
  // می‌شود) زیرِ نوار ناوبریِ سیستمیِ اندروید (یا نوارِ خانه‌ی آیفون) پنهان می‌شد.
  const insets = useSafeAreaInsets();

  const filteredProvinces = useMemo(() => {
    const trimmed = searchText.trim();
    if (!trimmed) return PROVINCES;
    return PROVINCES.filter((p) => dict.names[p.dictKey]?.includes(trimmed));
  }, [searchText, dict.names]);

  const showPopularRow = searchText.trim().length === 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {/* هدر ثابت */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{dict.title}</Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel={dict.allLabel}
              style={styles.closeButton}>
              <Icons.X size={18} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            {/* جستجوی متنی سریع */}
            <View style={styles.searchWrap}>
              <Icons.Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder={dict.searchPlaceholder}
                placeholderTextColor={Colors.textMuted}
                style={styles.searchInput}
                textAlign="right"
              />
            </View>

            {/* گزینه‌ی «همه‌ی افغانستان» — فقط سوییچر سراسری */}
            {allowAll && (
              <Pressable
                onPress={() => onSelect(ALL_PROVINCES_VALUE)}
                style={[styles.allOption, value === null && styles.allOptionSelected]}>
                <View style={styles.allOptionLeft}>
                  <Icons.MapPin size={18} color={value === null ? Colors.primary : Colors.textMain} />
                  <Text style={[styles.allOptionText, value === null && styles.allOptionTextSelected]}>
                    {dict.allProvincesOption}
                  </Text>
                </View>
                {value === null && <Icons.CheckCircle size={18} color={Colors.primary} />}
              </Pressable>
            )}

            {/* ۵ ولایت پرکاربرد — فقط وقتی جستجویی در جریان نیست */}
            {showPopularRow && (
              <View style={styles.popularSection}>
                <Text style={styles.popularLabel}>{dict.popularLabel}</Text>
                <View style={styles.popularRow}>
                  {POPULAR_PROVINCE_IDS.map((id) => {
                    const isActive = value === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => onSelect(id)}
                        style={[styles.chip, isActive && styles.chipActive]}>
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                          {dict.names[id]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* فهرست کامل ۳۴ ولایت */}
            <View style={styles.list}>
              {filteredProvinces.length === 0 ? (
                <Text style={styles.noResults}>{dict.noResultsText}</Text>
              ) : (
                filteredProvinces.map((p) => {
                  const isActive = value === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => onSelect(p.id)}
                      style={styles.row}>
                      <Text style={[styles.rowText, isActive && styles.rowTextActive]}>
                        {dict.names[p.dictKey]}
                      </Text>
                      {isActive && <Icons.CheckCircle size={16} color={Colors.primary} />}
                    </Pressable>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    right: Spacing.md,
    zIndex: 1,
  },
  searchInput: {
    minHeight: 46,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgBase,
    paddingRight: Spacing.xl + Spacing.sm,
    paddingLeft: Spacing.md,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMain,
  },
  allOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
  },
  allOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ecfeff',
  },
  allOptionLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  allOptionText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.textMain,
  },
  allOptionTextSelected: {
    color: Colors.primary,
  },
  popularSection: {
    gap: Spacing.xs + 2,
  },
  popularLabel: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  popularRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  chip: {
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textMain,
  },
  chipTextActive: {
    color: Colors.white,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
  },
  rowText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMain,
  },
  rowTextActive: {
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  noResults: {
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    paddingVertical: Spacing.lg,
  },
});