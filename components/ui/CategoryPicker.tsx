// مسیر فایل: components/ui/CategoryPicker.tsx
// تسک ۲ فاز M00B — «انتخابگر آیکونی دسته‌بندی»، بخش دوم: کامپوننت مشترکِ نمایش گرید آیکونی.
//
// طبق اصل طلایی ۱ سند راهبردی وب (اولویت تصویر بر متن)، هر گزینه با یک آیکون بزرگ نمایش داده
// می‌شود، نه فقط متن. این کامپوننت عمداً ژنریک نوشته شده تا با هر یک از فایل‌های تک‌نقطه‌ی
// حقیقتِ فاز M00 کار کند — همه هم‌الگو هستند (آرایه‌ای از { id, dictKey, icon }):
//   - lib/marketplace/categories.ts      → ویزارد ثبت آگهی کالا (تسک ۳ همین فاز + فاز M02)
//   - lib/transport/vehicleTypes.ts      → فرم پروفایل راننده (فاز M03)
//   - lib/realEstate/propertyTypes.ts    → ویزارد ثبت آگهی ملک (فاز M05)
//   - lib/reports/reasons.ts             → فرم ثبت گزارش تخلف (فاز M06)
//
// طبق الزام قطعی ۲، این کامپوننت هرگز متن را خودش نمی‌داند؛ صدا‌کننده باید `labels` را از
// دیکشنری فعلی (dict.*) بسازد و بدهد — دقیقاً همان‌طور که categories.ts فقط dictKey را نگه
// می‌دارد نه متن را.
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IconComponent } from './Icons';

export type CategoryPickerItem<TId extends string = string> = {
  id: TId;
  dictKey: string;
  icon: IconComponent;
};

type CategoryPickerProps<TId extends string> = {
  /** یکی از آرایه‌های تک‌نقطه‌ی حقیقت (LISTING_CATEGORIES, VEHICLE_TYPES, PROPERTY_TYPES, ...) */
  items: readonly CategoryPickerItem<TId>[];
  /** نگاشت dictKey ← متن، معمولاً مستقیماً `dict.marketplace.categories` یا مشابه آن */
  labels: Record<string, string>;
  value: TId | null;
  onChange: (id: TId) => void;
  /** تعداد ستون هر ردیف — پیش‌فرض ۳ (مناسب دسته‌های کالا)؛ برای فهرست‌های کوتاه‌تر ۲ بهتر است */
  columns?: 2 | 3;
};

export function CategoryPicker<TId extends string>({
  items,
  labels,
  value,
  onChange,
  columns = 3,
}: CategoryPickerProps<TId>) {
  const flexBasis = columns === 2 ? '48%' : '31%';

  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.card,
              { flexBasis },
              selected && styles.cardSelected,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <Icon size={26} color={selected ? Colors.white : Colors.primary} />
            </View>
            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={2}>
              {labels[item.dictKey] ?? item.dictKey}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#ecfeff',
  },
  pressed: {
    opacity: 0.8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  labelSelected: {
    color: Colors.primaryDark,
  },
});
