import React, { useMemo, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/expo"
import { api } from "@/convex/_generated/api"
import {
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Trash2,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { Label, Numeral, Surface } from "@/components/ui/surface"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/hooks/use-alert"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  financeCategoryMeta,
  currentMonthKey,
  monthLabel,
  shiftMonth,
} from "@/constants/finance"

export default function BudgetsScreen() {
  const { colors } = useThemeColor()
  const { isSignedIn } = useAuth()
  const { showToast } = useAlert()
  const [month, setMonth] = useState(currentMonthKey())

  const budgets = useQuery(api.budgets.list, isSignedIn ? { month } : "skip")
  const transactions = useQuery(api.transactions.list, isSignedIn ? { month } : "skip")
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const removeMutation = useMutation(api.budgets.remove)

  const { primaryCurrency, rates } = usePrimaryCurrency()

  const rows = useMemo(() => {
    const txns = transactions || []
    return (budgets || []).map((b) => {
      const meta = financeCategoryMeta(b.category)
      const spentNative = txns
        .filter((t) => t.type === "expense" && t.category === b.category)
        .reduce((s, t) => s + t.amount, 0)
      const spent = convertCurrency(spentNative, b.currency, primaryCurrency, rates)
      const cap = convertCurrency(b.amount, b.currency, primaryCurrency, rates)
      const pct = cap > 0 ? Math.round((spent / cap) * 100) : 0
      const remaining = cap - spent
      return { budget: b, meta, spent, cap, pct, remaining }
    }).sort((a, b) => b.pct - a.pct)
  }, [budgets, transactions, primaryCurrency, rates])

  const subscriptionSpendByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of subscriptions || []) {
      if (s.isActive === false) continue
      const cycle = (s.cycle || "monthly").toLowerCase()
      let nativeMonthly = s.price
      if (cycle === "quarterly") nativeMonthly = s.price / 3
      else if (cycle === "semi-annual") nativeMonthly = s.price / 6
      else if (cycle === "yearly") nativeMonthly = s.price / 12
      else if (cycle === "weekly") nativeMonthly = s.price * 4.33
      else if (cycle === "daily") nativeMonthly = s.price * 30
      else if (cycle === "none") nativeMonthly = 0
      const converted = convertCurrency(nativeMonthly, s.currency, primaryCurrency, rates)
      map.set(s.category, (map.get(s.category) || 0) + converted)
    }
    return map
  }, [subscriptions, primaryCurrency, rates])

  const totals = useMemo(() => {
    const cap = rows.reduce((s, r) => s + r.cap, 0)
    const spent = rows.reduce((s, r) => s + r.spent, 0)
    return { cap, spent, pct: cap > 0 ? Math.round((spent / cap) * 100) : 0 }
  }, [rows])

  const handleDelete = async (id: string) => {
    try {
      await removeMutation({ id: id as never })
      showToast("Budget removed", "success")
    } catch {
      showToast("Failed to remove budget", "error")
    }
  }

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 14,
          paddingBottom: 110,
        }}
      >
        {/* Month + totals */}
        <Surface folderTab style={{ padding: 18, paddingTop: 36, gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <View style={{ gap: 3 }}>
              <Label>Budgets</Label>
              <Text style={{ fontSize: 15, fontWeight: "500", letterSpacing: -0.2, color: colors.text }}>
                {monthLabel(month)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity
                onPress={() => setMonth(shiftMonth(month, -1))}
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
                <ChevronLeft size={15} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMonth(shiftMonth(month, 1))}
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
                <ChevronRight size={15} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
            <Numeral style={{ fontSize: 28 }}>
              {formatCurrencyAmount(totals.spent, primaryCurrency)}
            </Numeral>
            <Text style={{ fontSize: 11, color: colors.mutedText, paddingBottom: 5 }}>
              of {formatCurrencyAmount(totals.cap, primaryCurrency)} · {totals.pct}%
            </Text>
          </View>

          {totals.cap > 0 ? (
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
                  width: `${Math.min(100, totals.pct)}%`,
                  backgroundColor:
                    totals.spent > totals.cap
                      ? colors.negative
                      : totals.pct >= 85
                      ? colors.warning
                      : colors.text,
                }}
              />
            </View>
          ) : null}
        </Surface>

        {/* Budget rows */}
        {budgets === undefined || transactions === undefined ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : rows.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: "dashed",
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              gap: 6,
            }}
          >
            <PiggyBank size={24} color={colors.subtleText} />
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text }}>
              No budgets for {monthLabel(month).split(" ")[0]}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText, textAlign: "center" }}>
              Set per-category spending limits to track progress
            </Text>
          </View>
        ) : (
          rows.map(({ budget, meta, spent, cap, pct, remaining }) => {
            const subSpend = subscriptionSpendByCategory.get(budget.category) || 0
            return (
              <View
                key={budget._id}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 20,
                  padding: 16,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      backgroundColor: colors.surfaceInset,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DynamicIcon name={meta.icon} size={15} color={colors.mutedText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "500", color: colors.text }}>
                      {meta.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>
                      {formatCurrencyAmount(spent, primaryCurrency)} of{" "}
                      {formatCurrencyAmount(cap, primaryCurrency)}
                      {subSpend > 0 ? ` · incl. ${formatCurrencyAmount(subSpend, primaryCurrency)} subs` : ""}
                    </Text>
                  </View>
                  <Numeral
                    style={{
                      fontSize: 13,
                      color: remaining < 0 ? colors.negative : pct >= 85 ? colors.warning : colors.text,
                    }}
                  >
                    {pct}%
                  </Numeral>
                  <TouchableOpacity onPress={() => handleDelete(budget._id)} style={{ padding: 4 }}>
                    <Trash2 size={14} color={colors.mutedText} />
                  </TouchableOpacity>
                </View>
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
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: remaining < 0 ? colors.negative : pct >= 85 ? colors.warning : colors.text,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: remaining < 0 ? colors.negative : colors.mutedText, fontWeight: remaining < 0 ? "500" : "400" }}>
                  {remaining >= 0
                    ? `${formatCurrencyAmount(remaining, primaryCurrency)} remaining`
                    : `Over by ${formatCurrencyAmount(Math.abs(remaining), primaryCurrency)}`}
                </Text>
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
