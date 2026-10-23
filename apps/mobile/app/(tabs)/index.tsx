import React, { useMemo, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import Svg, { Circle } from "react-native-svg"
import { ChevronRight } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { Label, Numeral, PageTitle, Surface } from "@/components/ui/surface"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import {
  currentMonthKey,
  monthLabel,
  financeCategoryMeta,
} from "@/constants/finance"

function localDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const { colors } = useThemeColor()
  return (
    <View
      style={{
        height: 3,
        borderRadius: 999,
        backgroundColor: colors.surfaceInset,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, pct))}%`,
          backgroundColor: color,
          borderRadius: 999,
        }}
      />
    </View>
  )
}

function BudgetRing({ pct }: { pct: number }) {
  const { colors } = useThemeColor()
  const size = 116
  const stroke = 2.5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, pct))

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.text}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - (clamped / 100) * circumference}
        />
      </Svg>
      <Numeral style={{ fontSize: 24 }}>{Math.round(pct)}%</Numeral>
      <Label style={{ fontSize: 9, marginTop: 2 }}>used</Label>
    </View>
  )
}

function PanelHead({
  title,
  hint,
  linkLabel,
  onPress,
}: {
  title: string
  hint?: string
  linkLabel: string
  onPress: () => void
}) {
  const { colors } = useThemeColor()
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", letterSpacing: -0.2, color: colors.text }}>
          {title}
        </Text>
        {hint ? (
          <Text style={{ fontSize: 11, color: colors.mutedText }}>{hint}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", gap: 1 }}
      >
        <Text style={{ fontSize: 11, fontWeight: "500", color: colors.mutedText }}>
          {linkLabel}
        </Text>
        <ChevronRight size={12} color={colors.mutedText} />
      </TouchableOpacity>
    </View>
  )
}

function MetricCard({
  hint,
  value,
  label,
  onPress,
}: {
  hint: string
  value: string
  label: string
  onPress: () => void
}) {
  const { colors } = useThemeColor()
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{ width: "48%", flexGrow: 1 }}
    >
      <Surface
        style={{
          minHeight: 110,
          padding: 14,
          justifyContent: "flex-end",
          gap: 6,
        }}
      >
        <Text
          style={{
            position: "absolute",
            top: 13,
            right: 14,
            fontSize: 9,
            fontWeight: "500",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: colors.subtleText,
          }}
        >
          {hint}
        </Text>
        <Numeral numberOfLines={1} style={{ fontSize: 22 }}>
          {value}
        </Numeral>
        <Text style={{ fontSize: 11, color: colors.mutedText }}>{label}</Text>
      </Surface>
    </TouchableOpacity>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const month = currentMonthKey()

  const accounts = useQuery(api.accounts.list, isSignedIn ? {} : "skip")
  const transactions = useQuery(
    api.transactions.list,
    isSignedIn ? { month } : "skip"
  )
  const allTransactions = useQuery(
    api.transactions.list,
    isSignedIn ? { limit: 600 } : "skip"
  )
  const budgets = useQuery(api.budgets.list, isSignedIn ? { month } : "skip")
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const userSettings = useQuery(api.userSettings.get, isSignedIn ? {} : "skip")

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const stats = useMemo(() => {
    let income = 0
    let expense = 0
    const byCategory: Record<string, number> = {}
    for (const t of transactions || []) {
      const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
      if (t.type === "income") income += converted
      else if (t.type === "expense") {
        expense += converted
        byCategory[t.category] = (byCategory[t.category] || 0) + converted
      }
    }
    return { income, expense, saved: income - expense, byCategory }
  }, [transactions, primaryCurrency, rates])

  const netWorth = useMemo(() => {
    if (!accounts) return 0
    return accounts.reduce(
      (sum, a) => sum + convertCurrency(a.balance, a.currency, primaryCurrency, rates),
      0
    )
  }, [accounts, primaryCurrency, rates])

  const subscriptionMonthly = useMemo(() => {
    if (!subscriptions) return 0
    return subscriptions
      .filter((s) => s.isActive !== false)
      .reduce((sum, s) => {
        const cycle = (s.cycle || "monthly").toLowerCase()
        let nativeMonthly = s.price
        if (cycle === "quarterly") nativeMonthly = s.price / 3
        else if (cycle === "semi-annual") nativeMonthly = s.price / 6
        else if (cycle === "yearly") nativeMonthly = s.price / 12
        else if (cycle === "weekly") nativeMonthly = s.price * 4.33
        else if (cycle === "daily") nativeMonthly = s.price * 30
        else if (cycle === "none") nativeMonthly = 0
        return sum + convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      }, 0)
  }, [subscriptions, primaryCurrency, rates])

  const activeSubCount = subscriptions?.filter((s) => s.isActive !== false).length ?? 0

  const nextRenewal = useMemo(() => {
    const active = (subscriptions || []).filter((s) => s.isActive !== false)
    const dates = active
      .map((s) => (s.isTrial && s.trialEndDate ? s.trialEndDate : s.nextBilling))
      .filter((value): value is string => !!value)
      .sort()
    return dates[0] ?? null
  }, [subscriptions])

  const budgetCap = userSettings?.monthlyBudgetCap
  const monthlySpend = stats.expense + subscriptionMonthly
  const budgetUsedPct =
    budgetCap && budgetCap > 0 ? Math.round((monthlySpend / budgetCap) * 100) : null
  const isBudgetExceeded = !!budgetCap && monthlySpend > budgetCap
  const leftToSpend = budgetCap ? budgetCap - monthlySpend : stats.saved

  const topCategories = useMemo(() => {
    const entries = Object.entries(stats.byCategory)
    const total = stats.expense || 1
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, amt]) => ({
        ...financeCategoryMeta(cat),
        amount: amt,
        pct: Math.round((amt / total) * 100),
      }))
  }, [stats])

  const recentTransactions = useMemo(() => {
    return [...(transactions || [])]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 6)
  }, [transactions])

  const activityScrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null)

  const activity = useMemo(() => {
    const spendByDate: Record<string, number> = {}
    for (const t of allTransactions || []) {
      if (t.type !== "expense") continue
      spendByDate[t.date] =
        (spendByDate[t.date] || 0) +
        convertCurrency(t.amount, t.currency, primaryCurrency, rates)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    start.setDate(start.getDate() - 364)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))

    const weeks: {
      monthLabel?: string
      days: { key: string; amount: number; future: boolean }[]
    }[] = []
    const cursor = new Date(start)
    let activeDays = 0
    let peak = 0
    let totalSpend = 0
    let lastMonth = -1

    while (cursor <= today) {
      const days: { key: string; amount: number; future: boolean }[] = []
      let monthLabel: string | undefined = undefined

      for (let i = 0; i < 7; i++) {
        const day = new Date(cursor)
        const key = localDateKey(day)
        const amount = spendByDate[key] || 0
        const future = day > today

        if (!future && amount > 0) {
          activeDays++
          totalSpend += amount
          if (amount > peak) peak = amount
        }

        days.push({ key, amount, future })

        if (day.getMonth() !== lastMonth && (days.length === 1 || day.getDate() <= 7)) {
          monthLabel = day.toLocaleDateString("en-US", { month: "short" })
          lastMonth = day.getMonth()
        }

        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push({ monthLabel, days })
    }

    return { weeks, activeDays, peak, totalSpend }
  }, [allTransactions, primaryCurrency, rates])

  const loading = accounts === undefined || transactions === undefined
  const monthShort = monthLabel(month).split(" ")[0]

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          gap: 12,
          paddingBottom: 120,
        }}
      >
        <View style={{ gap: 5, paddingBottom: 4 }}>
          <Label>{monthLabel(month)}</Label>
          <PageTitle>Overview</PageTitle>
          <Text style={{ fontSize: 11, color: colors.mutedText }}>
            Balances, bills, and what is left.
          </Text>
        </View>

        <Surface style={{ padding: 20, gap: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Label>Net worth</Label>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 10, letterSpacing: 1, color: colors.mutedText }}>
                {primaryCurrency}
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.mutedText} style={{ alignSelf: "flex-start" }} />
          ) : (
            <Numeral
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontSize: 40, lineHeight: 42 }}
            >
              {formatCurrencyAmount(netWorth, primaryCurrency)}
            </Numeral>
          )}

          <Text style={{ fontSize: 11, color: colors.mutedText }}>
            {accounts?.length ?? 0} accounts · live balances
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 13,
            }}
          >
            <View style={{ flex: 1, gap: 5 }}>
              <Label>In</Label>
              <Numeral numberOfLines={1} style={{ fontSize: 15, color: colors.positive }}>
                +{formatCurrencyAmount(stats.income, primaryCurrency)}
              </Numeral>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Label>Out</Label>
              <Numeral numberOfLines={1} style={{ fontSize: 15 }}>
                -{formatCurrencyAmount(stats.expense, primaryCurrency)}
              </Numeral>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Label>Kept</Label>
              <Numeral numberOfLines={1} style={{ fontSize: 15 }}>
                {formatCurrencyAmount(stats.saved, primaryCurrency)}
              </Numeral>
            </View>
          </View>
        </Surface>

        <Surface style={{ padding: 18, gap: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ gap: 3 }}>
              <Label>{budgetCap ? "Monthly cap" : "Cash flow"}</Label>
              <Text style={{ fontSize: 11, color: colors.mutedText }}>
                {monthLabel(month)}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/budgets" as never)}
              style={{ flexDirection: "row", alignItems: "center", gap: 1 }}
            >
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.mutedText }}>
                Budgets
              </Text>
              <ChevronRight size={12} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.mutedText} />
          ) : budgetCap ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
              <BudgetRing pct={budgetUsedPct ?? 0} />
              <View style={{ flex: 1, gap: 6 }}>
                <Numeral numberOfLines={1} style={{ fontSize: 26 }}>
                  {formatCurrencyAmount(Math.abs(leftToSpend), primaryCurrency)}
                </Numeral>
                <Text style={{ fontSize: 12, color: colors.mutedText }}>
                  {isBudgetExceeded ? "over the cap" : "left to spend"}
                </Text>
                <Text style={{ fontSize: 11, lineHeight: 16, color: colors.subtleText }}>
                  {formatCurrencyAmount(monthlySpend, primaryCurrency)} of{" "}
                  {formatCurrencyAmount(budgetCap, primaryCurrency)}
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ gap: 6 }}>
                <Numeral numberOfLines={1} style={{ fontSize: 28 }}>
                  {formatCurrencyAmount(stats.saved, primaryCurrency)}
                </Numeral>
                <Text style={{ fontSize: 12, color: colors.mutedText }}>
                  kept this month
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/settings" as never)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.mutedText }}>Set a cap</Text>
              </TouchableOpacity>
            </View>
          )}
        </Surface>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <MetricCard
            hint="In"
            value={`+${formatCurrencyAmount(stats.income, primaryCurrency)}`}
            label="This month"
            onPress={() => router.push("/(tabs)/transactions" as never)}
          />
          <MetricCard
            hint="Out"
            value={`-${formatCurrencyAmount(stats.expense, primaryCurrency)}`}
            label="This month"
            onPress={() => router.push("/(tabs)/transactions" as never)}
          />
          <MetricCard
            hint="Fixed"
            value={formatCurrencyAmount(subscriptionMonthly, primaryCurrency)}
            label={`${activeSubCount} recurring · per month`}
            onPress={() => router.push("/(tabs)/subscriptions" as never)}
          />
          <MetricCard
            hint="Next"
            value={nextRenewal ? shortDate(nextRenewal) : "—"}
            label="Next renewal"
            onPress={() => router.push("/(tabs)/subscriptions" as never)}
          />
        </View>

        <Surface style={{ padding: 18, gap: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ gap: 3 }}>
              <Text style={{ fontSize: 15, fontWeight: "500", letterSpacing: -0.2, color: colors.text }}>
                Activity
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedText }}>
                Daily spending, past 52 weeks
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.mutedText }}>
              {activity.activeDays} active {activity.activeDays === 1 ? "day" : "days"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
            {/* Weekday labels */}
            <View style={{ gap: 2.5, paddingRight: 2 }}>
              <View style={{ height: 14 }} />
              <View style={{ height: 10, justifyContent: "center" }}>
                <Text style={{ fontSize: 9, fontWeight: "500", color: colors.mutedText }}>M</Text>
              </View>
              <View style={{ height: 10 }} />
              <View style={{ height: 10, justifyContent: "center" }}>
                <Text style={{ fontSize: 9, fontWeight: "500", color: colors.mutedText }}>W</Text>
              </View>
              <View style={{ height: 10 }} />
              <View style={{ height: 10, justifyContent: "center" }}>
                <Text style={{ fontSize: 9, fontWeight: "500", color: colors.mutedText }}>F</Text>
              </View>
              <View style={{ height: 10 }} />
            </View>

            {/* 52-53 weeks */}
            <ScrollView
              ref={activityScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onContentSizeChange={() => activityScrollViewRef.current?.scrollToEnd({ animated: false })}
              contentContainerStyle={{ gap: 2.5, paddingRight: 4 }}
            >
              {activity.weeks.map((week, index) => (
                <View key={index} style={{ gap: 2.5 }}>
                  <View style={{ height: 14, width: 10, position: "relative" }}>
                    {week.monthLabel ? (
                      <Text
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          fontSize: 9,
                          fontWeight: "500",
                          color: colors.mutedText,
                          width: 32,
                        }}
                      >
                        {week.monthLabel}
                      </Text>
                    ) : null}
                  </View>

                  {week.days.map((day) => {
                    const intensity =
                      day.amount <= 0 || activity.peak <= 0
                        ? 0
                        : 0.22 + 0.78 * Math.sqrt(day.amount / activity.peak)
                    return (
                      <View
                        key={day.key}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          backgroundColor:
                            day.future
                              ? "transparent"
                              : day.amount > 0
                                ? colors.text
                                : colors.border,
                          opacity: day.future
                            ? 0
                            : day.amount > 0
                              ? Math.max(0.2, intensity)
                              : 0.45,
                        }}
                      />
                    )
                  })}
                </View>
              ))}
            </ScrollView>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 11, color: colors.mutedText }}>Peak day</Text>
              <Numeral style={{ fontSize: 11 }}>
                {activity.peak > 0
                  ? formatCurrencyAmount(activity.peak, primaryCurrency)
                  : "—"}
              </Numeral>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Text style={{ fontSize: 9, color: colors.mutedText }}>Less</Text>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  opacity: 0.45,
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: colors.text,
                  opacity: 0.25,
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: colors.text,
                  opacity: 0.55,
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: colors.text,
                  opacity: 0.85,
                }}
              />
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: colors.text,
                  opacity: 1,
                }}
              />
              <Text style={{ fontSize: 9, color: colors.mutedText }}>More</Text>
            </View>
          </View>
        </Surface>

        <UpcomingReminders
          subscriptions={subscriptions || []}
          primaryCurrency={primaryCurrency}
          rates={rates}
          onMarkCanceled={async () => {}}
        />

        <Surface style={{ padding: 18, gap: 6 }}>
          <PanelHead
            title="Recent"
            hint={`${monthLabel(month)} · latest first`}
            linkLabel="All"
            onPress={() => router.push("/(tabs)/transactions" as never)}
          />

          {transactions === undefined ? (
            <ActivityIndicator size="small" color={colors.mutedText} style={{ marginVertical: 16 }} />
          ) : recentTransactions.length === 0 ? (
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedText,
                textAlign: "center",
                paddingVertical: 18,
              }}
            >
              No transactions yet this month.
            </Text>
          ) : (
            recentTransactions.map((t, i) => {
              const meta = financeCategoryMeta(t.category)
              const isIncome = t.type === "income"
              const isTransfer = t.type === "transfer"
              return (
                <View
                  key={t._id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 10,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.borderLight,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      backgroundColor: colors.surfaceInset,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DynamicIcon
                      name={t.icon || meta.icon}
                      size={14}
                      color={colors.mutedText}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 13, color: colors.text }}
                    >
                      {t.note || meta.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>
                      {meta.label} · {shortDate(t.date)}
                    </Text>
                  </View>
                  <Numeral
                    style={{
                      fontSize: 13,
                      color: isIncome
                        ? colors.positive
                        : isTransfer
                        ? colors.mutedText
                        : colors.text,
                    }}
                  >
                    {isIncome ? "+" : isTransfer ? "" : "-"}
                    {formatCurrencyAmount(
                      convertCurrency(t.amount, t.currency, primaryCurrency, rates),
                      primaryCurrency
                    )}
                  </Numeral>
                </View>
              )
            })
          )}
        </Surface>

        {topCategories.length > 0 ? (
          <Surface style={{ padding: 18, gap: 14 }}>
            <PanelHead
              title="Top spending"
              hint={`${monthShort} · by category`}
              linkLabel="Analytics"
              onPress={() => router.push("/(tabs)/stats" as never)}
            />

            {topCategories.map((cat) => (
              <View key={cat.value} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceInset,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DynamicIcon name={cat.icon} size={14} color={colors.mutedText} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 12, color: colors.text, flex: 1 }}
                    >
                      {cat.label}
                    </Text>
                    <Numeral style={{ fontSize: 11, color: colors.mutedText }}>
                      {formatCurrencyAmount(cat.amount, primaryCurrency)}
                    </Numeral>
                  </View>
                  <ProgressBar pct={cat.pct} color={cat.color} />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.mutedText,
                    width: 34,
                    textAlign: "right",
                  }}
                >
                  {cat.pct}%
                </Text>
              </View>
            ))}
          </Surface>
        ) : null}

        <Surface style={{ padding: 18, gap: 14 }}>
          <PanelHead
            title="Budgets"
            hint={`${monthShort} · limits`}
            linkLabel="Manage"
            onPress={() => router.push("/(tabs)/budgets" as never)}
          />

          {budgets === undefined || transactions === undefined ? (
            <ActivityIndicator size="small" color={colors.mutedText} />
          ) : budgets.length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.mutedText }}>
              No limits set for {monthShort}.
            </Text>
          ) : (
            budgets.slice(0, 4).map((b) => {
              const spentNative = (transactions || [])
                .filter((t) => t.type === "expense" && t.category === b.category)
                .reduce((s, t) => s + t.amount, 0)
              const spent = convertCurrency(spentNative, b.currency, primaryCurrency, rates)
              const cap = convertCurrency(b.amount, b.currency, primaryCurrency, rates)
              const pct = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0
              const meta = financeCategoryMeta(b.category)
              const over = spent > cap
              return (
                <View key={b._id} style={{ gap: 7 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 12, color: colors.text, flex: 1 }}
                    >
                      {meta.label}
                    </Text>
                    <Numeral style={{ fontSize: 11, color: colors.mutedText }}>
                      {pct}%
                    </Numeral>
                  </View>
                  <ProgressBar
                    pct={pct}
                    color={over ? colors.negative : pct >= 85 ? colors.warning : colors.text}
                  />
                </View>
              )
            })
          )}
        </Surface>

        <Surface style={{ padding: 18, gap: 12 }}>
          <PanelHead
            title="Subscriptions"
            hint={`${activeSubCount} active · per month`}
            linkLabel="Manage"
            onPress={() => router.push("/(tabs)/subscriptions" as never)}
          />

          {subscriptions === undefined ? (
            <ActivityIndicator size="small" color={colors.mutedText} />
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ gap: 4 }}>
                <Numeral style={{ fontSize: 24 }}>
                  {formatCurrencyAmount(subscriptionMonthly, primaryCurrency)}
                </Numeral>
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  fixed monthly cost
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/subscriptions" as never)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.mutedText }}>Open tracker</Text>
              </TouchableOpacity>
            </View>
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  )
}
