import React, { useMemo, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useMutation, useQuery } from "convex/react"
import { useAuth } from "@clerk/clerk-expo"
import { api } from "@/convex/_generated/api"
import {
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Trash2,
} from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { useAlert } from "@/components/custom-alert-provider"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import {
  expenseCategories,
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
  const [category, setCategory] = useState("food")
  const [amount, setAmount] = useState("")

  const budgets = useQuery(api.budgets.list, isSignedIn ? { month } : "skip")
  const transactions = useQuery(api.transactions.list, isSignedIn ? { month } : "skip")
  const subscriptions = useQuery(api.subscriptions.list, isSignedIn ? {} : "skip")
  const upsertMutation = useMutation(api.budgets.upsert)
  const removeMutation = useMutation(api.budgets.remove)
  const copyMutation = useMutation(api.budgets.copyFromPreviousMonth)

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

  const usedCategories = new Set((budgets || []).map((b) => b.category))
  const availableCategories = expenseCategories.filter((c) => !usedCategories.has(c.value))

  const handleSave = async () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      showToast("Please enter a valid budget amount", "error")
      return
    }
    try {
      await upsertMutation({ category, amount: parsed, currency: primaryCurrency, month })
      const meta = financeCategoryMeta(category)
      showToast(`Budget set for ${meta.label}`, "success")
      setAmount("")
      if (availableCategories.length > 1) {
        const next = availableCategories.find((c) => c.value !== category)
        if (next) setCategory(next.value)
      }
    } catch {
      showToast("Failed to save budget", "error")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeMutation({ id: id as never })
      showToast("Budget removed", "success")
    } catch {
      showToast("Failed to remove budget", "error")
    }
  }

  const handleCopy = async () => {
    try {
      const copied = await copyMutation({ month, fromMonth: shiftMonth(month, -1) })
      if (copied > 0) showToast(`Copied ${copied} budget${copied > 1 ? "s" : ""} from last month`, "success")
      else showToast("No budgets to copy from last month", "info")
    } catch {
      showToast("Failed to copy budgets", "error")
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => setMonth(shiftMonth(month, -1))}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <PiggyBank size={15} color={colors.emerald} />
                <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>
                  {monthLabel(month)}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.mutedText }}>
                {formatCurrencyAmount(totals.spent, primaryCurrency)} of{" "}
                {formatCurrencyAmount(totals.cap, primaryCurrency)} ({totals.pct}%)
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setMonth(shiftMonth(month, 1))}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          {totals.cap > 0 ? (
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.surface,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${Math.min(100, totals.pct)}%`,
                  backgroundColor:
                    totals.spent > totals.cap
                      ? colors.destructive
                      : totals.pct >= 85
                      ? colors.amber
                      : colors.emerald,
                }}
              />
            </View>
          ) : null}
          {(budgets?.length || 0) === 0 ? (
            <TouchableOpacity
              onPress={handleCopy}
              style={{ alignItems: "center", paddingVertical: 4 }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                Copy last month&apos;s budgets
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Add budget */}
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
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
            Set Category Budget
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, maxHeight: 150 }}>
            <ScrollView contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {(availableCategories.length > 0 ? availableCategories : expenseCategories).map((c) => (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: category === c.value ? colors.surfaceHover : colors.surface,
                    borderWidth: category === c.value ? 1.5 : 0,
                    borderColor: colors.primary,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: c.color,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DynamicIcon name={c.icon} size={12} color="#ffffff" />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder={`Monthly cap in ${primaryCurrency}`}
              placeholderTextColor={colors.mutedText}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 9,
                fontSize: 14,
                color: colors.text,
                backgroundColor: colors.surface,
              }}
            />
            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primaryForeground }}>
                Set
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
              borderRadius: 14,
              padding: 28,
              alignItems: "center",
              gap: 6,
            }}
          >
            <PiggyBank size={24} color={colors.subtleText} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
              No budgets for {monthLabel(month).split(" ")[0]}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedText, textAlign: "center" }}>
              Set per-category spending limits above to track progress
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
                  borderRadius: 14,
                  padding: 14,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: meta.color,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DynamicIcon name={meta.icon} size={16} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                      {meta.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>
                      {formatCurrencyAmount(spent, primaryCurrency)} of{" "}
                      {formatCurrencyAmount(cap, primaryCurrency)}
                      {subSpend > 0 ? ` · incl. ${formatCurrencyAmount(subSpend, primaryCurrency)} subs` : ""}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: remaining < 0 ? colors.destructive : pct >= 85 ? colors.amber : colors.emerald,
                    }}
                  >
                    {pct}%
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(budget._id)} style={{ padding: 4 }}>
                    <Trash2 size={14} color={colors.mutedText} />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: colors.surface,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: remaining < 0 ? colors.destructive : pct >= 85 ? colors.amber : colors.emerald,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: remaining < 0 ? colors.destructive : colors.mutedText, fontWeight: remaining < 0 ? "700" : "400" }}>
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
