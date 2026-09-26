import React, { useMemo } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { ChevronRight } from "lucide-react-native"
import { DynamicIcon } from "@/components/dynamic-icon"
import { usePrimaryCurrency } from "@/hooks/use-primary-currency"
import { useThemeColor } from "@/hooks/use-theme-color"
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency"
import { financeCategoryMeta } from "@/constants/finance"

interface TransactionCalendarProps {
  transactions: Array<{
    _id: string
    type: string
    amount: number
    currency: string
    category: string
    date: string
    note?: string
    icon?: string
    color?: string
  }>
}

export function TransactionCalendar({ transactions }: TransactionCalendarProps) {
  const router = useRouter()
  const { colors } = useThemeColor()
  const { primaryCurrency, rates } = usePrimaryCurrency()

  const dailyTotals = useMemo(() => {
    const now = new Date()
    const days: Array<{
      date: string
      label: string
      income: number
      expense: number
      items: TransactionCalendarProps["transactions"]
    }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const items = transactions.filter((t) => t.date === key)
      let income = 0
      let expense = 0
      for (const t of items) {
        const converted = convertCurrency(t.amount, t.currency, primaryCurrency, rates)
        if (t.type === "income") income += converted
        else if (t.type === "expense") expense += converted
      }
      days.push({
        date: key,
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }),
        income,
        expense,
        items,
      })
    }
    return days
  }, [transactions, primaryCurrency, rates])

  const maxFlow = Math.max(1, ...dailyTotals.map((d) => d.income + d.expense))

  return (
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
        <View>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
            Daily Cash Flow · 7 Days
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedText }}>
            Logged income and expenses per day
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/transactions" as never)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.mutedText }}>All</Text>
            <ChevronRight size={14} color={colors.mutedText} />
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ padding: 14, gap: 12 }}>
        {dailyTotals.map((d) => (
          <View key={d.date} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                {d.label}
              </Text>
              {d.items.length === 0 ? (
                <Text style={{ fontSize: 11, color: colors.subtleText }}>—</Text>
              ) : (
                <Text style={{ fontSize: 11, color: colors.mutedText }}>
                  <Text style={{ color: colors.emerald, fontWeight: "700" }}>
                    +{formatCurrencyAmount(d.income, primaryCurrency)}
                  </Text>{" "}
                  <Text style={{ color: colors.destructive, fontWeight: "700" }}>
                    -{formatCurrencyAmount(d.expense, primaryCurrency)}
                  </Text>
                </Text>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                height: 7,
                borderRadius: 4,
                backgroundColor: colors.surface,
                overflow: "hidden",
                gap: 2,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${((d.income / maxFlow) * 100).toFixed(1)}%` as `${number}%`,
                  backgroundColor: colors.emerald,
                }}
              />
              <View
                style={{
                  height: "100%",
                  width: `${((d.expense / maxFlow) * 100).toFixed(1)}%` as `${number}%`,
                  backgroundColor: colors.destructive,
                }}
              />
            </View>
            {d.items.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {d.items.slice(0, 6).map((t) => {
                  const meta = financeCategoryMeta(t.category)
                  return (
                    <View
                      key={t._id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <DynamicIcon name={t.icon || meta.icon} size={11} color={colors.text} />
                      <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: "600", color: colors.text, maxWidth: 90 }}>
                        {t.note || meta.label}
                      </Text>
                    </View>
                  )
                })}
                {d.items.length > 6 ? (
                  <Text style={{ fontSize: 10, color: colors.mutedText }}>
                    +{d.items.length - 6} more
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  )
}
