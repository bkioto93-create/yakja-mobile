// مسیر فایل: app/vip.tsx
// معادل موبایلِ src/app/[lang]/vip/page.tsx + VipPurchaseClient.tsx وب — صفحه‌ی معرفی/خرید
// اشتراک VIP. یک مسیرِ سطح‌بالا (نه زیر تب‌ها) است — دقیقاً هم‌الگو با app/contact.tsx —
// چون مقصدی است که کاربر از جای دیگری (کارتِ ترغیب در تب پروفایل) به آن هدایت می‌شود، خودش یک
// تبِ مستقل نیست.
//
// **معادل‌سازیِ تاریخِ انقضا (بدون کتابخانه‌ی تازه):** وب تاریخ را با تقویم فارسی/جلالی نشان
// می‌دهد (`toLocaleDateString("fa-IR")`). React Native/Hermes پشتیبانیِ کاملِ Intl را تضمین
// نمی‌کند و هیچ کتابخانه‌ی تقویم جلالی (مثل jalaali-js) در پروژه نصب نیست — افزودنِ یکی فقط
// برای این یک تاریخ، توجیه‌پذیر نبود. به‌جایش همین‌جا تاریخِ میلادی به‌شکلِ ساده‌ی YYYY/MM/DD
// نمایش داده می‌شود؛ درست و همه‌جا قابل‌اعتماد، فقط بدون تقویمِ جلالیِ وب. اگر بعداً تقویمِ
// جلالی هم لازم شد، افزودنِ jalaali-js (بدون وابستگی به Intl) یک تسکِ کوچکِ جداگانه خواهد بود.
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDictionary } from '@/hooks/useDictionary';
import { getVipPageData, MyVipRequest, VipSettings } from '@/lib/vip/api';
import { createVipRequestAction, PaymentMethod } from '@/lib/vip/mutations';
import { isUserVip } from '@/lib/vip/vipStatus';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatSimpleDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

export default function VipScreen() {
  const dict = useDictionary();
  const vipDict = dict.vip;
  const { user, isReady } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  // 🛠️ اصلاح UX (سراسری — رجوع کنید به یادداشت کامل در app/listings/[id].tsx): جلوگیری از
  // پنهان‌شدنِ آخرین آیتمِ صفحه زیرِ نوار ناوبریِ سیستمیِ اندروید.
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<VipSettings | null>(null);
  const [latestRequest, setLatestRequest] = useState<MyVipRequest | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getVipPageData()
      .then((data) => {
        setSettings(data.settings);
        setLatestRequest(data.latestRequest);
      })
      .finally(() => setIsLoadingData(false));
  }, []);

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ title: vipDict.pageTitle }} />
        <View style={styles.centered}>
          <Card style={styles.guestCard}>
            <View style={styles.guestIconWrap}>
              <Icons.User size={28} color={Colors.textMuted} />
            </View>
            <Text style={styles.guestTitle}>{vipDict.loginRequiredTitle}</Text>
            <Text style={styles.guestDesc}>{vipDict.loginRequiredDesc}</Text>
            <Button
              title={vipDict.loginRequiredButton}
              onPress={() => router.push('/auth/login')}
              style={styles.guestButton}
            />
          </Card>
        </View>
      </>
    );
  }

  const isVip = isUserVip(user.vipExpiresAt);
  const hasPendingRequest = latestRequest?.status === 'pending';
  const errorsDict = vipDict.form.errors as Record<string, string>;

  async function handleSubmit() {
    if (!paymentMethod) {
      showToast(vipDict.form.selectMethodError, 'error');
      return;
    }
    setIsSubmitting(true);
    const result = await createVipRequestAction(paymentMethod, note);
    setIsSubmitting(false);

    if (!result.success) {
      showToast(errorsDict[result.error] ?? errorsDict.generic, 'error');
      return;
    }

    showToast(vipDict.form.submitSuccess, 'success');
    router.back();
  }

  const benefitRows = [
    { icon: Icons.Video, title: vipDict.benefits.videoTitle, desc: vipDict.benefits.videoDesc },
    { icon: Icons.Box, title: vipDict.benefits.postsTitle, desc: vipDict.benefits.postsDesc },
    {
      icon: Icons.MessageSquare,
      title: vipDict.benefits.chatTitle,
      desc: vipDict.benefits.chatDesc,
    },
    {
      icon: Icons.Clock,
      title: vipDict.benefits.storyTitle,
      desc: vipDict.benefits.storyDesc,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: vipDict.pageTitle }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.headerBlock}>
          <View style={styles.headerIconWrap}>
            <Icons.CheckCircle size={30} color="#fff" />
          </View>
          <Text style={styles.pageSubtitle}>{vipDict.pageSubtitle}</Text>
        </View>

        {/* سه امتیاز VIP — دقیقاً همان سه‌تا طبق وب */}
        <View style={styles.benefitsList}>
          {benefitRows.map((b, i) => (
            <Card key={i} style={styles.benefitCard}>
              <View style={styles.benefitIconWrap}>
                <b.icon size={18} color={Colors.primary} />
              </View>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* بخش ترغیبی «چرا VIP نتیجه‌ی بهتری می‌آورد؟» — دقیقاً هم‌الگو با وب
            (src/app/[lang]/vip/page.tsx): هر سه مورد به امتیازهای واقعیِ بالا وصل‌اند (آگهی/چت
            نامحدود، ویدئو، نشان VIP)، نه یک وعده‌ی انتزاعی. */}
        <Card style={styles.pitchCard}>
          <Text style={styles.pitchTitle}>{vipDict.pitch.title}</Text>
          <View style={styles.pitchList}>
            {vipDict.pitch.items.map((item, index) => {
              const PitchIcon =
                [Icons.Users, Icons.Eye, Icons.CheckCircle, Icons.Clock][index] ?? Icons.CheckCircle;
              return (
                <View key={item.title} style={styles.pitchRow}>
                  <View style={styles.pitchIconWrap}>
                    <PitchIcon size={16} color="#fff" />
                  </View>
                  <View style={styles.pitchTextCol}>
                    <Text style={styles.pitchItemTitle}>{item.title}</Text>
                    <Text style={styles.pitchItemDesc}>{item.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* یادآوریِ مخصوصِ بخش املاک — طبق درخواست صریح کارفرما. */}
          <View style={styles.pitchRealEstateNote}>
            <View style={styles.pitchRealEstateIconWrap}>
              <Icons.PropertyHouseSale size={16} color={Colors.primary} />
            </View>
            <View style={styles.pitchTextCol}>
              <Text style={styles.pitchItemTitle}>{vipDict.pitch.realEstateNoteLabel}</Text>
              <Text style={styles.pitchItemDesc}>{vipDict.pitch.realEstateNote}</Text>
            </View>
          </View>
        </Card>

        {/* کارتِ قیمت */}
        <Card style={styles.priceCard}>
          <Text style={styles.priceLabel}>{vipDict.priceLabel}</Text>
          {isLoadingData ? (
            <Spinner size="small" />
          ) : (
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>
                {(settings?.monthlyPrice ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.priceCurrency}>{vipDict.currencyPerMonth}</Text>
            </View>
          )}
        </Card>

        {isLoadingData ? (
          <View style={styles.centeredInline}>
            <Spinner size="large" />
          </View>
        ) : (
          <View style={styles.formStack}>
            {/* وضعیت فعلی VIP کاربر — اگر همین حالا فعال است */}
            {isVip && user.vipExpiresAt && (
              <Card style={styles.vipActiveCard}>
                <View style={styles.vipActiveIconWrap}>
                  <Icons.CheckCircle size={18} color="#fff" />
                </View>
                <Text style={styles.vipActiveText}>
                  {vipDict.form.currentlyVipUntil.replace('{date}', formatSimpleDate(user.vipExpiresAt))}
                </Text>
              </Card>
            )}

            {hasPendingRequest ? (
              <Card style={styles.pendingCard}>
                <View style={styles.pendingIconWrap}>
                  <Icons.MessageSquare size={22} color={Colors.accent} />
                </View>
                <Text style={styles.pendingTitle}>{vipDict.form.pendingTitle}</Text>
                <Text style={styles.pendingDesc}>{vipDict.form.pendingDesc}</Text>
              </Card>
            ) : (
              <>
                {latestRequest?.status === 'rejected' && (
                  <Card style={styles.rejectedCard}>
                    <Text style={styles.rejectedNotice}>{vipDict.form.rejectedNotice}</Text>
                    {latestRequest.rejectionReason && (
                      <Text style={styles.rejectedReason}>
                        {vipDict.form.rejectionReasonLabel}: {latestRequest.rejectionReason}
                      </Text>
                    )}
                  </Card>
                )}

                <Card style={styles.formCard}>
                  <Text style={styles.formTitle}>
                    {isVip ? vipDict.form.renewTitle : vipDict.form.requestTitle}
                  </Text>

                  <View style={styles.methodRow}>
                    <Pressable
                      onPress={() => setPaymentMethod('bank')}
                      style={[
                        styles.methodButton,
                        paymentMethod === 'bank' && styles.methodButtonActive,
                      ]}>
                      <Icons.CheckCircle
                        size={22}
                        color={paymentMethod === 'bank' ? Colors.primary : Colors.textMain}
                      />
                      <Text
                        style={[
                          styles.methodLabel,
                          paymentMethod === 'bank' && styles.methodLabelActive,
                        ]}>
                        {vipDict.form.paymentMethodBank}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPaymentMethod('exchange')}
                      style={[
                        styles.methodButton,
                        paymentMethod === 'exchange' && styles.methodButtonActive,
                      ]}>
                      <Icons.Box
                        size={22}
                        color={paymentMethod === 'exchange' ? Colors.primary : Colors.textMain}
                      />
                      <Text
                        style={[
                          styles.methodLabel,
                          paymentMethod === 'exchange' && styles.methodLabelActive,
                        ]}>
                        {vipDict.form.paymentMethodExchange}
                      </Text>
                    </Pressable>
                  </View>

                  {paymentMethod && (
                    <View style={styles.detailsBox}>
                      <Text style={styles.detailsText}>
                        {paymentMethod === 'bank' ? settings?.bankDetails : settings?.exchangeDetails}
                      </Text>
                    </View>
                  )}

                  {paymentMethod && (
                    <View>
                      <Text style={styles.noteLabel}>{vipDict.form.noteLabel}</Text>
                      <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder={vipDict.form.notePlaceholder}
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={2}
                        style={styles.noteInput}
                      />
                    </View>
                  )}

                  <Button
                    title={vipDict.form.submitButton}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !paymentMethod}
                    style={styles.submitButton}
                  />
                  {isSubmitting && (
                    <View style={styles.submittingRow}>
                      <Spinner size="small" />
                    </View>
                  )}
                </Card>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgBase,
    padding: Spacing.lg,
  },
  centeredInline: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  guestCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 340,
  },
  guestIconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radii.xl,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  guestDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  guestButton: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  headerBlock: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerIconWrap: {
    width: 60,
    height: 60,
    borderRadius: Radii.xl,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  benefitsList: {
    gap: Spacing.sm,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  benefitDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  pitchCard: {
    gap: Spacing.md,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  pitchTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    textAlign: 'center',
  },
  pitchList: {
    gap: Spacing.sm,
  },
  pitchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  pitchIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchTextCol: {
    flex: 1,
  },
  pitchItemTitle: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  pitchItemDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 1,
    lineHeight: 16,
  },
  pitchRealEstateNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#fff',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: Spacing.sm,
  },
  pitchRealEstateIconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6,182,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceCard: {
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceValue: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: '#f59e0b',
  },
  priceCurrency: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  formStack: {
    gap: Spacing.md,
  },
  vipActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  vipActiveIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipActiveText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#047857',
  },
  pendingCard: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pendingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.xl,
    backgroundColor: 'rgba(249,115,22,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  pendingDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  rejectedCard: {
    gap: 2,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  rejectedNotice: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#dc2626',
  },
  rejectedReason: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#ef4444',
  },
  formCard: {
    gap: Spacing.sm,
  },
  formTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  methodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  methodButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  methodButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(6,182,212,0.05)',
  },
  methodLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
  },
  methodLabelActive: {
    color: Colors.primary,
  },
  detailsBox: {
    backgroundColor: Colors.bgBase,
    borderRadius: Radii.xl,
    padding: Spacing.md,
  },
  detailsText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMain,
    lineHeight: 20,
  },
  noteLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.textMain,
    marginBottom: 6,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMain,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  submittingRow: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
});