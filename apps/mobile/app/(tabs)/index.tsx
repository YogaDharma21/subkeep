import React, { useMemo } from "react"
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
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Repeat,
  PiggyBank,
  ChevronRight,
  Target,
  AlertTriangle,
  Sparkles,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import {
  currentMonthKey,
  monthLabel,
  financeCategoryMeta,
} from "@/constants/finance"

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
    return { income, expense, net: income - expense, byCategory }
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

  const budgetCap = userSettings?.monthlyBudgetCap
  const monthlySpend = stats.expense + subscriptionMonthly
  const budgetUsedPct =
    budgetCap && budgetCap > 0 ? Math.round((monthlySpend / budgetCap) * 100) : null
  const isBudgetExceeded = !!budgetCap && monthlySpend > budgetCap

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
      .slice(0, 5)
  }, [transactions])

  const loading = accounts === undefined || transactions === undefined
  const monthShort = monthLabel(month).split(" ")[0]

  const quickLinks = [
    { label: "Transactions", icon: ArrowLeftRight, bg: colors.primary, fg: colors.primaryForeground, route: "/(tabs)/transactions" },
    { label: "Accounts", icon: Wallet, bg: colors.blue, fg: "#ffffff", route: "/(tabs)/accounts" },
    { label: "Budgets", icon: PiggyBank, bg: colors.emerald, fg: "#ffffff", route: "/(tabs)/budgets" },
    { label: activeSubCount > 0 ? `Subs (${activeSubCount})` : "Subs", icon: Repeat, bg: "#8b5cf6", fg: "#ffffff", route: "/(tabs)/subscriptions" },
  ]

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 16,
          paddingBottom: 110,
        }}
      >
        {/* Net Worth + Cash Flow Hero */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Wallet size={14} color={colors.primary} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                Money Overview · {monthLabel(month)}
              </Text>
            </View>
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.mutedText }}>
              {primaryCurrency}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "900", color: colors.text }}>
                  {formatCurrencyAmount(netWorth, primaryCurrency)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                  Net Worth
                </Text>
              </View>
              <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />
              <View style={{ flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <ArrowDownRight size={14} color={colors.emerald} />
                  <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "900", color: colors.emerald }}>
                    {formatCurrencyAmount(stats.income, primaryCurrency)}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                  In · {monthShort}
                </Text>
              </View>
              <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />
              <View style={{ flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <ArrowUpRight size={14} color={colors.destructive} />
                  <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "900", color: colors.destructive }}>
                    {formatCurrencyAmount(stats.expense, primaryCurrency)}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedText, textTransform: "uppercase" }}>
                  Out · {monthShort}
                </Text>
              </View>
            </View>
          )}

          {budgetCap && budgetCap > 0 && !loading ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 10,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Target size={14} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                    Spend vs Cap
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: isBudgetExceeded ? colors.destructive : colors.mutedText,
                  }}
                >
                  {formatCurrencyAmount(monthlySpend, primaryCurrency)} / {formatCurrencyAmount(budgetCap, primaryCurrency)} ({budgetUsedPct}%)
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  width: "100%",
                  backgroundColor: colors.surface,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${Math.min(100, budgetUsedPct || 0)}%`,
                    backgroundColor: isBudgetExceeded
                      ? colors.destructive
                      : (budgetUsedPct || 0) >= 85
                      ? colors.amber
                      : colors.emerald,
                  }}
                />
              </View>
              {isBudgetExceeded ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <AlertTriangle size={12} color={colors.destructive} />
                  <Text style={{ fontSize: 10, fontWeight: "600", color: colors.destructive }}>
                    Over budget by {formatCurrencyAmount(monthlySpend - (budgetCap || 0), primaryCurrency)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Quick Links */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {quickLinks.map((q) => {
            const Icon = q.icon
            return (
              <TouchableOpacity
                key={q.label}
                activeOpacity={0.7}
                onPress={() => router.push(q.route as never)}
                style={{
                  width: "48.5%",
                  flexGrow: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: q.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} color={q.fg} />
                </View>
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "700", color: colors.text, flex: 1 }}>
                  {q.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Recent Transactions */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions" as never)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText }}>
                  View all
                </Text>
                <ChevronRight size={14} color={colors.mutedText} />
              </View>
            </TouchableOpacity>
          </View>
          {transactions === undefined ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : recentTransactions.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.mutedText }}>
                No transactions this month
              </Text>
              <Text style={{ fontSize: 11, color: colors.subtleText }}>
                Use the + button to log your first one
              </Text>
            </View>
          ) : (
            recentTransactions.map((t, i) => {
              const meta = financeCategoryMeta(t.category)
              return (
                <TouchableOpacity
                  key={t._id}
                  activeOpacity={0.7}
                  onPress={() => router.push("/(tabs)/transactions" as never)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    gap: 10,
                    borderBottomWidth: i < recentTransactions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: t.color || meta.color,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DynamicIcon name={t.icon || meta.icon} size={16} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                      {t.note || meta.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>
                      {meta.label} · {t.date}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: t.type === "income" ? colors.emerald : t.type === "transfer" ? colors.blue : colors.destructive,
                    }}
                  >
                    {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                    {formatCurrencyAmount(
                      convertCurrency(t.amount, t.currency, primaryCurrency, rates),
                      primaryCurrency
                    )}
                  </Text>
                </TouchableOpacity>
              )
            })
          )}
        </View>

        {/* Top Spending */}
        {topCategories.length > 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                Top Spending · {monthShort}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/stats" as never)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText }}>
                    Analytics
                  </Text>
                  <ChevronRight size={14} color={colors.mutedText} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 14, gap: 12 }}>
              {topCategories.map((cat) => (
                <View key={cat.value} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      backgroundColor: cat.color,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DynamicIcon name={cat.icon} size={15} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                        {cat.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.mutedText }}>
                        {formatCurrencyAmount(cat.amount, primaryCurrency)}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: colors.surface,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${cat.pct}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText, width: 34, textAlign: "right" }}>
                    {cat.pct}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Budgets snapshot */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 14,
            gap: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} color={colors.mutedText} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text, textTransform: "uppercase" }}>
                Budgets · {monthShort}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/budgets" as never)}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.mutedText }}>
                View
              </Text>
            </TouchableOpacity>
          </View>
          {budgets === undefined || transactions === undefined ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : budgets.length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.mutedText }}>
              No budgets set for {monthShort}. Set per-category limits to stay on track.
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
              return (
                <View key={b._id} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                      {meta.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: spent > cap ? colors.destructive : colors.mutedText,
                      }}
                    >
                      {pct}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: colors.surface,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: spent > cap ? colors.destructive : pct >= 85 ? colors.amber : colors.emerald,
                      }}
                    />
                  </View>
                </View>
              )
            })
          )}
        </View>

        {/* Subscriptions preview */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 14,
            gap: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Repeat size={14} color="#8b5cf6" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                Subscriptions
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/subscriptions" as never)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText }}>
                  Manage
                </Text>
                <ChevronRight size={14} color={colors.mutedText} />
              </View>
            </TouchableOpacity>
          </View>
          {subscriptions === undefined ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: colors.mutedText }}>
                <Text style={{ fontWeight: "800", color: colors.text }}>{activeSubCount}</Text> active ·{" "}
                <Text style={{ fontWeight: "800", color: colors.text }}>
                  {formatCurrencyAmount(subscriptionMonthly, primaryCurrency)}
                </Text>/mo
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(tabs)/subscriptions" as never)}
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text }}>
                  Open tracker
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <UpcomingReminders
          subscriptions={subscriptions || []}
          primaryCurrency={primaryCurrency}
          rates={rates}
          onMarkCanceled={async () => {}}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
